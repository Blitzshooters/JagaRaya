import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Route, Clock, Radio, Plus, Crosshair, Building2, Trash2, X, Check, Camera, Layers } from 'lucide-react';

// Custom Leaflet Markers
const cctvIcon = L.divIcon({
  className: 'custom-cctv-icon',
  html: `<div class="w-8 h-8 rounded-2xl bg-[#0071e3] border-2 border-white flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const customCctvIcon = L.divIcon({
  className: 'custom-cctv-icon-user',
  html: `<div class="w-8 h-8 rounded-2xl bg-purple-600 border-2 border-white flex items-center justify-center text-white shadow-lg animate-pulse">
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

const targetPickerIcon = L.divIcon({
  className: 'custom-picker-icon',
  html: `<div class="w-9 h-9 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-white font-bold shadow-xl animate-bounce">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const CITY_COORDINATES = {
  "Semua Kota": null,
  "Jakarta": [-6.2088, 106.8456],
  "Bandung": [-6.9175, 107.6191],
  "Surabaya": [-7.2575, 112.7521],
  "Yogyakarta": [-7.7956, 110.3695],
  "Bali": [-8.6705, 115.2126],
};

function MapRecenter({ center, bounds, cityCenter }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (cityCenter) {
      map.setView(cityCenter, 13);
    } else if (center) {
      map.setView(center, 12);
    }
  }, [center, bounds, cityCenter, map]);
  return null;
}

function MapClickHandler({ isPicking, onPickLocation }) {
  useMapEvents({
    click(e) {
      if (isPicking) {
        onPickLocation(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function MapView({ initialQuery = "B 1234 XYZ" }) {
  const [query, setQuery] = useState(initialQuery);
  const [routeData, setRouteData] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCity, setSelectedCity] = useState("Semua Kota");
  const [isLoading, setIsLoading] = useState(false);

  // Custom Camera Creation Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPickingOnMap, setIsPickingOnMap] = useState(false);
  const [pickedCoords, setPickedCoords] = useState(null);
  const [newCamName, setNewCamName] = useState("");
  const [newCamCity, setNewCamCity] = useState("Bandung");
  const [newCamZone, setNewCamZone] = useState("Wilayah Kustom");
  const [newCamLat, setNewCamLat] = useState("");
  const [newCamLng, setNewCamLng] = useState("");
  const [addSuccessMsg, setAddSuccessMsg] = useState("");

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

  const handlePickOnMap = (lat, lng) => {
    const formattedLat = parseFloat(lat.toFixed(5));
    const formattedLng = parseFloat(lng.toFixed(5));
    setPickedCoords([formattedLat, formattedLng]);
    setNewCamLat(formattedLat.toString());
    setNewCamLng(formattedLng.toString());
    setShowAddModal(true);
    setIsPickingOnMap(false);
  };

  const handleCreateCamera = async (e) => {
    e.preventDefault();
    if (!newCamName || !newCamLat || !newCamLng) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/api/cameras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCamName,
          lat: parseFloat(newCamLat),
          lng: parseFloat(newCamLng),
          zone: newCamZone,
          city: newCamCity,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAddSuccessMsg(`Titik kamera "${newCamName}" berhasil ditambahkan!`);
        fetchCameras();
        setTimeout(() => {
          setShowAddModal(false);
          setAddSuccessMsg("");
          setNewCamName("");
          setPickedCoords(null);
        }, 1200);
      }
    } catch (err) {
      console.error("Gagal menambah kamera:", err);
    }
  };

  const handleDeleteCamera = async (camId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/cameras/${camId}`, { method: "DELETE" });
      if (res.ok) {
        setCameras(prev => prev.filter(c => c.id !== camId));
      }
    } catch (err) {
      console.error("Gagal menghapus kamera:", err);
    }
  };

  // Filter cameras by selected city preset
  const filteredCameras = selectedCity === "Semua Kota"
    ? cameras
    : cameras.filter(c => (c.city || "").toLowerCase() === selectedCity.toLowerCase());

  // Determine active city coordinates
  const activeCityCenter = CITY_COORDINATES[selectedCity] || (
    filteredCameras.length > 0 ? [filteredCameras[0].lat, filteredCameras[0].lng] : [-6.2088, 106.8456]
  );

  const polylineCoords = routeData?.timeline?.map(pt => [pt.lat, pt.lng]) || [];

  return (
    <div className="space-y-6 relative">
      
      {/* Header Search & Control Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0071e3] flex items-center justify-center shrink-0">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">
                Pelacak Rute GIS Kendaraan Neural
              </h2>
              <p className="text-xs text-slate-500">Pilih titik lokasi kamera kustom & atur pemantauan wilayah bebas</p>
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
                placeholder="Cari Plat (e.g. B 1234 XYZ / D 1010 BD)..."
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

        {/* City Filter & Custom Point Controls Toolbar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* City Preset Selection Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
            <span className="text-slate-400 font-medium mr-1 flex items-center">
              <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Wilayah:
            </span>
            {Object.keys(CITY_COORDINATES).map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all border ${
                  selectedCity === city
                    ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Add Camera & Map Click Picker Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsPickingOnMap(!isPickingOnMap);
                if (!isPickingOnMap) setShowAddModal(false);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all border ${
                isPickingOnMap
                  ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{isPickingOnMap ? 'Klik Lokasi di Peta...' : 'Pilih Titik di Peta'}</span>
            </button>

            <button
              onClick={() => {
                setShowAddModal(true);
                setIsPickingOnMap(false);
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Titik Kamera Custom</span>
            </button>
          </div>

        </div>

      </div>

      {/* Picking Location Banner Warning */}
      {isPickingOnMap && (
        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md flex items-center justify-between text-xs font-semibold animate-pulse">
          <div className="flex items-center space-x-2">
            <Crosshair className="w-4 h-4" />
            <span>Mode Pemilih Lokasi Aktif: Silakan KLIK di mana saja pada peta di bawah ini untuk menentukan Latitude & Longitude kamera baru.</span>
          </div>
          <button
            onClick={() => setIsPickingOnMap(false)}
            className="px-2 py-1 bg-black/20 hover:bg-black/40 rounded-lg text-white font-bold"
          >
            Batal
          </button>
        </div>
      )}

      {/* Main Map & Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Leaflet Map Box */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm h-[540px] flex flex-col relative overflow-hidden">
          <MapContainer
            center={activeCityCenter}
            zoom={12}
            scrollWheelZoom={true}
            className="w-full h-full rounded-2xl z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapRecenter
              center={polylineCoords.length > 0 ? polylineCoords[polylineCoords.length - 1] : activeCityCenter}
              bounds={polylineCoords}
              cityCenter={activeCityCenter}
            />

            <MapClickHandler
              isPicking={isPickingOnMap}
              onPickLocation={handlePickOnMap}
            />

            {/* Polyline Route */}
            {polylineCoords.length > 1 && (
              <Polyline
                positions={polylineCoords}
                pathOptions={{ color: '#0071e3', weight: 4, opacity: 0.85, dashArray: '8, 8' }}
              />
            )}

            {/* CCTV Node Markers */}
            {filteredCameras.map((cam) => {
              const isUserCustom = cam.id.startsWith("CAM-CUST");
              return (
                <Marker
                  key={cam.id}
                  position={[cam.lat, cam.lng]}
                  icon={isUserCustom ? customCctvIcon : cctvIcon}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs min-w-[160px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{cam.name}</span>
                        {isUserCustom && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 font-bold rounded text-[9px]">Custom</span>
                        )}
                      </div>
                      <p className="text-slate-500 font-mono text-[10px]">Kota: {cam.city || 'Kustom'} • Zone: {cam.zone}</p>
                      <p className="text-slate-400 font-mono text-[9px]">{cam.lat.toFixed(4)}, {cam.lng.toFixed(4)}</p>
                      <p className="text-emerald-600 font-semibold text-[10px]">Status: ONLINE Active</p>
                      {isUserCustom && (
                        <button
                          onClick={() => handleDeleteCamera(cam.id)}
                          className="w-full mt-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded font-semibold text-[10px] flex items-center justify-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus Titik Kamera</span>
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Temporary Marker for Selected Picked Point */}
            {pickedCoords && (
              <Marker position={pickedCoords} icon={targetPickerIcon}>
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-amber-700">Titik Target Dipilih</p>
                    <p className="font-mono text-[10px]">{pickedCoords[0]}, {pickedCoords[1]}</p>
                  </div>
                </Popup>
              </Marker>
            )}

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
            <span>Pemantauan GIS Active ({selectedCity === 'Semua Kota' ? 'Semua Titik Kamera' : `Kamera Wilayah ${selectedCity}`})</span>
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
                        <p className="text-[11px] text-slate-500 mt-0.5">{hit.zone || 'Wilayah'}</p>
                        <p className="text-[11px] font-semibold text-[#0071e3] mt-1 font-mono">
                          Confidence: {(hit.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>Tidak ada data rute untuk pencarian saat ini.</p>
                  <p className="text-[11px] text-slate-400">Total titik kamera aktif: {filteredCameras.length} node.</p>
                </div>
              )}
            </div>

            {/* Bottom Summary Metric */}
            <div className="pt-4 border-t border-slate-100 text-xs flex justify-between items-center font-mono">
              <span className="text-slate-500">Node Kamera Aktif</span>
              <span className="font-bold text-[#1d1d1f]">{filteredCameras.length} Titik</span>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Tambah Titik Kamera Custom */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-[#1d1d1f] flex items-center space-x-2">
                <Camera className="w-5 h-5 text-[#0071e3]" />
                <span>Tambah Titik Kamera Custom</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center space-x-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>{addSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleCreateCamera} className="space-y-4 text-xs">
                
                {/* Camera Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Nama Titik Kamera CCTV *</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Perempatan Asia Afrika / Exit Tol Pasteur"
                    value={newCamName}
                    onChange={(e) => setNewCamName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                {/* City & Zone */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Kota / Wilayah</label>
                    <select
                      value={newCamCity}
                      onChange={(e) => setNewCamCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Bandung">Bandung</option>
                      <option value="Jakarta">Jakarta</option>
                      <option value="Surabaya">Surabaya</option>
                      <option value="Yogyakarta">Yogyakarta</option>
                      <option value="Bali">Bali</option>
                      <option value="Kustom">Wilayah Kustom Lain</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Zona / Distrik</label>
                    <input
                      type="text"
                      placeholder="Misal: Bandung Pusat"
                      value={newCamZone}
                      onChange={(e) => setNewCamZone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Coordinates (Lat / Lng) */}
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#0071e3]">Koordinat Geografis (GIS Lat/Lng)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setIsPickingOnMap(true);
                      }}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline flex items-center"
                    >
                      <Crosshair className="w-3 h-3 mr-1" />
                      Klik di Peta
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Latitude (Garis Lintang)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="-6.9175"
                        value={newCamLat}
                        onChange={(e) => setNewCamLat(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Longitude (Garis Bujur)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="107.6191"
                        value={newCamLng}
                        onChange={(e) => setNewCamLng(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-slate-500 font-semibold hover:text-slate-800"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0071e3] hover:bg-blue-600 text-white font-semibold rounded-xl shadow-md transition-all active:scale-95"
                  >
                    Simpan Titik Kamera
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
