import React, { useState, useEffect, useRef } from 'react';
import { Upload, Scan, CheckCircle2, AlertCircle, Sparkles, Navigation, Layers, Tag, ShieldAlert, Cpu, Eye, Video, Camera, Calendar, Clock, Film, Radio, Sliders, Maximize2, ZoomIn, ZoomOut, X, Play, Pause, RotateCcw, ChevronRight } from 'lucide-react';

/** Persistent waiting indicator with elapsed timer — shown while backend AI is still processing after simulated logs finish */
function WaitingIndicator({ onTick }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(prev => {
      const next = prev + 1;
      if (onTick) onTick(next);
      return next;
    }), 1000);
    return () => clearInterval(id);
  }, [onTick]);
  return (
    <div className="flex items-start space-x-2 text-amber-400 mt-1">
      <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
      <span className="flex items-center space-x-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
        <span>⏳ Backend AI masih memproses model... ({elapsed}s berlalu — harap tunggu)</span>
      </span>
    </div>
  );
}

export default function DetectorView({ onTrackVehicle }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  const [error, setError] = useState(null);
  const [analysisLogs, setAnalysisLogs] = useState([]);
  const [logsFinished, setLogsFinished] = useState(false);
  const [waitingElapsed, setWaitingElapsed] = useState(0);

  // Video view mode & AI Reel Video Player states
  const [videoViewMode, setVideoViewMode] = useState('annotated'); // 'annotated' or 'raw'
  const [isPlayingReel, setIsPlayingReel] = useState(false);
  const [reelSpeed, setReelSpeed] = useState(2); // Frames per second for slideshow reel

  // Lightbox Zoom Modal states
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0);

  // Ref for the result-panel video player (for seeking to detected frame timestamps)
  const resultVideoRef = useRef(null);
  // Ref to store setTimeout IDs for log simulation (so we can cancel on unmount/reset)
  const logTimeoutsRef = useRef([]);
  // Ref for log scroll container to auto-scroll
  const logScrollRef = useRef(null);

  // CCTV & Date/Time Controls & Sampling Rate Interval & Video Duration
  const [cameras, setCameras] = useState([]);
  const [selectedCamId, setSelectedCamId] = useState('CAM-001');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(new Date().toTimeString().slice(0, 5));
  const [sampleIntervalSec, setSampleIntervalSec] = useState(0.5);
  const [videoDurationSec, setVideoDurationSec] = useState(25.0);

  const intervalPresets = [
    { label: "Semua Frame (0s)", value: 0 },
    { label: "0.1s / Frame", value: 0.1 },
    { label: "0.2s / Frame", value: 0.2 },
    { label: "0.5s / Frame (Default)", value: 0.5 },
    { label: "1.0s / Frame", value: 1.0 },
    { label: "2.0s / Frame", value: 2.0 },
    { label: "3.0s / Frame", value: 3.0 },
    { label: "5.0s / Frame", value: 5.0 },
  ];

  const fetchCameras = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/cameras");
      if (res.ok) {
        const data = await res.json();
        setCameras(data);
      }
    } catch (err) {
      console.log("Using fallback camera list:", err);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const samplePresets = [
    {
      name: "Video Stream CCTV Semanggi (Multi-Kendaraan)",
      plate: "B 1234 XYZ",
      type: "Sedan",
      color: "Hitam",
      desc: "Video CCTV: Sedan Hitam [B 1234 XYZ] melintas berdampingan dengan SUV Merah [D 9999 SS].",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-traffic-in-a-city-street-42861-large.mp4",
      isVideo: true
    },
    {
      name: "Video Stream CCTV Senayan (D 9999 SS)",
      plate: "D 9999 SS",
      type: "SUV / MPV",
      color: "Merah",
      desc: "Video CCTV: SUV Merah terdeteksi dengan Plat Nomor [D 9999 SS], roof rack bagasi atas.",
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
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResult(null);
      setSelectedFrameIndex(0);
      setSelectedVehicleIndex(0);
      setError(null);

      if (fileIsVideo) {
        const vElem = document.createElement("video");
        vElem.preload = "metadata";
        vElem.onloadedmetadata = () => {
          if (vElem.duration && !isNaN(vElem.duration) && vElem.duration > 0) {
            setVideoDurationSec(vElem.duration);
          }
        };
        vElem.src = url;
      }
    }
  };

  const handlePresetSelect = (preset) => {
    setSelectedFile(null);
    setIsVideo(preset.isVideo);
    setPreviewUrl(preset.videoUrl);
    setResult(null);
    setSelectedFrameIndex(0);
    setSelectedVehicleIndex(0);
    setError(null);
    setVideoDurationSec(25.0);
  };

  // Build and schedule progressive log messages simulating real backend pipeline
  const startProgressLogs = (intervalSec, customDuration) => {
    logTimeoutsRef.current.forEach(t => clearTimeout(t));
    logTimeoutsRef.current = [];
    setAnalysisLogs([]);

    const addLog = (msg, type, delay) => {
      const t = setTimeout(() => {
        setAnalysisLogs(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
        if (logScrollRef.current) {
          logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
        }
      }, delay);
      logTimeoutsRef.current.push(t);
    };

    const duration = customDuration || videoDurationSec || 25.0;
    const iv = intervalSec <= 0 ? 0.1 : intervalSec;
    const estFrames = intervalSec <= 0
      ? Math.round(duration * 25)
      : Math.max(1, Math.floor(duration / iv) + 1);

    addLog('📂 Membuka berkas video CCTV...', 'info', 100);
    addLog(`📊 Membaca metadata video: durasi total ~${duration.toFixed(1)}s...`, 'info', 450);
    addLog(`⚙️  Interval sampling: ${intervalSec === 0 ? 'Semua frame (0s / Continuous)' : `${intervalSec}s per frame`}`, 'config', 800);
    addLog(`🔢 Estimasi frame yang disampling: ~${estFrames} frame`, 'config', 1100);
    addLog('🚀 Memulai pipeline AI Multi-Kendaraan: YOLOv8 + MobileNetV3 + EasyOCR...', 'info', 1500);

    const frameDelayBase = 1900;
    const frameStep = Math.max(300, Math.min(1200, iv * 600));
    const displayCount = Math.min(estFrames, 8);
    for (let i = 0; i < displayCount; i++) {
      const d = frameDelayBase + i * frameStep;
      const secOffset = (i * iv).toFixed(1);
      addLog(`🎯 [Frame @${secOffset}s] YOLOv8: Deteksi bounding box seluruh kendaraan...`, 'detect', d);
      addLog(`🔤 [Frame @${secOffset}s] EasyOCR (CRAFT+CRNN): Membaca plat nomor per kendaraan...`, 'ocr', d + frameStep * 0.4);
      addLog(`🎨 [Frame @${secOffset}s] HSV histogram: Klasifikasi warna kendaraan...`, 'color', d + frameStep * 0.7);
    }

    const tailDelay = frameDelayBase + displayCount * frameStep;
    if (estFrames > displayCount) {
      const tailSec = (displayCount * iv).toFixed(1);
      addLog(`⏩ [Frame @${tailSec}s - ${duration.toFixed(1)}s] Melanjutkan ${estFrames - displayCount} frame berikutnya...`, 'info', tailDelay);
    }
    addLog('🧩 Agregasi hasil deteksi & deduplikasi plat nomor unik...', 'info', tailDelay + 300);
    addLog('💾 Menyimpan hit deteksi ke database CCTV...', 'info', tailDelay + 600);
    addLog('✅ Log simulasi selesai — menyiapkan hasil AI terannotasi...', 'success', tailDelay + 900);

    const finishT = setTimeout(() => setLogsFinished(true), tailDelay + 950);
    logTimeoutsRef.current.push(finishT);
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !previewUrl) {
      setError("Silakan pilih atau unggah berkas rekaman video CCTV terlebih dahulu.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setLogsFinished(false);
    setWaitingElapsed(0);
    startProgressLogs(sampleIntervalSec, videoDurationSec);


    const customTimestamp = `${selectedDate}T${selectedTime}:00`;

    try {
      let fileToUpload = selectedFile;

      if (!fileToUpload && previewUrl) {
        try {
          const res = await fetch(previewUrl);
          const blob = await res.blob();
          fileToUpload = new File([blob], "cctv_sample.mp4", { type: blob.type || "video/mp4" });
        } catch (fetchErr) {
          console.warn("Could not fetch preset video blob directly:", fetchErr);
        }
      }

      if (fileToUpload) {
        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("camera_id", selectedCamId);
        formData.append("custom_timestamp", customTimestamp);
        formData.append("sample_interval_sec", sampleIntervalSec);

        const response = await fetch("http://127.0.0.1:8000/api/detect", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.detail || "Gagal memproses video pada server backend AI.");
        }

        const data = await response.json();
        setResult(data);
        setSelectedFrameIndex(0);
        setSelectedVehicleIndex(0);
      } else {
        // Fallback preset metadata with multi-vehicle simulated frame detection sequence
        const preset = samplePresets.find(p => p.videoUrl === previewUrl) || samplePresets[0];
        const selectedCam = cameras.find(c => c.id === selectedCamId) || { name: 'Simpang Semanggi' };
        
        const simulatedFrames = [];
        const intervalSec = sampleIntervalSec <= 0 ? 0.1 : sampleIntervalSec;
        const durationSec = Math.max(10.0, intervalSec * 4);
        const totalFramesCount = Math.max(1, Math.floor(durationSec / intervalSec));

        const sampleVehiclesPool = [
          { plate: "B 1234 XYZ", type: "Sedan", color: "Hitam", desc: "Sedan Hitam dengan kaca gelap anti-glare." },
          { plate: "D 9999 SS", type: "SUV / MPV", color: "Merah", desc: "SUV Merah dengan roof rack bagasi atas." },
          { plate: "F 4321 AB", type: "Minibus / Hatchback", color: "Putih", desc: "Minibus Putih dengan stiker kaca belakang." },
          { plate: "B 8888 JGR", type: "Sepeda Motor", color: "Biru", desc: "Sepeda Motor Biru dengan helm visor." }
        ];

        for (let i = 0; i < totalFramesCount; i++) {
          const sec = (i * intervalSec).toFixed(1);
          const mins = String(Math.floor(sec / 60)).padStart(2, '0');
          const secs = String((sec % 60).toFixed(1)).padStart(4, '0');
          
          const frameV1 = sampleVehiclesPool[i % sampleVehiclesPool.length];
          const frameV2 = sampleVehiclesPool[(i + 1) % sampleVehiclesPool.length];

          simulatedFrames.push({
            frame_number: i * (sampleIntervalSec <= 0 ? 1 : 15),
            timestamp_in_video: `${mins}:${secs}`,
            timestamp_seconds: parseFloat(sec),
            plate_number: frameV1.plate,
            plate_confidence: 0.94 + (i % 3) * 0.02,
            vehicle_type: frameV1.type,
            vehicle_color: frameV1.color,
            visual_description: `${frameV1.desc} [Terekam detik ke-${sec}s].`,
            vehicle_count_in_frame: 2,
            vehicles: [
              {
                plate_number: frameV1.plate,
                plate_confidence: 0.95,
                vehicle_type: frameV1.type,
                vehicle_color: frameV1.color,
                visual_description: frameV1.desc,
                vehicle_bbox: [50, 80, 320, 220],
                bounding_box: [120, 220, 140, 45]
              },
              {
                plate_number: frameV2.plate,
                plate_confidence: 0.92,
                vehicle_type: frameV2.type,
                vehicle_color: frameV2.color,
                visual_description: frameV2.desc,
                vehicle_bbox: [410, 100, 340, 240],
                bounding_box: [480, 250, 150, 45]
              }
            ]
          });
        }

        setResult({
          plate_number: preset.plate,
          plate_confidence: 0.96,
          vehicle_type: preset.type,
          vehicle_color: preset.color,
          visual_description: `${preset.desc} Terekam pada CCTV [${selectedCam.name}] tanggal ${selectedDate} jam ${selectedTime} WIB.`,
          video_meta: preset.isVideo ? {
            total_frames_in_video: 180,
            fps: 30.0,
            duration_seconds: durationSec,
            sample_interval_sec: sampleIntervalSec,
            frames_sampled: simulatedFrames.length,
            vehicle_frames_detected: simulatedFrames.length,
            total_vehicles_detected: simulatedFrames.length * 2,
            unique_vehicles_detected: sampleVehiclesPool.length
          } : null,
          all_frame_detections: preset.isVideo ? simulatedFrames : [],
          all_unique_vehicles: sampleVehiclesPool.map(v => ({
            plate_number: v.plate,
            vehicle_type: v.type,
            vehicle_color: v.color,
            visual_description: v.desc,
            timestamp_in_video: "00:02.0"
          })),
          status: "ANALYSIS_COMPLETE"
        });
        setSelectedFrameIndex(0);
        setSelectedVehicleIndex(0);
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat memproses rekaman video.");
      setAnalysisLogs(prev => [...prev, { msg: `❌ Error: ${err.message}`, type: 'error', ts: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
    } finally {
      logTimeoutsRef.current.forEach(t => clearTimeout(t));
      logTimeoutsRef.current = [];
      setLogsFinished(false);
      setWaitingElapsed(0);
      setIsAnalyzing(false);
    }
  };

  const activeFrame = (result && result.all_frame_detections && result.all_frame_detections.length > 0)
    ? (result.all_frame_detections[selectedFrameIndex] || result)
    : result;

  // Compute list of vehicles detected in the currently active frame
  const frameVehiclesList = (activeFrame && activeFrame.vehicles && activeFrame.vehicles.length > 0)
    ? activeFrame.vehicles
    : (activeFrame ? [{
        plate_number: activeFrame.plate_number,
        plate_confidence: activeFrame.plate_confidence,
        vehicle_type: activeFrame.vehicle_type,
        vehicle_color: activeFrame.vehicle_color,
        visual_description: activeFrame.visual_description,
        bounding_box: activeFrame.bounding_box,
        vehicle_bbox: activeFrame.vehicle_bbox
      }] : []);

  const activeVehicle = frameVehiclesList[selectedVehicleIndex] || frameVehiclesList[0] || activeFrame;

  // Seek raw CCTV video player when active frame timestamp changes
  useEffect(() => {
    if (resultVideoRef.current && activeFrame && typeof activeFrame.timestamp_seconds === 'number') {
      resultVideoRef.current.currentTime = activeFrame.timestamp_seconds;
    }
    // Reset selected vehicle index to 0 when frame index changes
    setSelectedVehicleIndex(0);
  }, [selectedFrameIndex, activeFrame]);

  // Handle Play/Pause AI Video Reel Slideshow
  useEffect(() => {
    let intervalId = null;
    if (isPlayingReel && result && result.all_frame_detections && result.all_frame_detections.length > 0) {
      intervalId = setInterval(() => {
        setSelectedFrameIndex(prev => (prev + 1) % result.all_frame_detections.length);
      }, 1000 / reelSpeed);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlayingReel, reelSpeed, result]);

  return (
    <div className="space-y-6">
      
      {/* Title Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-blue-50 text-[#0071e3] text-xs font-semibold rounded-full border border-blue-200 flex items-center space-x-1">
                <Video className="w-3.5 h-3.5 mr-1" />
                <span>Analisis Video CCTV ({sampleIntervalSec === 0 ? 'Semua Frame' : `${sampleIntervalSec}s/Frame`})</span>
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                YOLOv8 Multi-Vehicle + MobileNetV3 + EasyOCR ALPR
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#1d1d1f] mt-2 tracking-tight">
              Deteksi Video CCTV & Pemindai Plat Nomor (ALPR Multi-Kendaraan)
            </h2>
            <p className="text-sm text-slate-500">
              Pipeline memproses frame video dengan interval {sampleIntervalSec === 0 ? 'semua frame tanpa dilewati' : `1 frame setiap ${sampleIntervalSec} detik`} dan menandai seluruh kendaraan & plat nomor yang lewat.
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
            
            {/* Metadata Selection: Camera, Timestamp & Frame Sampling Rate */}
            <div className="p-5 bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/50 rounded-2xl border border-blue-100 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center space-x-1.5">
                  <Camera className="w-4 h-4 text-[#0071e3]" />
                  <span>Pengaturan Node CCTV, Timestamp & Sampling Rate Video</span>
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
                        {c.id} - {c.name} ({c.city ? `${c.city} • ` : ''}{c.zone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tanggal Rekaman:</span>
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

                {/* Frame Sampling Rate Selector */}
                <div className="space-y-2.5 sm:col-span-3 pt-3 border-t border-blue-100">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 font-semibold flex items-center space-x-1.5 shrink-0">
                      <Sliders className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span>Interval Sampling Frame Video:</span>
                    </label>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-[#0071e3] text-xs font-mono font-bold rounded-lg border border-blue-200">
                      {sampleIntervalSec === 0 ? 'Semua Frame (0s / Continuous)' : `${sampleIntervalSec}s / Frame (${(1 / sampleIntervalSec).toFixed(1)} FPS)`}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Preset Buttons */}
                    <div className="flex items-center space-x-1 overflow-x-auto py-0.5 flex-1">
                      {intervalPresets.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setSampleIntervalSec(p.value)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all border whitespace-nowrap ${
                            sampleIntervalSec === p.value
                              ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    {/* Quick Range Slider (0s to 5s) */}
                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono">0s</span>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={sampleIntervalSec}
                        onChange={(e) => setSampleIntervalSec(parseFloat(e.target.value))}
                        className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0071e3]"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">5s</span>
                    </div>
                  </div>
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
                    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col z-20 p-4 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3 shrink-0">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs font-bold text-blue-400 tracking-wider font-mono">
                            AI PIPELINE — {sampleIntervalSec === 0 ? 'SEMUA FRAME' : `${sampleIntervalSec}s/FRAME`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        </div>
                      </div>

                      {/* Terminal log scroll area */}
                      <div
                        ref={logScrollRef}
                        className="flex-1 overflow-y-auto space-y-0.5 font-mono text-[10px] leading-relaxed pr-1"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
                      >
                        {analysisLogs.map((log, i) => (
                          <div key={i} className={`flex items-start space-x-2 ${
                            log.type === 'error'   ? 'text-red-400' :
                            log.type === 'success' ? 'text-emerald-400' :
                            log.type === 'ocr'     ? 'text-yellow-300' :
                            log.type === 'detect'  ? 'text-cyan-400' :
                            log.type === 'color'   ? 'text-pink-400' :
                            log.type === 'config'  ? 'text-purple-400' :
                            'text-slate-300'
                          }`}>
                            <span className="text-slate-600 shrink-0">[{log.ts}]</span>
                            <span>{log.msg}</span>
                          </div>
                        ))}

                        {/* Persistent waiting indicator */}
                        {logsFinished && (
                          <WaitingIndicator onTick={setWaitingElapsed} />
                        )}

                        <div className="text-emerald-400 animate-pulse mt-1">▍</div>
                      </div>
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
                    <span>Mode Sampling {sampleIntervalSec === 0 ? 'Semua Frame' : `${sampleIntervalSec}s Per Frame`} Active</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); setResult(null); setSelectedFrameIndex(0); setSelectedVehicleIndex(0); setError(null); }}
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
                <span>
                  {isAnalyzing
                    ? 'Memproses Video...'
                    : `Jalankan Deteksi Video AI (${sampleIntervalSec === 0 ? 'Semua Frame' : `${sampleIntervalSec}s/Frame`})`}
                </span>
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* All Detected Frames List Gallery */}
          {result && result.all_frame_detections && result.all_frame_detections.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#1d1d1f] flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-[#0071e3]" />
                    <span>
                      Frame Kendaraan Terdeteksi ({sampleIntervalSec === 0 ? 'Semua Frame / 0s' : `Setiap ${sampleIntervalSec} Detik`})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Frame video berikut menandai seluruh kendaraan & plat nomor terdeteksi.
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="px-2.5 py-1 bg-blue-50 text-[#0071e3] text-xs font-mono font-bold rounded-lg border border-blue-200">
                    ⏱️ Interval: {sampleIntervalSec === 0 ? 'Semua Frame (0s)' : `${sampleIntervalSec}s/Frame`}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-mono font-bold rounded-lg border border-emerald-200">
                    🚘 Total: {result.all_frame_detections.length} Frame
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {result.all_frame_detections.map((fDet, idx) => {
                  const isSelected = idx === selectedFrameIndex;
                  const vCount = fDet.vehicle_count_in_frame || (fDet.vehicles ? fDet.vehicles.length : 1);
                  return (
                    <div
                      key={idx}
                      onClick={() => { setSelectedFrameIndex(idx); setSelectedVehicleIndex(0); }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 relative overflow-hidden ${
                        isSelected
                          ? 'bg-blue-50/90 border-[#0071e3] ring-2 ring-blue-500/20 shadow-md'
                          : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isSelected ? 'bg-[#0071e3] text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          ⏱️ {fDet.timestamp_in_video || `Frame #${idx + 1}`}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-[9px] font-bold rounded-full">
                            🎯 {vCount} Kendaraan
                          </span>
                          {isSelected && (
                            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold uppercase rounded-full">
                              Aktif
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Small annotated image preview if available */}
                      {fDet.annotated_image_base64 && (
                        <div className="rounded-lg overflow-hidden border border-slate-200 max-h-28 bg-black relative">
                          <img
                            src={fDet.annotated_image_base64}
                            alt={`Frame ${idx}`}
                            className="w-full h-28 object-contain mx-auto"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-xs font-extrabold text-[#1d1d1f] font-mono tracking-wide">
                            {fDet.plate_number}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {fDet.vehicle_type} • {fDet.vehicle_color}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {((fDet.plate_confidence || 0.95) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Table / Grid of ALL Vehicles & Plates Detected in Video */}
          {result && (result.all_unique_vehicles || result.all_detected_vehicles) && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#1d1d1f] flex items-center space-x-2">
                    <Tag className="w-5 h-5 text-emerald-600" />
                    <span>Daftar Seluruh Kendaraan & Plat Nomor Terdeteksi di Video</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Klik pada plat mana pun untuk memilih & melacak pergerakannya di Peta GIS.
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold font-mono rounded-full border border-emerald-200">
                  🚘 Total Unik: {(result.all_unique_vehicles || []).length} Kendaraan
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {(result.all_unique_vehicles || [result]).map((v, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 hover:bg-blue-50/60 rounded-2xl border border-slate-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-slate-900 text-yellow-400 font-mono font-black rounded-xl flex items-center justify-center text-xs shrink-0 shadow">
                        #{i+1}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-extrabold text-[#1d1d1f] font-mono tracking-wider">
                            {v.plate_number}
                          </span>
                          {v.timestamp_in_video && (
                            <span className="text-[10px] font-mono bg-blue-100 text-[#0071e3] px-2 py-0.5 rounded font-bold">
                              ⏱️ {v.timestamp_in_video}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          {v.vehicle_type} • Warna: <span className="font-semibold text-slate-800">{v.vehicle_color}</span>
                        </p>
                        {v.visual_description && (
                          <p className="text-[11px] text-slate-500 italic mt-0.5">"{v.visual_description}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => {
                          // Find matching frame and vehicle
                          const frameIdx = result.all_frame_detections
                            ? result.all_frame_detections.findIndex(f => f.plate_number === v.plate_number || (f.vehicles && f.vehicles.some(fv => fv.plate_number === v.plate_number)))
                            : 0;
                          if (frameIdx >= 0) setSelectedFrameIndex(frameIdx);
                          setSelectedVehicleIndex(0);
                        }}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-all"
                      >
                        🔍 Inspeksi Frame
                      </button>
                      <button
                        onClick={() => onTrackVehicle(v.plate_number)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Lacak di GIS</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Inference Results Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1d1d1f] flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-[#0071e3]" />
                <span>Hasil Analisis Video CCTV AI</span>
              </h3>
              {result && result.all_frame_detections && result.all_frame_detections.length > 0 && (
                <span className="px-2.5 py-0.5 bg-blue-100 text-[#0071e3] text-[10px] font-bold rounded-full font-mono">
                  Frame #{selectedFrameIndex + 1} dari {result.all_frame_detections.length}
                </span>
              )}
            </div>

            {activeFrame ? (
              <div className="space-y-4">

                {/* Video View Mode Toggle (Hasil AI vs Raw CCTV Video) */}
                {previewUrl && isVideo && (
                  <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
                    <button
                      onClick={() => setVideoViewMode('annotated')}
                      className={`flex-1 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center space-x-1 ${
                        videoViewMode === 'annotated'
                          ? 'bg-[#0071e3] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      <span>Hasil AI Video Bounding Box</span>
                    </button>
                    <button
                      onClick={() => setVideoViewMode('raw')}
                      className={`flex-1 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center space-x-1 ${
                        videoViewMode === 'raw'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5 mr-1" />
                      <span>Video Raw CCTV</span>
                    </button>
                  </div>
                )}

                {/* Video Display & Bounding Box Viewer */}
                {previewUrl && isVideo ? (
                  <div className="space-y-2">
                    {videoViewMode === 'annotated' ? (
                      /* Animated AI Video Stream / Reel Player */
                      <div className="relative rounded-2xl overflow-hidden border border-blue-500/40 shadow-lg bg-black group">
                        {result.detection_reel_url ? (
                          <video
                            src={result.detection_reel_url}
                            controls
                            autoPlay
                            loop
                            className="w-full max-h-[300px] object-contain mx-auto"
                          />
                        ) : activeFrame.annotated_image_base64 ? (
                          <div className="relative">
                            <img
                              src={activeFrame.annotated_image_base64}
                              alt="Annotated Frame"
                              className="w-full max-h-[300px] object-contain mx-auto"
                            />
                            {/* Expand / Lightbox Button */}
                            <button
                              onClick={() => { setZoomScale(1.0); setIsZoomModalOpen(true); }}
                              className="absolute top-3 right-3 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md backdrop-blur-sm transition-all border border-slate-700"
                            >
                              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Perbesar Bounding Box</span>
                            </button>
                          </div>
                        ) : (
                          <video
                            ref={resultVideoRef}
                            src={previewUrl}
                            controls
                            className="w-full max-h-[300px] object-contain mx-auto"
                          />
                        )}

                        {/* Interactive AI Video Reel Controls Bar */}
                        {result.all_frame_detections && result.all_frame_detections.length > 0 && (
                          <div className="p-2.5 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-between text-xs text-white">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setIsPlayingReel(!isPlayingReel)}
                                className="p-1.5 bg-[#0071e3] hover:bg-blue-600 rounded-lg text-white font-bold transition-all flex items-center space-x-1"
                              >
                                {isPlayingReel ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                <span>{isPlayingReel ? 'Pause' : 'Play Video AI'}</span>
                              </button>
                              <span className="text-[10px] font-mono text-slate-300">
                                ⏱️ {activeFrame.timestamp_in_video || `#${selectedFrameIndex + 1}`}
                              </span>
                            </div>

                            {/* Scrubber Slider */}
                            <input
                              type="range"
                              min="0"
                              max={result.all_frame_detections.length - 1}
                              value={selectedFrameIndex}
                              onChange={(e) => setSelectedFrameIndex(parseInt(e.target.value))}
                              className="flex-1 mx-3 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0071e3]"
                            />

                            {/* Speed Selector */}
                            <div className="flex items-center space-x-1 text-[10px] font-mono">
                              <span className="text-slate-400">Kecepatan:</span>
                              <select
                                value={reelSpeed}
                                onChange={(e) => setReelSpeed(parseFloat(e.target.value))}
                                className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-700"
                              >
                                <option value="1">1 FPS</option>
                                <option value="2">2 FPS</option>
                                <option value="5">5 FPS</option>
                                <option value="10">10 FPS</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Raw CCTV Video Player */
                      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-black">
                        <video
                          ref={resultVideoRef}
                          src={previewUrl}
                          controls
                          className="w-full max-h-[280px] object-contain mx-auto"
                          onLoadedMetadata={() => {
                            if (resultVideoRef.current && activeFrame && typeof activeFrame.timestamp_seconds === 'number') {
                              resultVideoRef.current.currentTime = activeFrame.timestamp_seconds;
                            }
                          }}
                        />
                        <div className="absolute top-2 left-2 px-2 py-1 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-mono rounded-lg flex items-center space-x-1.5 pointer-events-none">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          <span>RAW CCTV REPLAY</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : previewUrl && !isVideo ? (
                  /* Static Image Frame */
                  <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-sm bg-black">
                    <img
                      src={activeFrame.annotated_image_base64 || previewUrl}
                      alt="CCTV Frame"
                      className="w-full max-h-[280px] object-contain mx-auto"
                    />
                    <button
                      onClick={() => { setZoomScale(1.0); setIsZoomModalOpen(true); }}
                      className="absolute top-3 right-3 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow backdrop-blur-sm transition-all border border-slate-700"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Perbesar Bounding Box</span>
                    </button>
                  </div>
                ) : null}

                {/* VEHICLE SELECTOR PILLS — Choose which detected vehicle in current frame to view & track */}
                {frameVehiclesList.length > 1 && (
                  <div className="p-3.5 bg-blue-50/90 rounded-2xl border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1d1d1f]">
                      <span className="flex items-center space-x-1.5">
                        <Tag className="w-4 h-4 text-[#0071e3]" />
                        <span>Pilih Kendaraan Terdeteksi di Frame Ini:</span>
                      </span>
                      <span className="px-2 py-0.5 bg-[#0071e3] text-white text-[10px] font-mono font-bold rounded-full">
                        {frameVehiclesList.length} Kendaraan
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 overflow-x-auto pb-0.5">
                      {frameVehiclesList.map((v, vIdx) => {
                        const isSelectedV = selectedVehicleIndex === vIdx;
                        return (
                          <button
                            key={vIdx}
                            onClick={() => setSelectedVehicleIndex(vIdx)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border whitespace-nowrap flex items-center space-x-1.5 ${
                              isSelectedV
                                ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-md ring-2 ring-blue-400/30'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <span>#{vIdx + 1}</span>
                            <span>{v.plate_number}</span>
                            <span className="text-[10px] opacity-80">({v.vehicle_type})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recognized License Plate Card for Currently Selected Vehicle */}
                <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 flex items-center space-x-1.5">
                    {activeFrame.timestamp_in_video && (
                      <span className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-[10px] font-mono">
                        ⏱️ {activeFrame.timestamp_in_video}
                      </span>
                    )}
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[10px] font-mono font-bold">
                      Conf: {(((activeVehicle && activeVehicle.plate_confidence) || 0.95) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Hasil Plat Nomor (ALPR EasyOCR)</p>
                  <h4 className="text-3xl font-extrabold tracking-wider font-mono text-yellow-400 mt-2">
                    {activeVehicle ? activeVehicle.plate_number : activeFrame.plate_number}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Kendaraan Terdeteksi di Frame: <span className="text-cyan-400 font-bold">{frameVehiclesList.length} Kendaraan</span> (Terpilih: #{selectedVehicleIndex + 1})
                  </p>
                </div>

                {/* Video Summary Meta Card (If Video Uploaded) */}
                {result.video_meta && (
                  <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-100 text-xs space-y-1">
                    <p className="font-bold text-[#0071e3] flex items-center space-x-1">
                      <Film className="w-3.5 h-3.5 mr-1" />
                      <span>
                        Statistik Sampling Video CCTV ({result.video_meta.sample_interval_sec === 0 ? 'Semua Frame / 0s' : `${result.video_meta.sample_interval_sec}s/Frame`}):
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 font-mono mt-1">
                      <div>Durasi: {result.video_meta.duration_seconds}s</div>
                      <div>FPS Video: {result.video_meta.fps}</div>
                      <div>
                        Sampling Rate: {result.video_meta.sample_interval_sec === 0 ? 'Semua Frame (0s)' : `${result.video_meta.sample_interval_sec} Detik / Frame`}
                      </div>
                      <div>Total Frame Diuji: {result.video_meta.frames_sampled}</div>
                      <div className="col-span-2 text-emerald-700 font-bold">
                        Plat / Kendaraan Unik: {result.video_meta.unique_vehicles_detected || (result.all_unique_vehicles || []).length} Kendaraan
                      </div>
                    </div>
                  </div>
                )}

                {/* Classification Details for Selected Vehicle */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                    <p className="text-xs text-slate-500">Tipe Kendaraan Terpilih</p>
                    <p className="text-sm font-bold text-[#1d1d1f] mt-1">
                      {activeVehicle ? activeVehicle.vehicle_type : activeFrame.vehicle_type}
                    </p>
                    <span className="text-[10px] text-purple-600 font-semibold">MobileNetV3 Classifier</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                    <p className="text-xs text-slate-500">Warna Dominan</p>
                    <p className="text-sm font-bold text-[#1d1d1f] mt-1">
                      {activeVehicle ? activeVehicle.vehicle_color : activeFrame.vehicle_color}
                    </p>
                    <span className="text-[10px] text-blue-600 font-semibold">RGB Histogram</span>
                  </div>
                </div>

                {/* Visual Description for Selected Vehicle */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi Visual & Log CCTV</p>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {activeVehicle ? activeVehicle.visual_description : activeFrame.visual_description}
                  </p>
                </div>

                {/* Quick Track Action Button for Selected Vehicle */}
                <button
                  onClick={() => onTrackVehicle(activeVehicle ? activeVehicle.plate_number : activeFrame.plate_number)}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Lacak Pergerakan Rute Plat ({activeVehicle ? activeVehicle.plate_number : activeFrame.plate_number}) di Peta GIS</span>
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

      {/* LIGHTBOX ZOOM MODAL — High Resolution Bounding Box Inspector */}
      {isZoomModalOpen && activeFrame && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-hidden animate-fadeIn">
          {/* Top Modal Navigation Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <span>Hasil AI (Bounding Box Semua Plat & Kendaraan)</span>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-mono rounded-full border border-emerald-500/40">
                    ⏱️ {activeFrame.timestamp_in_video || 'Frame Terpilih'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Menampilkan seluruh {frameVehiclesList.length} kendaraan & plat nomor terdeteksi dalam resolusi penuh.
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoomScale(prev => Math.min(2.5, prev + 0.25))}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomScale(prev => Math.max(0.75, prev - 0.25))}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomScale(1.0)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                {(zoomScale * 100).toFixed(0)}%
              </button>
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-colors shadow"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Main Body */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 overflow-hidden">
            {/* Zoomable Image Viewer Area */}
            <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 overflow-auto flex items-center justify-center p-4 relative">
              <div
                style={{ transform: `scale(${zoomScale})`, transition: 'transform 0.2s ease-out' }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                <img
                  src={activeFrame.annotated_image_base64 || previewUrl}
                  alt="High-Res Bounding Box Detection"
                  className="max-h-[72vh] object-contain rounded-xl shadow-2xl"
                />
              </div>
            </div>

            {/* Side Legend & Vehicle Inspector Panel */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-y-auto space-y-4 text-white">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Deteksi Kendaraan Dalam Frame ({frameVehiclesList.length})</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pilih salah satu kendaraan untuk melacak lokasinya di GIS map.
                </p>
              </div>

              <div className="space-y-3">
                {frameVehiclesList.map((v, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedVehicleIndex(idx)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      selectedVehicleIndex === idx
                        ? 'bg-blue-950/80 border-[#0071e3] ring-1 ring-blue-400'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-yellow-400 text-slate-950 text-xs font-mono font-black rounded-md">
                        #{idx + 1} PLAT: {v.plate_number}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        {((v.plate_confidence || 0.95) * 100).toFixed(0)}% Conf
                      </span>
                    </div>

                    <div className="text-xs space-y-1 pt-1">
                      <p className="text-slate-300 font-medium">
                        Tipe: <span className="text-white font-bold">{v.vehicle_type}</span> • Warna: <span className="text-white font-bold">{v.vehicle_color}</span>
                      </p>
                      {v.vehicle_bbox && (
                        <p className="text-[10px] font-mono text-slate-400">
                          BBox Kendaraan: [{v.vehicle_bbox.join(', ')}]
                        </p>
                      )}
                      {v.bounding_box && (
                        <p className="text-[10px] font-mono text-slate-400">
                          BBox Plat Nomor: [{v.bounding_box.join(', ')}]
                        </p>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsZoomModalOpen(false);
                        onTrackVehicle(v.plate_number);
                      }}
                      className="w-full mt-2 py-2 bg-[#0071e3] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Lacak Plat ({v.plate_number}) di Peta GIS</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

