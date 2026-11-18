import React, { useState, useEffect, useRef } from 'react';
import { SampleCatalog } from './SampleCatalog';
import { InspectionResults } from './InspectionResults';
import { DefectMetrics } from './DefectMetrics';
import { ProcessingPipeline } from './ProcessingPipeline';
import { ImageComparison } from './ImageComparison';
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
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const VisionInspector: React.FC = () => {
  const [samples, setSamples] = useState<SampleMetadata[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('VG-001');
  const [inputMode, setInputMode] = useState<'synthetic' | 'upload' | 'webcam'>('synthetic');

  // Image and Inspection States
  const [currentRawUrl, setCurrentRawUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [inspectionResult, setInspectionResult] = useState<InspectionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Webcam states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
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

  // Clean up webcam stream on unmount or mode switch
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  const startWebcam = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setWebcamStream(stream);
      setIsWebcamActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setErrorMessage(`Webcam access denied or unavailable: ${err.message}`);
      setIsWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
    setIsWebcamActive(false);
  };

  const captureWebcamFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCurrentRawUrl(dataUrl);

    // Convert dataUrl to blob file for analysis
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
        throw new Error('Please select or capture an image first.');
      }
      setInspectionResult(result);
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

  return (
    <div className="space-y-8">
      {/* Ingestion & Sample Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Industrial Optical Quality Inspection Engine</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic defect detection powered by OpenCV & NumPy algorithms
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => {
                setInputMode('synthetic');
                stopWebcam();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                inputMode === 'synthetic'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Synthetic Benchmark</span>
            </button>

            <button
              onClick={() => {
                setInputMode('upload');
                stopWebcam();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                inputMode === 'upload'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </button>

            <button
              onClick={() => {
                setInputMode('webcam');
                startWebcam();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                inputMode === 'webcam'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Webcam</span>
            </button>
          </div>
        </div>

        {/* Dynamic Mode Content */}
        {inputMode === 'synthetic' && (
          <SampleCatalog
            samples={samples}
            selectedSampleId={selectedSampleId}
            onSelectSample={(id) => setSelectedSampleId(id)}
            isLoading={isLoading}
          />
        )}

        {inputMode === 'upload' && (
          <div className="p-6 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 text-center space-y-3">
            <Upload className="w-8 h-8 mx-auto text-cyan-400 opacity-80" />
            <div>
              <p className="text-xs font-semibold text-slate-200">
                Upload Workpiece Image (JPG, PNG, BMP)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Target resolution: 640x480 (automatic resizing supported)
              </p>
            </div>
            <label className="inline-block px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 cursor-pointer transition-colors">
              <span>Choose Image File</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/bmp,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {uploadedFile && (
              <p className="text-xs text-emerald-400 font-mono">
                Selected: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        )}

        {inputMode === 'webcam' && (
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 text-center space-y-3">
            {isWebcamActive ? (
              <div className="space-y-3">
                <div className="aspect-[4/3] max-w-md mx-auto rounded-xl overflow-hidden bg-black border border-slate-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={captureWebcamFrame}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-colors flex items-center space-x-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Capture Frame (640x480)</span>
                  </button>
                  <button
                    onClick={stopWebcam}
                    className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6">
                <button
                  onClick={startWebcam}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-colors inline-flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera Stream</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Global Inspection Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              Target: <strong className="text-slate-200 font-mono">{inputMode === 'synthetic' ? selectedSampleId : uploadedFile?.name || 'Waiting for capture'}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={handleReset}
              disabled={isLoading || (!inspectionResult && !uploadedFile)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleRunInspection}
              disabled={isLoading || (!currentRawUrl && !uploadedFile)}
              className="flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing OpenCV Matrix...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run Vision Inspection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-950/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Main Inspection Results & Pipeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visual Pipeline & Comparison */}
        <div className="lg:col-span-7 space-y-6">
          <ProcessingPipeline result={inspectionResult} rawPreviewUrl={currentRawUrl} />
          <ImageComparison originalUrl={currentRawUrl} result={inspectionResult} />
        </div>

        {/* Right Column: High-Impact Verdict & Digital Telemetry */}
        <div className="lg:col-span-5 space-y-6">
          <InspectionResults result={inspectionResult} />
          <DefectMetrics result={inspectionResult} />
        </div>
      </div>
    </div>
  );
};
