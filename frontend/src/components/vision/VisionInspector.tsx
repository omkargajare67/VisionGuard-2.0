import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchSamples,
  getSampleImageUrl,
  analyzeSample,
  analyzeUploadedImage,
} from '../../services/api';
import type { SampleMetadata, InspectionResult } from '../../types';
import {
  Play,
  RotateCcw,
  Upload,
  Camera,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  Sliders,
  FileCheck,
} from 'lucide-react';

interface VisionInspectorProps {
  onInspectionComplete?: (result: InspectionResult) => void;
}

const BENCHMARK_DETAILS: Record<
  string,
  { label: string; defect: string; status: 'PASS' | 'REJECT'; desc: string }
> = {
  'VG-001': {
    label: 'VG-001: Nominal Reference',
    defect: 'Conforming (Zero Defects)',
    status: 'PASS',
    desc: 'Golden unit with intact geometry, label, blue marking, and all 3 ICs present.',
  },
  'VG-002': {
    label: 'VG-002: Missing Label Defect',
    defect: 'Defect: Missing QC Label (L=0)',
    status: 'REJECT',
    desc: 'White quality control label is missing from the designated upper inspection ROI.',
  },
  'VG-003': {
    label: 'VG-003: Incorrect Marking Colour',
    defect: 'Defect: Non-Conforming Color (M=0)',
    status: 'REJECT',
    desc: 'Inspection dot is painted red instead of the required standard industrial blue.',
  },
  'VG-004': {
    label: 'VG-004: Missing Component Defect',
    defect: 'Defect: Missing IC Component (C=0)',
    status: 'REJECT',
    desc: 'Middle electronic IC chip component is absent from the printed circuit footprint.',
  },
  'VG-005': {
    label: 'VG-005: Structural Contour Defect',
    defect: 'Defect: Corner Chamfer Damage (G=0)',
    status: 'REJECT',
    desc: 'Workpiece top-right perimeter has an irregular contour cut violating geometric boundary.',
  },
  'VG-006': {
    label: 'VG-006: Surface Scratch Defect',
    defect: 'Defect: Deep Surface Abrasion (S=1)',
    status: 'REJECT',
    desc: 'Linear surface gouge detected across central housing exceeding threshold length.',
  },
};

export const VisionInspector: React.FC<VisionInspectorProps> = ({ onInspectionComplete }) => {
  const [samples, setSamples] = useState<SampleMetadata[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('VG-001');
  const [inputMode, setInputMode] = useState<'synthetic' | 'upload' | 'webcam'>('synthetic');

  // Image and Inspection States
  const [currentRawUrl, setCurrentRawUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [inspectionResult, setInspectionResult] = useState<InspectionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Advanced section accordion toggle
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [advancedStage, setAdvancedStage] = useState<
    'annotated' | 'edge' | 'enhanced' | 'grayscale' | 'original'
  >('annotated');
  const [viewMode, setViewMode] = useState<'annotated' | 'original'>('annotated');

  // Webcam Lifecycle Refs and State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);

  // Load sample catalog on mount
  useEffect(() => {
    fetchSamples()
      .then((data) => {
        setSamples(data);
        if (data.length > 0) {
          setSelectedSampleId(data[0].sample_id);
          setCurrentRawUrl(getSampleImageUrl(data[0].sample_id));
        }
      })
      .catch((err) => {
        setErrorMessage(`Failed to load synthetic samples: ${err.message}`);
      });
  }, []);

  // Sync selected synthetic sample raw preview
  useEffect(() => {
    if (inputMode === 'synthetic' && selectedSampleId) {
      setCurrentRawUrl(getSampleImageUrl(selectedSampleId));
      setInspectionResult(null);
      setErrorMessage(null);
    }
  }, [selectedSampleId, inputMode]);

  // Robust webcam stopping function
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  }, []);

  // Stop webcam whenever switching away from webcam input mode
  useEffect(() => {
    if (inputMode !== 'webcam') {
      stopWebcam();
    }
  }, [inputMode, stopWebcam]);

  // Stop webcam on component unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (isWebcamActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isWebcamActive]);

  const startWebcam = async () => {
    setErrorMessage(null);
    stopWebcam();

    if (!navigator?.mediaDevices?.getUserMedia) {
      setErrorMessage('Camera access is not supported by this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      setIsWebcamActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      stopWebcam();
      let friendlyError = 'Could not access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        friendlyError = 'Camera permission was denied. Please allow camera permissions in your browser address bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        friendlyError = 'No video capture hardware (webcam) detected on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        friendlyError = 'Camera is already in use by another application or browser tab.';
      } else {
        friendlyError = `Camera error: ${err.message || 'Unknown error'}`;
      }
      setErrorMessage(friendlyError);
    }
  };

  const captureWebcamFrame = () => {
    if (!videoRef.current) {
      setErrorMessage('Camera frame not available for capture.');
      return;
    }
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setErrorMessage('Camera stream is still initializing. Please try again in a moment.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCurrentRawUrl(dataUrl);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' });
        setUploadedFile(file);
      }
    }, 'image/jpeg', 0.92);

    stopWebcam();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setCurrentRawUrl(URL.createObjectURL(file));
      setInspectionResult(null);
      setErrorMessage(null);
    }
  };

  const handleRunInspection = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let result: InspectionResult;
      if (inputMode === 'synthetic') {
        result = await analyzeSample(selectedSampleId);
      } else if (uploadedFile) {
        result = await analyzeUploadedImage(uploadedFile, uploadedFile.name);
      } else {
        throw new Error('Please select a synthetic workpiece or upload/capture an image first.');
      }
      setInspectionResult(result);
      onInspectionComplete?.(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Inspection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInspectionResult(null);
    setErrorMessage(null);
    if (inputMode === 'synthetic') {
      setCurrentRawUrl(getSampleImageUrl(selectedSampleId));
    } else {
      setCurrentRawUrl(null);
      setUploadedFile(null);
    }
  };

  // Image to display in main workspace
  const displayedImageUrl =
    viewMode === 'annotated' && inspectionResult?.annotated_image
      ? inspectionResult.annotated_image
      : currentRawUrl;

  const currentBenchmark = BENCHMARK_DETAILS[selectedSampleId] || {
    label: selectedSampleId,
    defect: 'Custom Workpiece',
    status: 'UNKNOWN',
    desc: 'Uploaded or captured product workpiece',
  };

  return (
    <div className="space-y-10 font-sans">
      {/* ========================================================= */}
      {/* PAGE HEADER                                               */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="w-10 h-1 bg-[#F59A16] rounded-full mb-2" />
          <h1 className="text-3xl font-extrabold text-[#252B35] tracking-tight">
            Vision Inspection
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Inspect products, detect manufacturing defects and evaluate quality using computer vision.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-600">
            OpenCV Pipeline: <strong className="text-slate-900">Active</strong>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold text-rose-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 1: SELECT INSPECTION SOURCE                          */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-[#F59A16] text-white flex items-center justify-center text-xs font-bold font-mono">
            1
          </span>
          <h2 className="text-lg font-bold text-[#252B35]">Select Inspection Source</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Source 1: Synthetic Samples */}
          <button
            onClick={() => {
              setInputMode('synthetic');
              setInspectionResult(null);
            }}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              inputMode === 'synthetic'
                ? 'bg-white border-[#F59A16] shadow-md shadow-[#F59A16]/10 ring-2 ring-[#F59A16]'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`p-2.5 rounded-xl ${
                  inputMode === 'synthetic' ? 'bg-[#F59A16]/10 text-[#F59A16]' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              {inputMode === 'synthetic' && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59A16]" />
              )}
            </div>
            <div className="mt-4">
              <div className="text-sm font-bold text-[#252B35]">Synthetic Samples</div>
              <p className="text-xs text-[#667085] mt-1">
                Deterministic 6-sample benchmark catalog (VG-001 to VG-006)
              </p>
            </div>
          </button>

          {/* Source 2: Upload Image */}
          <button
            onClick={() => {
              setInputMode('upload');
              setInspectionResult(null);
            }}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              inputMode === 'upload'
                ? 'bg-white border-[#F59A16] shadow-md shadow-[#F59A16]/10 ring-2 ring-[#F59A16]'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`p-2.5 rounded-xl ${
                  inputMode === 'upload' ? 'bg-[#F59A16]/10 text-[#F59A16]' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Upload className="w-5 h-5" />
              </div>
              {inputMode === 'upload' && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59A16]" />
              )}
            </div>
            <div className="mt-4">
              <div className="text-sm font-bold text-[#252B35]">Upload Image</div>
              <p className="text-xs text-[#667085] mt-1">
                Load custom JPG or PNG industrial product photograph
              </p>
            </div>
          </button>

          {/* Source 3: Live Webcam */}
          <button
            onClick={() => {
              setInputMode('webcam');
              setInspectionResult(null);
            }}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              inputMode === 'webcam'
                ? 'bg-white border-[#F59A16] shadow-md shadow-[#F59A16]/10 ring-2 ring-[#F59A16]'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`p-2.5 rounded-xl ${
                  inputMode === 'webcam' ? 'bg-[#F59A16]/10 text-[#F59A16]' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Camera className="w-5 h-5" />
              </div>
              {inputMode === 'webcam' && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59A16]" />
              )}
            </div>
            <div className="mt-4">
              <div className="text-sm font-bold text-[#252B35]">Live Webcam</div>
              <p className="text-xs text-[#667085] mt-1">
                Real-time optical video acquisition via browser camera
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* STEP 2: PRODUCT SELECTION (Only for Active Source)         */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-[#F59A16] text-white flex items-center justify-center text-xs font-bold font-mono">
            2
          </span>
          <h2 className="text-lg font-bold text-[#252B35]">
            {inputMode === 'synthetic'
              ? 'Select Benchmark Workpiece'
              : inputMode === 'upload'
              ? 'Provide Custom Image'
              : 'Acquire Webcam Feed'}
          </h2>
        </div>

        {/* --- Synthetic Samples: Clean 3-Column Responsive Grid --- */}
        {inputMode === 'synthetic' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {samples.map((sample) => {
              const isSelected = selectedSampleId === sample.sample_id;
              const isPass = sample.expected_status === 'PASS';
              const details = BENCHMARK_DETAILS[sample.sample_id] || {
                label: sample.sample_id,
                defect: sample.name,
                status: sample.expected_status,
                desc: sample.description,
              };

              return (
                <div
                  key={sample.sample_id}
                  onClick={() => setSelectedSampleId(sample.sample_id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-white border-[#F59A16] ring-2 ring-[#F59A16] shadow-lg'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Large Product Thumbnail */}
                  <div className="w-full aspect-[4/3] rounded-xl bg-slate-900 overflow-hidden relative border border-slate-100 mb-4">
                    <img
                      src={getSampleImageUrl(sample.sample_id)}
                      alt={sample.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Benchmark Badge */}
                    <span
                      className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-sm ${
                        isPass
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {sample.expected_status}
                    </span>

                    {isSelected && (
                      <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-[#F59A16] text-white flex items-center justify-center shadow-md">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Sample Details */}
                  <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#252B35] font-mono">
                          {sample.sample_id}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">640×480</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-0.5">
                        {details.defect}
                      </div>
                    </div>

                    <p className="text-xs text-[#667085] leading-relaxed pt-2 border-t border-slate-100">
                      {details.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- Upload Image: Spacious Dropzone --- */}
        {inputMode === 'upload' && (
          <div className="p-8 rounded-2xl bg-white border-2 border-dashed border-slate-300 hover:border-[#F59A16] transition-colors text-center max-w-2xl mx-auto shadow-sm">
            <input
              type="file"
              id="file-upload"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer space-y-4 block">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-[#F59A16] mx-auto flex items-center justify-center">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm font-bold text-[#252B35] hover:text-[#F59A16]">
                  Click to select a file
                </span>
                <span className="text-sm text-slate-500"> or drag and drop</span>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, or JPEG up to 10MB</p>
              </div>
            </label>

            {uploadedFile && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 inline-flex items-center space-x-3 text-xs font-mono text-slate-700">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </div>
        )}

        {/* --- Live Webcam: Clean Video Stream --- */}
        {inputMode === 'webcam' && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm max-w-2xl mx-auto text-center space-y-4">
            <div className="w-full aspect-[4/3] rounded-xl bg-slate-950 overflow-hidden relative border border-slate-800 flex items-center justify-center">
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isWebcamActive ? 'block' : 'hidden'}`}
              />
              {!isWebcamActive && (
                <div className="text-center p-6 text-slate-500">
                  <Camera className="w-12 h-12 mx-auto text-slate-600 mb-2 opacity-40" />
                  <p className="text-xs">Webcam stream inactive. Click "Start Camera" below.</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isWebcamActive ? (
                <button
                  onClick={startWebcam}
                  className="px-5 py-2.5 rounded-xl bg-[#F59A16] hover:bg-[#e0890b] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Start Camera
                </button>
              ) : (
                <>
                  <button
                    onClick={captureWebcamFrame}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Capture Frame</span>
                  </button>
                  <button
                    onClick={stopWebcam}
                    className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* STEP 3: INSPECTION WORKSPACE (Two-Column Layout)          */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-[#F59A16] text-white flex items-center justify-center text-xs font-bold font-mono">
            3
          </span>
          <h2 className="text-lg font-bold text-[#252B35]">Inspection Workspace</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Large Product Image Focus (8 Cols) */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-[#F59A16]" />
                <span className="text-sm font-bold text-[#252B35]">Workpiece Optical Display</span>
              </div>

              {inspectionResult && (
                <div className="flex items-center space-x-1.5 p-1 rounded-lg bg-slate-100 text-xs font-medium">
                  <button
                    onClick={() => setViewMode('annotated')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      viewMode === 'annotated'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Annotated
                  </button>
                  <button
                    onClick={() => setViewMode('original')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      viewMode === 'original'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Original
                  </button>
                </div>
              )}
            </div>

            {/* The Image Itself - Main Visual Focus */}
            <div className="w-full aspect-[4/3] rounded-xl bg-slate-950 overflow-hidden relative border border-slate-200 flex items-center justify-center">
              {displayedImageUrl ? (
                <img
                  src={displayedImageUrl}
                  alt="Workpiece under inspection"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-500 text-xs text-center p-6">
                  <Layers className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                  <span>No workpiece loaded. Select a sample above.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-1">
              <span>Resolution: 640×480 RGB</span>
              <span>Source: {inputMode.toUpperCase()}</span>
            </div>
          </div>

          {/* RIGHT: Selected Sample Info & Action Controls (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Sample Information Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#252B35] pb-2 border-b border-slate-100">
                Selected Workpiece Target
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-mono">IDENTIFIER</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {selectedSampleId}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-mono">SPECIFICATION</span>
                  <span className="font-semibold text-slate-800">{currentBenchmark.defect}</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-mono">BENCHMARK GROUND TRUTH</span>
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      currentBenchmark.status === 'PASS'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    EXPECTED: {currentBenchmark.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Run Inspection Action Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#252B35]">Execute Inspection</h3>
              <p className="text-xs text-[#667085]">
                Process image through OpenCV feature detectors (Canny, CLAHE, HSV, Contour Analysis).
              </p>

              <button
                onClick={handleRunInspection}
                disabled={isLoading || !displayedImageUrl}
                className="w-full py-4 px-6 rounded-xl bg-[#F59A16] hover:bg-[#e0890b] text-white font-bold text-base shadow-lg shadow-[#F59A16]/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <Clock className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
                <span>{isLoading ? 'Running Inspection...' : 'Run Inspection'}</span>
              </button>

              {inspectionResult && (
                <button
                  onClick={handleReset}
                  className="w-full py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Results</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* STEP 4: INSPECTION RESULTS                                */}
      {/* ========================================================= */}
      {inspectionResult && (
        <section className="space-y-6">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-[#F59A16] text-white flex items-center justify-center text-xs font-bold font-mono">
              4
            </span>
            <h2 className="text-lg font-bold text-[#252B35]">Inspection Results &amp; Quality Verdict</h2>
          </div>

          {/* Verdict Banner */}
          <div
            className={`p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              inspectionResult.status === 'PASS'
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-rose-50/70 border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
                  inspectionResult.status === 'PASS' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {inspectionResult.status === 'PASS' ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <XCircle className="w-7 h-7" />
                )}
              </div>

              <div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-2xl font-extrabold tracking-tight ${
                      inspectionResult.status === 'PASS' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {inspectionResult.status === 'PASS'
                      ? 'PASS — QUALITY APPROVED'
                      : 'REJECT — NON-CONFORMING'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Category:{' '}
                  <strong className="text-slate-900">
                    {inspectionResult.defect_descriptions[0] ||
                      (inspectionResult.status === 'PASS' ? 'Nominal Conforming' : 'Defect Detected')}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono text-slate-500">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                Execution Time:{' '}
                <strong className="text-slate-900">
                  {inspectionResult.processing_time_ms.toFixed(1)} ms
                </strong>
              </div>
            </div>
          </div>

          {/* 6 Individual Checks Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#252B35]">Individual Verification Flags</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(inspectionResult.checks).map((chk) => {
                const isPassed = chk.passed;
                return (
                  <div
                    key={chk.check_name}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#252B35]">{chk.check_name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isPassed ? 'OK (FLAG 1)' : 'FAIL (FLAG 0)'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Measured:</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {chk.measured_value}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Threshold:</span>
                        <span className="font-mono text-slate-600">{chk.threshold}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 leading-normal">
                      {chk.details}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Defect Explanation Text Box */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Diagnostic Quality Assessment
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {inspectionResult.defect_descriptions.length > 0
                ? inspectionResult.defect_descriptions.join('; ')
                : 'All optical verification criteria confirmed nominal. Zero surface, geometry, or component anomalies detected.'}
            </p>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* ADVANCED DETAILS: EXPANDABLE OPENCV PREPROCESSING         */}
      {/* ========================================================= */}
      <section className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#252B35]">Advanced Image Processing</span>
              <span className="text-xs text-slate-500 block">
                Inspect 5 intermediate computer vision pipeline transformations (Grayscale, CLAHE, Canny, Annotated)
              </span>
            </div>
          </div>

          {showAdvanced ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="p-6 border-t border-slate-100 bg-[#F5F6F7] space-y-6">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'original', label: '1. Original Acquisition' },
                { id: 'grayscale', label: '2. Grayscale Matrix' },
                { id: 'enhanced', label: '3. CLAHE Enhanced' },
                { id: 'edge', label: '4. Canny Edge Map' },
                { id: 'annotated', label: '5. Annotated Inspection' },
              ].map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => setAdvancedStage(stage.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    advancedStage === stage.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {stage.label}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 max-w-3xl mx-auto">
              <div className="w-full aspect-[4/3] rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center">
                {(() => {
                  let src: string | undefined = undefined;
                  if (advancedStage === 'original') src = currentRawUrl || undefined;
                  else if (advancedStage === 'grayscale') src = inspectionResult?.grayscale_image;
                  else if (advancedStage === 'enhanced') src = inspectionResult?.enhanced_image || inspectionResult?.processed_image;
                  else if (advancedStage === 'edge') src = inspectionResult?.edge_image;
                  else if (advancedStage === 'annotated') src = inspectionResult?.annotated_image || currentRawUrl || undefined;

                  if (!src) {
                    return (
                      <div className="text-xs text-slate-400 p-6 text-center">
                        Stage image not yet generated. Run an inspection first.
                      </div>
                    );
                  }
                  return (
                    <img
                      src={src}
                      alt={`Pipeline ${advancedStage}`}
                      className="w-full h-full object-contain"
                    />
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
