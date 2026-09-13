import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DetectorView from './components/DetectorView';
import MapView from './components/MapView';
import SearchView from './components/SearchView';
import EvaluatorView from './components/EvaluatorView';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'tracker' | 'search' | 'evaluator'
  const [trackerQuery, setTrackerQuery] = useState('B 1234 XYZ');
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/health");
      if (res.ok) {
        const data = await res.json();
        setHealthStatus(data);
      }
    } catch (err) {
      console.log("Backend offline or loading...");
    }
  };

  const handleTrackVehicleFromAnywhere = (queryText) => {
    setTrackerQuery(queryText);
    setActiveTab('tracker');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfd] text-[#1d1d1f] font-sans">
      
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthStatus={healthStatus}
        cameraCount={healthStatus?.cameras_count || 10}
      />

      {/* Main Body View */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'scanner' && (
          <DetectorView onTrackVehicle={handleTrackVehicleFromAnywhere} />
        )}

        {activeTab === 'tracker' && (
          <MapView initialQuery={trackerQuery} />
        )}

        {activeTab === 'search' && (
          <SearchView onSelectVehicleForTracking={handleTrackVehicleFromAnywhere} />
        )}

        {activeTab === 'evaluator' && (
          <EvaluatorView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 font-sans mt-8 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-slate-600">JagaRaya AI &copy; 2026 — Platform ALPR & Neural Route Tracker (YOLOv8 + MobileNetV3)</p>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
            <span>Riset TA</span>
            <span>•</span>
            <span>mAP@0.5: 94.2%</span>
            <span>•</span>
            <span>CER: 0.042</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
