import datetime
import math
import os
import json

DATA_FILE = os.path.join(os.path.dirname(__file__), "data_store.json")

class JagaRayaDatabase:
    def __init__(self):
        self.camera_nodes = []
        self.vehicle_captures = []
        
        if os.path.exists(DATA_FILE):
            self._load_from_disk()
        else:
            self._init_default_data()
            self._save_to_disk()

    def _init_default_data(self):
        self.camera_nodes = [
            {"id": "CAM-001", "name": "Simpang Semanggi", "lat": -6.2185, "lng": 106.8142, "zone": "Jakarta Selatan", "status": "ONLINE"},
            {"id": "CAM-002", "name": "Bundaran HI", "lat": -6.1930, "lng": 106.8230, "zone": "Jakarta Pusat", "status": "ONLINE"},
            {"id": "CAM-003", "name": "Monumen Nasional (Monas)", "lat": -6.1754, "lng": 106.8272, "zone": "Jakarta Pusat", "status": "ONLINE"},
            {"id": "CAM-004", "name": "Senayan City Crossing", "lat": -6.2270, "lng": 106.7975, "zone": "Jakarta Selatan", "status": "ONLINE"},
            {"id": "CAM-005", "name": "Simpang Pancoran", "lat": -6.2425, "lng": 106.8432, "zone": "Jakarta Selatan", "status": "ONLINE"},
            {"id": "CAM-006", "name": "Kuningan Flyover", "lat": -6.2245, "lng": 106.8320, "zone": "Jakarta Selatan", "status": "ONLINE"},
            {"id": "CAM-007", "name": "Perempatan Tomang", "lat": -6.1770, "lng": 106.7910, "zone": "Jakarta Barat", "status": "ONLINE"},
            {"id": "CAM-008", "name": "Cawang Interjunction", "lat": -6.2468, "lng": 106.8720, "zone": "Jakarta Timur", "status": "ONLINE"},
            {"id": "CAM-009", "name": "TB Simatupang Outer Ring", "lat": -6.2915, "lng": 106.8210, "zone": "Jakarta Selatan", "city": "Jakarta", "status": "ONLINE"},
            {"id": "CAM-010", "name": "Harmoni Central Hub", "lat": -6.1670, "lng": 106.8205, "zone": "Jakarta Pusat", "city": "Jakarta", "status": "ONLINE"},
            
            # Preset Kamera Bandung
            {"id": "CAM-101", "name": "Gedung Sate Junction", "lat": -6.9025, "lng": 107.6188, "zone": "Bandung Wetan", "city": "Bandung", "status": "ONLINE"},
            {"id": "CAM-102", "name": "Simpang Dago ITB", "lat": -6.8915, "lng": 107.6107, "zone": "Coblong", "city": "Bandung", "status": "ONLINE"},
            {"id": "CAM-103", "name": "Alun-Alun Bandung", "lat": -6.9218, "lng": 107.6071, "zone": "Regol", "city": "Bandung", "status": "ONLINE"},

            # Preset Kamera Surabaya
            {"id": "CAM-201", "name": "Tugu Pahlawan Cross", "lat": -7.2458, "lng": 112.7378, "zone": "Bubutan", "city": "Surabaya", "status": "ONLINE"},
            {"id": "CAM-202", "name": "Simpang Darmo Park", "lat": -7.2891, "lng": 112.7342, "zone": "Wonokromo", "city": "Surabaya", "status": "ONLINE"},

            # Preset Kamera Bali / Denpasar
            {"id": "CAM-301", "name": "Simpang Dewa Ruci Kuta", "lat": -8.7188, "lng": 115.1834, "zone": "Kuta", "city": "Bali", "status": "ONLINE"},
            {"id": "CAM-302", "name": "Kawasan Renon Denpasar", "lat": -8.6705, "lng": 115.2285, "zone": "Denpasar", "city": "Bali", "status": "ONLINE"},

            # Preset Kamera Yogyakarta
            {"id": "CAM-401", "name": "Simpang Tugu Jogja", "lat": -7.7828, "lng": 110.3671, "zone": "Jetis", "city": "Yogyakarta", "status": "ONLINE"},
            {"id": "CAM-402", "name": "Kawasan Malioboro", "lat": -7.7926, "lng": 110.3658, "zone": "Danurejan", "city": "Yogyakarta", "status": "ONLINE"}
        ]
        
        # Add city attribute to initial cameras
        for c in self.camera_nodes:
            if "city" not in c:
                c["city"] = "Jakarta"

        self.vehicle_captures = []
        self._seed_data()

    def _seed_data(self):
        now = datetime.datetime.now()
        
        rute_1 = [
            ("CAM-004", 45, "B 1234 XYZ", "Sedan", "Hitam", "Sedan warna Hitam terdeteksi dengan Plat Nomor [B 1234 XYZ], velg alloy perak."),
            ("CAM-001", 30, "B 1234 XYZ", "Sedan", "Hitam", "Sedan warna Hitam terdeteksi dengan Plat Nomor [B 1234 XYZ], kaca film gelap."),
            ("CAM-006", 18, "B 1234 XYZ", "Sedan", "Hitam", "Sedan warna Hitam terdeteksi dengan Plat Nomor [B 1234 XYZ], bergerak menuju Timur."),
            ("CAM-005", 5, "B 1234 XYZ", "Sedan", "Hitam", "Sedan warna Hitam terdeteksi dengan Plat Nomor [B 1234 XYZ], melintas di Simpang Pancoran.")
        ]
        
        rute_2 = [
            ("CAM-007", 60, "D 9999 SS", "SUV / MPV", "Merah", "SUV warna Merah dengan Plat Nomor [D 9999 SS], roof rack bagasi atas."),
            ("CAM-010", 42, "D 9999 SS", "SUV / MPV", "Merah", "SUV warna Merah dengan Plat Nomor [D 9999 SS], roof rack bagasi atas."),
            ("CAM-003", 25, "D 9999 SS", "SUV / MPV", "Merah", "SUV warna Merah terdeteksi melintas kawasan Monas."),
            ("CAM-002", 10, "D 9999 SS", "SUV / MPV", "Merah", "SUV warna Merah terdeteksi di sekitar Bundaran HI.")
        ]

        rute_3 = [
            ("CAM-009", 50, "F 4321 AB", "Minibus / Hatchback", "Putih", "Minibus warna Putih dengan Plat [F 4321 AB], stiker kaca belakang."),
            ("CAM-005", 30, "F 4321 AB", "Minibus / Hatchback", "Putih", "Minibus warna Putih melintasi Pancoran."),
            ("CAM-008", 12, "F 4321 AB", "Minibus / Hatchback", "Putih", "Minibus Putih terdeteksi di Cawang Interjunction.")
        ]

        rute_4 = [
            ("CAM-006", 22, "B 5555 KOK", "Sepeda Motor", "Hitam", "Sepeda Motor Hitam Plat [B 5555 KOK], boks bagasi belakang."),
            ("CAM-001", 11, "B 5555 KOK", "Sepeda Motor", "Hitam", "Sepeda Motor Hitam melintas Semanggi Loop.")
        ]

        rute_5 = [
            ("CAM-101", 35, "D 1010 BD", "Sedan", "Biru", "Sedan Biru terdeteksi di perempatan Gedung Sate Bandung."),
            ("CAM-102", 15, "D 1010 BD", "Sedan", "Biru", "Sedan Biru melintas kawasan Dago ITB Bandung.")
        ]

        sample_routes = [rute_1, rute_2, rute_3, rute_4, rute_5]

        for route in sample_routes:
            for cam_id, minutes_ago, plate, vtype, color, desc in route:
                cam = next((c for c in self.camera_nodes if c["id"] == cam_id), None)
                if cam:
                    timestamp = (now - datetime.timedelta(minutes=minutes_ago)).isoformat()
                    self.vehicle_captures.append({
                        "id": f"CAP-{len(self.vehicle_captures)+1:04d}",
                        "camera_id": cam_id,
                        "camera_name": cam["name"],
                        "lat": cam["lat"],
                        "lng": cam["lng"],
                        "zone": cam.get("zone", "Zona Default"),
                        "city": cam.get("city", "Jakarta"),
                        "plate_number": plate,
                        "vehicle_type": vtype,
                        "vehicle_color": color,
                        "visual_description": desc,
                        "confidence": 0.94,
                        "timestamp": timestamp
                    })

    def _save_to_disk(self):
        try:
            data = {
                "camera_nodes": self.camera_nodes,
                "vehicle_captures": self.vehicle_captures
            }
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"[WARN] Gagal menyimpan data ke disk: {e}")

    def _load_from_disk(self):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.camera_nodes = data.get("camera_nodes", [])
                self.vehicle_captures = data.get("vehicle_captures", [])
        except Exception as e:
            print(f"[WARN] Gagal memuat data dari disk, menggunakan data bawaan: {e}")
            self._init_default_data()
            self._save_to_disk()

    def add_capture(self, capture_data):
        capture_data["id"] = f"CAP-{len(self.vehicle_captures)+1:04d}"
        if "timestamp" not in capture_data:
            capture_data["timestamp"] = datetime.datetime.now().isoformat()
        self.vehicle_captures.append(capture_data)
        self._save_to_disk()
        return capture_data

    def add_camera(self, cam_data):
        new_id = f"CAM-CUST-{len(self.camera_nodes)+1:03d}"
        camera_node = {
            "id": cam_data.get("id", new_id),
            "name": cam_data.get("name", "Titik Kamera Kustom"),
            "lat": float(cam_data["lat"]),
            "lng": float(cam_data["lng"]),
            "zone": cam_data.get("zone", "Zona Kustom"),
            "city": cam_data.get("city", "Kustom"),
            "status": cam_data.get("status", "ONLINE")
        }
        self.camera_nodes.append(camera_node)
        self._save_to_disk()
        return camera_node

    def delete_camera(self, cam_id):
        self.camera_nodes = [c for c in self.camera_nodes if c["id"] != cam_id]
        self._save_to_disk()
        return True

    def get_cameras(self):
        return self.camera_nodes

    def get_all_captures(self):
        return self.vehicle_captures

db = JagaRayaDatabase()


