import React, { useState, useEffect } from 'react';
import { Eye, MapPin, Search, ShieldCheck, Radio, BarChart3, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, healthStatus, cameraCount }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 apple-glass-nav px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0071e3] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f]">
                JagaRaya <span className="text-[#0071e3]">AI</span>
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#0071e3] border border-blue-200 font-semibold uppercase tracking-wider">
                YOLOv8 + MobileNetV3
              </span>
            </div>
            <p className="text-xs text-slate-500">Platform ALPR & Pelacak Rute Intelligent</p>
          </div>
        </div>

        {/* Navigation Tabs (Apple Segmented Controller style) */}
        <nav className="flex items-center bg-slate-200/60 p-1 rounded-2xl border border-slate-300/40">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'scanner'
                ? 'bg-white text-[#0071e3] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>AI Scanner & ALPR</span>
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'tracker'
                ? 'bg-white text-[#0071e3] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Pelacak Rute GIS</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'search'
                ? 'bg-white text-[#0071e3] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Intelligence Search</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluator')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'evaluator'
                ? 'bg-[#0071e3] text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Metrik Riset TA</span>
          </button>
        </nav>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden sm:flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 shadow-sm">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="font-medium">{cameraCount || 10} Node CCTV</span>
          </div>

          <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-700 font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{healthStatus?.ai_engine_status || 'READY'}</span>
          </div>

          <div className="hidden md:block font-mono text-slate-400 text-xs pl-1">
            {time}
          </div>
        </div>

      </div>
    </header>
  );
}
