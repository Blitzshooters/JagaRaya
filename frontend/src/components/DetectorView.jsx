import React, { useState, useEffect } from 'react';
import { Upload, Scan, CheckCircle2, AlertCircle, Sparkles, Navigation, Layers, Tag, ShieldAlert, Cpu, Eye, Video, Camera, Calendar, Clock, Film, Radio } from 'lucide-react';

export default function DetectorView({ onTrackVehicle }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // CCTV & Date/Time Controls
  const [cameras, setCameras] = useState([]);
  const [selectedCamId, setSelectedCamId] = useState('CAM-001');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(new Date().toTimeString().slice(0, 5));

  useEffect(() => {
    fetchCameras();
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

  const samplePresets = [
    {
      name: "Video Stream CCTV Semanggi (B 1234 XYZ)",
      plate: "B 1234 XYZ",
      type: "Sedan",
      color: "Hitam",
      desc: "Video CCTV: Sedan warna Hitam terdeteksi melintas dengan kecepatan 45 km/jam, Plat Nomor [B 1234 XYZ].",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-traffic-in-a-city-street-42861-large.mp4",
      isVideo: true
    },
    {
      name: "Video Stream CCTV Senayan (D 9999 SS)",
      plate: "D 9999 SS",
      type: "SUV / MPV",
      color: "Merah",
      desc: "Video CCTV: SUV warna Merah terdeteksi dengan Plat Nomor [D 9999 SS], roof rack bagasi atas.",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-car-driving-down-a-busy-street-41549-large.mp4",
      isVideo: true
    },
    {
      name: "CCTV Capture Kuningan (F 4321 AB)",
      plate: "F 4321 AB",
      type: "Minibus / Hatchback",
      color: "Putih",
      desc: "Minibus warna Putih dengan Plat [F 4321 AB], stiker kaca belakang.",
      videoUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
      isVideo: false
    }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileIsVideo = file.type.startsWith("video/") || file.name.match(/\.(mp4|avi|mov|webm|mkv)$/i);
      setSelectedFile(file);
      setIsVideo(!!fileIsVideo);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handlePresetSelect = (preset) => {
    setSelectedFile(null);
    setIsVideo(preset.isVideo);
    setPreviewUrl(preset.videoUrl);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !previewUrl) {
      setError("Silakan pilih atau unggah berkas rekaman video CCTV terlebih dahulu.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const customTimestamp = `${selectedDate}T${selectedTime}:00`;

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("camera_id", selectedCamId);
        formData.append("custom_timestamp", customTimestamp);

        const response = await fetch("http://127.0.0.1:8000/api/detect", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Gagal memproses video pada server backend AI.");
        }

        const data = await response.json();
        setResult(data);
      } else {
        // Preset sample simulation
        const preset = samplePresets.find(p => p.videoUrl === previewUrl) || samplePresets[0];
        const selectedCam = cameras.find(c => c.id === selectedCamId) || { name: 'Simpang Semanggi' };
        
        setTimeout(() => {
          setResult({
            plate_number: preset.plate,
            plate_confidence: 0.96,
            vehicle_type: preset.type,
            vehicle_color: preset.color,
            visual_description: `${preset.desc} Terekam pada CCTV [${selectedCam.name}] tanggal ${selectedDate} jam ${selectedTime} WIB.`,
            video_meta: preset.isVideo ? {
              total_frames_in_video: 180,
              fps: 30.0,
              duration_seconds: 6.0,
              frames_sampled: 8,
              unique_vehicles_detected: 1
            } : null,
            ai_models_used: {
              yolo_detector: "YOLOv8n-COCO (Ultralytics Video Frame Sampler)",
              vehicle_classifier: "MobileNetV3-Small (Feature Vector Ensemble)",
              ocr_engine: "EasyOCR CRNN Engine"
            },
            status: "ANALYSIS_COMPLETE"
          });
          setIsAnalyzing(false);
        }, 1000);
        return;
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat memproses rekaman video.");
    } finally {
      if (selectedFile) setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-blue-50 text-[#0071e3] text-xs font-semibold rounded-full border border-blue-200 flex items-center space-x-1">
                <Video className="w-3.5 h-3.5 mr-1" />
                <span>Analisis Video CCTV Real-time</span>
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                YOLOv8 + MobileNetV3 + ALPR
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#1d1d1f] mt-2 tracking-tight">
              Deteksi Video CCTV & Pemindai Plat Nomor (ALPR)
            </h2>
            <p className="text-sm text-slate-500">
              Unggah rekaman video CCTV, tentukan lokasi node kamera dan waktu rekaman untuk diproses oleh pipeline YOLOv8 & MobileNetV3.
            </p>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto">
            {samplePresets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetSelect(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                  previewUrl === p.videoUrl
                    ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Sample Video {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upload & Controls Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
            
            {/* Metadata Selection: Camera & Timestamp */}
            <div className="p-5 bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/50 rounded-2xl border border-blue-100 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center space-x-1.5">
                  <Camera className="w-4 h-4 text-[#0071e3]" />
                  <span>Pengaturan Location Node CCTV & Timestamp Rekaman</span>
                </h4>
                <span className="px-2.5 py-0.5 bg-blue-100/80 text-[#0071e3] text-[10px] font-bold rounded-full">
                  Metadata Logging
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                
                {/* CCTV Camera Node Dropdown */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-slate-700 font-semibold flex items-center space-x-1">
                    <Radio className="w-3.5 h-3.5 text-[#0071e3]" />
                    <span>Pilih Node CCTV Target:</span>
                  </label>
                  <select
                    value={selectedCamId}
                    onChange={(e) => setSelectedCamId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-[#1d1d1f] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} - {c.name} ({c.zone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tanggal Rekaman Video:</span>
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-[#1d1d1f] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>

                {/* Time Picker */}
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Waktu / Jam Rekaman:</span>
                  </label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-[#1d1d1f] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>

              </div>
            </div>

            {/* Video Dropzone / Player Box */}
            <div className="relative border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors bg-gradient-to-b from-slate-50 to-blue-50/20">
              <input
                type="file"
                accept="video/*,.mp4,.avi,.mov,.webm,.mkv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden shadow-sm max-h-[360px] bg-black">
                  {isVideo ? (
                    <video
                      src={previewUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      className="w-full max-h-[360px] object-contain rounded-xl mx-auto"
                    />
                  ) : (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview CCTV"
                        className="w-full h-full object-cover rounded-xl max-h-[360px]"
                      />
                      <div className="absolute top-2 left-2 px-3 py-1 bg-amber-500 text-white text-[11px] font-bold rounded-lg shadow">
                        ⚠️ File Gambar Statis (Disarankan Mengunggah Rekaman Video MP4)
                      </div>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-3 z-20">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-bold tracking-wider text-blue-400">Ekstraksi & Sampling Multi-Frame Video CCTV (YOLOv8 + ALPR)...</p>
                      <p className="text-[11px] text-slate-400 font-mono">Memindai plat nomor dan klasifikasi kendaraan per frame...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="w-16 h-16 bg-blue-100 text-[#0071e3] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Film className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Klik atau seret file rekaman video CCTV ke sini
                    </p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Format Video Didukung: MP4, AVI, MOV, WEBM, MKV</p>
                  </div>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-[#0071e3] rounded-full text-xs font-semibold">
                    <Video className="w-3.5 h-3.5" />
                    <span>Mode Deteksi Video Real-time Active</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); setResult(null); setError(null); }}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Reset Video
              </button>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !previewUrl}
                className="flex items-center space-x-2 px-6 py-3 bg-[#0071e3] hover:bg-blue-600 text-white font-semibold text-sm rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzing ? 'Memproses Video...' : 'Jalankan Deteksi Video AI'}</span>
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Inference Results Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-[#1d1d1f] flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-[#0071e3]" />
              <span>Hasil Analisis Video CCTV</span>
            </h3>

            {result ? (
              <div className="space-y-4">
                
                {/* Recognized License Plate Card */}
                <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[10px] font-mono font-bold">
                      Conf: {(result.plate_confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Hasil Plat Nomor (ALPR EasyOCR)</p>
                  <h4 className="text-3xl font-extrabold tracking-wider font-mono text-yellow-400 mt-2">
                    {result.plate_number}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Status: Tersimpan di Database Hit CCTV</p>
                </div>

                {/* Video Summary Meta Card (If Video Uploaded) */}
                {result.video_meta && (
                  <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-100 text-xs space-y-1">
                    <p className="font-bold text-[#0071e3] flex items-center space-x-1">
                      <Film className="w-3.5 h-3.5 mr-1" />
                      <span>Statistik Video CCTV:</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 font-mono mt-1">
                      <div>Durasi: {result.video_meta.duration_seconds}s</div>
                      <div>FPS Video: {result.video_meta.fps}</div>
                      <div>Frame Diuji: {result.video_meta.frames_sampled}</div>
                      <div>Kendaraan Terdeteksi: {result.video_meta.unique_vehicles_detected}</div>
                    </div>
                  </div>
                )}

                {/* Classification Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                    <p className="text-xs text-slate-500">Tipe Kendaraan</p>
                    <p className="text-sm font-bold text-[#1d1d1f] mt-1">{result.vehicle_type}</p>
                    <span className="text-[10px] text-purple-600 font-semibold">MobileNetV3 Classifier</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                    <p className="text-xs text-slate-500">Warna Dominan</p>
                    <p className="text-sm font-bold text-[#1d1d1f] mt-1">{result.vehicle_color}</p>
                    <span className="text-[10px] text-blue-600 font-semibold">RGB Histogram</span>
                  </div>
                </div>

                {/* Visual Description */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi Visual & Log CCTV</p>
                  <p className="text-xs text-slate-800 leading-relaxed">{result.visual_description}</p>
                </div>

                {/* Quick Track Action Button */}
                <button
                  onClick={() => onTrackVehicle(result.plate_number)}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs transition-all shadow-md"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Lacak Pergerakan Rute Plat ({result.plate_number}) di Peta GIS</span>
                </button>

              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                  <Eye className="w-6 h-6" />
                </div>
                <p className="text-xs">Hasil ekstraksi plat nomor & klasifikasi video CCTV akan muncul di sini.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
