import math
import datetime
from database import db

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculates distance between two lat/lng points in KM"""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class NeuralRouteTracker:
    def __init__(self):
        pass

    def track_vehicle(self, query: str):
        """
        Track vehicle trajectory based on exact/fuzzy plate number OR visual natural language description.
        Returns ordered timeline, GIS route points, distance & speed analytics.
        """
        query_clean = query.strip().upper()
        captures = db.get_all_captures()

        # Step 1: Filter captures matching query (Plate OR Visual Attributes)
        matched_hits = []
        for cap in captures:
            plate_clean = cap["plate_number"].replace(" ", "").upper()
            search_query_clean = query_clean.replace(" ", "")

            score = 0
            # Exact plate match
            if search_query_clean in plate_clean or plate_clean in search_query_clean:
                score += 100
            
            # Visual keyword match (e.g. "Sedan", "Merah", "Hitam", "SUV")
            keywords = query_clean.split()
            for kw in keywords:
                if len(kw) >= 3:
                    if kw in cap["vehicle_type"].upper():
                        score += 30
                    if kw in cap["vehicle_color"].upper():
                        score += 30
                    if kw in cap["visual_description"].upper():
                        score += 20

            if score > 0:
                matched_hits.append((cap, score))

        if not matched_hits:
            return {
                "found": False,
                "query": query,
                "total_checkpoints": 0,
                "timeline": [],
                "route_path": [],
                "distance_km": 0.0,
                "avg_speed_kmh": 0.0,
                "message": f"Tidak ditemukan rekaman rute kendaraan untuk query '{query}'."
            }

        # Sort matching captures by timestamp ascending (earliest to latest)
        matched_hits.sort(key=lambda x: x[0]["timestamp"])
        sorted_caps = [h[0] for h in matched_hits]

        # Deduplicate consecutive hits at same camera within 2 minutes
        filtered_caps = []
        for cap in sorted_caps:
            if not filtered_caps:
                filtered_caps.append(cap)
            else:
                last = filtered_caps[-1]
                t_last = datetime.datetime.fromisoformat(last["timestamp"])
                t_curr = datetime.datetime.fromisoformat(cap["timestamp"])
                mins_diff = (t_curr - t_last).total_seconds() / 60.0
                if last["camera_id"] != cap["camera_id"] or mins_diff > 2:
                    filtered_caps.append(cap)

        # Build trajectory route line, calculate distances and speed
        route_path = []
        timeline = []
        total_distance = 0.0
        speeds = []

        for i, cap in enumerate(filtered_caps):
            point = {
                "checkpoint_index": i + 1,
                "camera_id": cap["camera_id"],
                "camera_name": cap["camera_name"],
                "lat": cap["lat"],
                "lng": cap["lng"],
                "timestamp": cap["timestamp"],
                "plate_number": cap["plate_number"],
                "vehicle_type": cap["vehicle_type"],
                "vehicle_color": cap["vehicle_color"],
                "visual_description": cap["visual_description"]
            }
            
            if i > 0:
                prev = filtered_caps[i - 1]
                dist = haversine_distance(prev["lat"], prev["lng"], cap["lat"], cap["lng"])
                total_distance += dist
                
                t_prev = datetime.datetime.fromisoformat(prev["timestamp"])
                t_curr = datetime.datetime.fromisoformat(cap["timestamp"])
                hours_diff = (t_curr - t_prev).total_seconds() / 3600.0
                
                speed = dist / hours_diff if hours_diff > 0 else 40.0
                speed = min(speed, 120.0) # cap reasonable max speed
                speeds.append(speed)
                point["speed_from_prev_kmh"] = round(speed, 1)
                point["distance_from_prev_km"] = round(dist, 2)
            else:
                point["speed_from_prev_kmh"] = 0.0
                point["distance_from_prev_km"] = 0.0

            route_path.append([cap["lat"], cap["lng"]])
            timeline.append(point)

        avg_speed = sum(speeds) / len(speeds) if speeds else 0.0

        target_vehicle = filtered_caps[-1]

        return {
            "found": True,
            "query": query,
            "target_summary": {
                "plate_number": target_vehicle["plate_number"],
                "vehicle_type": target_vehicle["vehicle_type"],
                "vehicle_color": target_vehicle["vehicle_color"],
                "visual_description": target_vehicle["visual_description"],
                "last_seen_camera": target_vehicle["camera_name"],
                "last_seen_time": target_vehicle["timestamp"]
            },
            "total_checkpoints": len(timeline),
            "timeline": timeline,
            "route_path": route_path, # Coordinates array for Leaflet polyline
            "distance_km": round(total_distance, 2),
            "avg_speed_kmh": round(avg_speed, 1),
            "message": f"Ditemukan {len(timeline)} titik pelacakan rute untuk kendaraan."
        }

route_tracker = NeuralRouteTracker()
