import React, { useState, useEffect } from 'react';
import { Search, Filter, Camera, Clock, Navigation, Tag, ShieldCheck, Car, Eye } from 'lucide-react';

export default function SearchView({ onSelectVehicleForTracking }) {
  const [query, setQuery] = useState('');
  const [captures, setCaptures] = useState([]);
  const [filteredCaptures, setFilteredCaptures] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCaptures();
  }, []);

  const fetchCaptures = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/captures');
      if (res.ok) {
        const data = await res.json();
        setCaptures(data);
        setFilteredCaptures(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (q, cat = selectedCategory) => {
    setQuery(q);
    let list = [...captures];

    if (cat !== 'ALL') {
      list = list.filter(item => item.vehicle_type?.toUpperCase().includes(cat.toUpperCase()));
    }

    if (q) {
      const cleanQ = q.toUpperCase().replace(/\s+/g, '');
      list = list.filter(item => {
        const p = (item.plate_number || '').toUpperCase().replace(/\s+/g, '');
        const d = (item.visual_description || '').toUpperCase();
        const v = (item.vehicle_type || '').toUpperCase();
        const c = (item.vehicle_color || '').toUpperCase();
        return p.includes(cleanQ) || d.includes(q.toUpperCase()) || v.includes(q.toUpperCase()) || c.includes(q.toUpperCase());
      });
    }

    setFilteredCaptures(list);
  };

  const categories = [
    { label: 'Semua Kendaraan', value: 'ALL' },
    { label: 'Sedan', value: 'SEDAN' },
    { label: 'SUV / MPV', value: 'SUV' },
    { label: 'Minibus / Hatchback', value: 'MINIBUS' },
    { label: 'Truk / Bus', value: 'TRUCK' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#1d1d1f] tracking-tight">
              Pencarian Intelligence Multi-Kriteria
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cari log tangkapan kendaraan berdasarkan nomor plat, deskripsi visual ciri fisik, atau zona CCTV.
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs text-slate-500">
            <span>Total Log:</span>
            <span className="font-bold text-[#0071e3] px-2.5 py-0.5 bg-blue-50 rounded-full border border-blue-200">
              {filteredCaptures.length} Rekaman
            </span>
          </div>
        </div>

        {/* Search Input Bar & Category Pills */}
        <div className="space-y-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Ketik Plat (e.g. B 1234 XYZ) atau Ciri Visual (e.g. 'Hitam', 'Sedan', 'Kaca Film')..."
              className="w-full pl-11 pr-4 py-3 bg-slate-100/80 border border-slate-200 rounded-2xl text-xs text-[#1d1d1f] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setSelectedCategory(cat.value); handleSearch(query, cat.value); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-[#0071e3] text-white shadow-sm font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCaptures.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              
              {/* Card Top Row: Plate & Confidence */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold font-mono text-[#1d1d1f] bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                  {item.plate_number}
                </span>
                <span className="text-[10px] font-semibold font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                  {(item.confidence * 100).toFixed(0)}% Conf
                </span>
              </div>

              {/* Type & Color Pills */}
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold">
                  {item.vehicle_type}
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                  {item.vehicle_color}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {item.visual_description}
              </p>
            </div>

            {/* Bottom Meta & Track Action */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center space-x-1 truncate max-w-[180px]">
                  <Camera className="w-3.5 h-3.5 text-[#0071e3] shrink-0" />
                  <span className="truncate">{item.camera_name}</span>
                </span>
                <span className="font-mono text-slate-400">{item.timestamp?.split('T')[1]?.slice(0, 5) || '10:15'}</span>
              </div>

              <button
                onClick={() => onSelectVehicleForTracking(item.plate_number)}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-slate-100 hover:bg-[#0071e3] hover:text-white text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Lacak Rute Lintasan GIS</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {filteredCaptures.length === 0 && !isLoading && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 space-y-2">
          <Car className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Tidak ditemukan kendaraan yang cocok.</p>
          <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau kategori filter.</p>
        </div>
      )}

    </div>
  );
}
