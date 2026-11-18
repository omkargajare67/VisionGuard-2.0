import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export type NavTab = 'home' | 'vision' | 'deam' | '8086' | 'production' | 'monitoring';

interface NavbarProps {
  backendOnline: boolean | null;
  stage: number;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  backendOnline,
  stage: _stage,
  activeTab,
  onSelectTab,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'vision', label: 'Vision Inspection' },
    { id: 'deam', label: 'DEAM Lab' },
    { id: '8086', label: '8086 Lab' },
    { id: 'production', label: 'Production Line' },
    { id: 'monitoring', label: 'Monitoring' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#151922] border-b border-slate-800 shadow-md">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* ========================================================= */}
        {/* LEFT: BRAND & LOGO (Exact Reference Design)             */}
        {/* ========================================================= */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center space-x-3 cursor-pointer select-none group"
        >
          {/* Custom Geometric Camera / Aperture Logo in Orange */}
          <div className="relative w-8 h-8 rounded-lg border-2 border-[#F59A16] flex items-center justify-center bg-[#F59A16]/10 shadow-sm shadow-[#F59A16]/20 transition-transform group-hover:scale-105">
            <div className="w-3.5 h-3.5 rounded-full border border-[#F59A16]" />
            <div className="absolute -top-1 left-2.5 w-2 h-1 bg-[#111827] border-t border-[#F59A16]" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-1">
              <span className="text-lg font-bold text-white tracking-tight">VisionGuard</span>
              <span className="text-lg font-bold text-[#F59A16]">2.0</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal tracking-normal -mt-0.5 hidden sm:block">
              Intelligent Quality Inspection &amp; Sorting System
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CENTER: DESKTOP NAVIGATION TABS (Underline Indicator)     */}
        {/* ========================================================= */}
        <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative py-5 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F59A16] rounded-full shadow-sm shadow-[#F59A16]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ========================================================= */}
        {/* RIGHT: STATUS PILL & ORANGE "GET STARTED" BUTTON          */}
        {/* ========================================================= */}
        <div className="hidden sm:flex items-center space-x-4">
          {/* Subtle Backend Status Dot */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline === true
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                  : backendOnline === false
                  ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span>{backendOnline === true ? 'Online' : backendOnline === false ? 'Offline' : 'Connecting'}</span>
          </div>

          {/* Reference Orange "Get Started" CTA */}
          <button
            onClick={() => onSelectTab('production')}
            className="px-4 py-2 rounded-xl bg-[#F59A16] hover:bg-[#e0890b] text-white font-bold text-xs shadow-md shadow-[#F59A16]/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center space-x-2 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-6 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-[#F59A16]/10 text-[#F59A16] font-bold border border-[#F59A16]/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2">
            <button
              onClick={() => {
                onSelectTab('production');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[#F59A16] hover:bg-[#e0890b] text-white font-bold text-sm text-center shadow-md cursor-pointer"
            >
              Get Started (Production Line)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
