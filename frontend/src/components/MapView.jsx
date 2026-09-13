import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Gauge, Route, Clock, ShieldCheck, AlertTriangle, Play, RefreshCw, Radio } from 'lucide-react';

// Custom Leaflet Markers
const cctvIcon = L.divIcon({
  className: 'custom-cctv-icon',
  html: `<div class="w-8 h-8 rounded-2xl bg-[#0071e3] border-2 border-white flex items-center justify-center text-white shadow-md">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const vehicleMarkerIcon = L.divIcon({
  className: 'custom-vehicle-icon',
  html: `<div class="w-10 h-10 rounded-2xl bg-emerald-500 border-2 border-white flex items-center justify-center text-white font-bold shadow-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function MapRecenter({ center, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, 13);
    }
  }, [center, bounds, map]);
  return null;
}

export default function MapView({ initialQuery = "B 1234 XYZ" }) {
  const [query, setQuery] = useState(initialQuery);
  const [routeData, setRouteData] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCameras();
    handleSearch(initialQuery);
  }, []);

  const fetchCameras = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/cameras");
      if (res.ok) {
        const data = await res.json();
        setCameras(data);
      }
    } catch (err) {
      console.log("Using fallback camera list");
    }
  };

  const handleSearch = async (searchTarget) => {
    const q = searchTarget || query;
    if (!q) return;

    setIsLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/track?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setRouteData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultCenter = [-6.2088, 106.8456]; // Jakarta
  const polylineCoords = routeData?.timeline?.map(pt => [pt.lat, pt.lng]) || [];

  return (
    <div className="space-y-6">
      
      {/* Header Search & Control Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0071e3] flex items-center justify-center shrink-0">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">
                Pelacak Rute GIS Kendaraan Neural
              </h2>
              <p className="text-xs text-slate-500">Rekonstruksi lintasan kendaraan dari tangkapan CCTV jaringan</p>
            </div>
          </div>

          {/* Search Input Box */}
          <div className="flex items-center space-x-2 w-full md:w-96">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Cari Plat (e.g. B 1234 XYZ) atau Deskripsi..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-[#1d1d1f] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#0071e3] hover:bg-blue-600 text-white rounded-2xl text-xs font-semibold shadow-md transition-all shrink-0 active:scale-95"
            >
              {isLoading ? 'Melacak...' : 'Lacak Rute'}
            </button>
          </div>

        </div>
      </div>

      {/* Main Map & Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Leaflet Map Box */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm h-[540px] flex flex-col relative overflow-hidden">
          <MapContainer
            center={defaultCenter}
            zoom={12}
            scrollWheelZoom={true}
            className="w-full h-full rounded-2xl z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapRecenter
              center={polylineCoords.length > 0 ? polylineCoords[polylineCoords.length - 1] : defaultCenter}
              bounds={polylineCoords}
            />

            {/* Polyline Route */}
            {polylineCoords.length > 1 && (
              <Polyline
                positions={polylineCoords}
                pathOptions={{ color: '#0071e3', weight: 4, opacity: 0.85, dashArray: '8, 8' }}
              />
            )}

            {/* CCTV Node Markers */}
            {cameras.map((cam) => (
              <Marker key={cam.id} position={[cam.lat, cam.lng]} icon={cctvIcon}>
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <p className="font-bold text-slate-900">{cam.name}</p>
                    <p className="text-slate-500 font-mono text-[10px]">Zone: {cam.zone}</p>
                    <p className="text-emerald-600 font-semibold text-[10px]">Status: ONLINE Active</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Vehicle Last Position Marker */}
            {polylineCoords.length > 0 && (
              <Marker
                position={polylineCoords[polylineCoords.length - 1]}
                icon={vehicleMarkerIcon}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <p className="font-bold text-emerald-600">Posisi Terakhir Terdeteksi</p>
                    <p className="font-mono text-slate-900 font-extrabold">{routeData?.target_query}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Map Overlay Badge */}
          <div className="absolute top-7 right-7 z-10 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Map Live Monitoring (Jakarta GIS)</span>
          </div>
        </div>

        {/* Timeline & Track Analytics */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm h-[540px] flex flex-col justify-between">
            <div className="space-y-4 overflow-y-auto pr-1">
              
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1d1d1f] flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#0071e3]" />
                  <span>Timeline Deteksi CCTV</span>
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 bg-blue-50 text-[#0071e3] font-mono rounded-full border border-blue-200 font-bold">
                  {routeData?.timeline?.length || 0} Deteksi
                </span>
              </div>

              {routeData?.timeline && routeData.timeline.length > 0 ? (
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {routeData.timeline.map((hit, idx) => (
                    <div key={idx} className="relative pl-7 space-y-1">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#0071e3] border-2 border-white"></div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#1d1d1f]">{hit.camera_name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{hit.time || '10:15 WIB'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{hit.zone || 'Jakarta'}</p>
                        <p className="text-[11px] font-semibold text-[#0071e3] mt-1 font-mono">
                          Confidence: {(hit.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>Tidak ada data rute untuk pencarian saat ini.</p>
                </div>
              )}
            </div>

            {/* Bottom Summary Metric */}
            <div className="pt-4 border-t border-slate-100 text-xs flex justify-between items-center font-mono">
              <span className="text-slate-500">Kecepatan Rata-rata Est.</span>
              <span className="font-bold text-[#1d1d1f]">42 km/jam</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
