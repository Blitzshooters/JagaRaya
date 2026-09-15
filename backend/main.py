from fastapi import FastAPI, File, UploadFile, Query, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import datetime

from ai_engine import VehicleAIEngine
from database import db
from route_tracker import route_tracker
from evaluator import evaluator

app = FastAPI(
    title="JagaRaya AI API",
    description="Backend API for JagaRaya Vehicle ALPR, Visual Description & Neural Route Tracking System",
    version="1.0.0"
)

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Neural Engine
ai_engine = VehicleAIEngine()

class SimulateCaptureRequest(BaseModel):
    camera_id: str
    plate_number: Optional[str] = "B 8888 JGR"
    vehicle_type: Optional[str] = "SUV / MPV"
    vehicle_color: Optional[str] = "Hitam"
    visual_description: Optional[str] = "SUV Hitam gagah dengan kaca film hitam gelap."

class CreateCameraRequest(BaseModel):
    name: str
    lat: float
    lng: float
    zone: Optional[str] = "Wilayah Kustom"
    city: Optional[str] = "Kustom"

@app.get("/")
def root():
    return {
        "name": "JagaRaya AI Backend Server",
        "status": "ONLINE",
        "frontend_url": "http://localhost:5173",
        "api_docs": "http://127.0.0.1:8000/docs",
        "health_check": "http://127.0.0.1:8000/api/health"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "ONLINE",
        "system": "JagaRaya Neural Control Platform",
        "timestamp": datetime.datetime.now().isoformat(),
        "ai_engine_status": "READY",
        "cameras_count": len(db.get_cameras()),
        "total_captures": len(db.get_all_captures())
    }

@app.get("/api/cameras")
def get_cameras():
    return db.get_cameras()

@app.post("/api/cameras")
def create_camera(req: CreateCameraRequest):
    new_cam = db.add_camera(req.dict())
    return {"status": "SUCCESS", "camera": new_cam}

@app.delete("/api/cameras/{cam_id}")
def delete_camera(cam_id: str):
    db.delete_camera(cam_id)
    return {"status": "SUCCESS", "deleted_id": cam_id}

@app.get("/api/captures")
def get_captures():
    return db.get_all_captures()


import numpy as np

def sanitize_json_obj(obj, visited=None):
    if visited is None:
        visited = set()
    obj_id = id(obj)
    if obj_id in visited:
        return None
    if isinstance(obj, dict):
        visited.add(obj_id)
        return {str(k): sanitize_json_obj(v, visited.copy()) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        visited.add(obj_id)
        return [sanitize_json_obj(item, visited.copy()) for item in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, np.str_):
        return str(obj)
    elif isinstance(obj, (int, float, str, bool)) or obj is None:
        return obj
    else:
        return str(obj)

@app.post("/api/detect")
async def detect_vehicle(
    file: UploadFile = File(...),
    camera_id: Optional[str] = Form("CAM-001"),
    custom_timestamp: Optional[str] = Form(None)
):
    contents = await file.read()
    
    # Resolve selected CCTV camera info
    cam_info = next((c for c in db.get_cameras() if c["id"] == camera_id), db.get_cameras()[0])
    ts = custom_timestamp if custom_timestamp else datetime.datetime.now().isoformat()
    
    is_video = file.content_type.startswith("video/") or file.filename.lower().endswith(('.mp4', '.avi', '.mov', '.webm', '.mkv'))
    
    try:
        if is_video:
            # Video stream frame sampling analysis
            video_result = ai_engine.detect_and_analyze_video(contents)
            primary = video_result["primary_detection"]
            
            # Save detected unique vehicles to database
            saved_ids = []
            for vehicle in video_result["unique_vehicles"]:
                cap = db.add_capture({
                    "camera_id": cam_info["id"],
                    "camera_name": cam_info["name"],
                    "lat": cam_info["lat"],
                    "lng": cam_info["lng"],
                    "zone": cam_info["zone"],
                    "plate_number": str(vehicle["plate_number"]),
                    "vehicle_type": str(vehicle["vehicle_type"]),
                    "vehicle_color": str(vehicle["vehicle_color"]),
                    "visual_description": str(vehicle["visual_description"]),
                    "confidence": float(vehicle["plate_confidence"]),
                    "timestamp": ts
                })
                saved_ids.append(cap["id"])
            
            if primary:
                clean_vehicles = []
                for v in video_result["unique_vehicles"]:
                    v_clean = {k: val for k, val in v.items() if k not in ("all_unique_vehicles", "video_meta")}
                    clean_vehicles.append(v_clean)

                clean_all_frames = []
                for f_det in video_result.get("all_frame_detections", []):
                    f_clean = {k: val for k, val in f_det.items() if k not in ("all_unique_vehicles", "video_meta")}
                    clean_all_frames.append(f_clean)

                response_data = {k: val for k, val in primary.items() if k not in ("all_unique_vehicles", "video_meta")}
                response_data["saved_capture_id"] = saved_ids[0] if saved_ids else None
                response_data["video_meta"] = video_result["video_summary"]
                response_data["all_unique_vehicles"] = clean_vehicles
                response_data["all_frame_detections"] = clean_all_frames
                return sanitize_json_obj(response_data)
            else:
                raise HTTPException(status_code=400, detail="Tidak ada kendaraan terdeteksi dalam video.")
        else:
            # Image frame analysis
            detection_result = ai_engine.detect_and_analyze(contents)
            new_capture = db.add_capture({
                "camera_id": cam_info["id"],
                "camera_name": cam_info["name"],
                "lat": cam_info["lat"],
                "lng": cam_info["lng"],
                "zone": cam_info["zone"],
                "plate_number": str(detection_result["plate_number"]),
                "vehicle_type": str(detection_result["vehicle_type"]),
                "vehicle_color": str(detection_result["vehicle_color"]),
                "visual_description": str(detection_result["visual_description"]),
                "confidence": float(detection_result["plate_confidence"]),
                "timestamp": ts
            })
            detection_result["saved_capture_id"] = new_capture["id"]
            return sanitize_json_obj(detection_result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI Detection failed: {str(e)}")


@app.get("/api/track")
def track_vehicle(query: str = Query(..., description="Nomor Plat atau Deskripsi Visual (e.g. 'B 1234 XYZ' atau 'Sedan Hitam')")):
    return route_tracker.track_vehicle(query)

@app.get("/api/search")
def search_captures(q: Optional[str] = None):
    all_caps = db.get_all_captures()
    if not q:
        return all_caps
    
    q_clean = q.upper().replace(" ", "")
    results = []
    for cap in all_caps:
        plate = cap["plate_number"].upper().replace(" ", "")
        desc = cap["visual_description"].upper()
        vtype = cap["vehicle_type"].upper()
        color = cap["vehicle_color"].upper()
        cam = cap["camera_name"].upper()

        if q_clean in plate or q.upper() in desc or q.upper() in vtype or q.upper() in color or q.upper() in cam:
            results.append(cap)
            
    return results

@app.post("/api/simulate")
def simulate_hit(req: SimulateCaptureRequest):
    cam = next((c for c in db.get_cameras() if c["id"] == req.camera_id), None)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera ID not found.")
    
    new_cap = db.add_capture({
        "camera_id": cam["id"],
        "camera_name": cam["name"],
        "lat": cam["lat"],
        "lng": cam["lng"],
        "zone": cam["zone"],
        "plate_number": req.plate_number,
        "vehicle_type": req.vehicle_type,
        "vehicle_color": req.vehicle_color,
        "visual_description": req.visual_description,
        "confidence": 0.96,
        "timestamp": datetime.datetime.now().isoformat()
    })
    
    return {"status": "SUCCESS", "capture": new_cap}

@app.get("/api/evaluate")
def get_evaluation_metrics():
    """Returns AI research benchmark metrics (mAP, CER, Precision/Recall, Latency)."""
    return evaluator.run_benchmark_evaluation()

if __name__ == "__main__":

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
