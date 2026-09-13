import datetime
import math

class JagaRayaDatabase:
    def __init__(self):
        self.camera_nodes = [
            {"id": "CAM-001", "name": "Simpang Semanggi", "lat": -6.2185, "lng": 106.8142, "zone": "Jakarta Selatan", "status": "ONLINE"},
            {"id": "CAM-002", "name": "Bundaran HI", "lat": -6.1930, "lng": 106.8230, "zone": "Jakarta Pusat", "status": "ONLINE"},
            {"id": "CAM-003", "name": "Monumen Nasional (Monas)", "lat": -6.1754, "lng": 106.8272, "zone": "Jakarta Pusat", "status": "ONLINE"},
            {"id": "CAM-004", "name": "Senayan City Crossing", "lat": -6.2270, "lng": 106.7975, "zone": "Jakarta Selatan", "status": "ONLINE"},
            {"id": "CAM-005", "name": "Simpang Pancoran", "lat": -6.2425, "lng": 106.8432, "zone": "Jakarta Selatan", "status": "ONLINE"},
            {"id": "CAM-006", "name": "Kuningan Flyover", "lat": -6.2245, "lng": 106.8320, "zone": "Jakarta Selatan", "status": "ONLINE"},
            {"id": "CAM-007", "name": "Perempatan Tomang", "lat": -6.1770, "lng": 106.7910, "zone": "Jakarta Barat", "status": "ONLINE"},
            {"id": "CAM-008", "name": "Cawang Interjunction", "lat": -6.2468, "lng": 106.8720, "zone": "Jakarta Timur", "status": "ONLINE"},
            {"id": "CAM-009", "name": "TB Simatupang Outer Ring", "lat": -6.2915, "lng": 106.8210, "zone": "Jakarta Selatan", "status": "ONLINE"},
            {"id": "CAM-010", "name": "Harmoni Central Hub", "lat": -6.1670, "lng": 106.8205, "zone": "Jakarta Pusat", "status": "ONLINE"},
        ]
        self.vehicle_captures = []
        self._seed_data()

    def _seed_data(self):
        now = datetime.datetime.now()
        
        # Target 1: Black Sedan B 1234 XYZ moving from Senayan -> Semanggi -> Kuningan -> Pancoran
        rute_1 = [
            ("CAM-004", 45, "B 1234 XYZ", "Sedan", "Hitam", "Sedan warna Hitam terdeteksi dengan Plat Nomor [B 1234 XYZ], velg alloy perak."),
            ("CAM-001", 30, "B 1234 XYZ", "Sedan", "Hitam", "Sedan warna Hitam terdeteksi dengan Plat Nomor [B 1234 XYZ], kaca film gelap."),
            ("CAM-006", 18, "B 1234 XYZ", "Sedan", "Hitam", "Sedan warna Hitam terdeteksi dengan Plat Nomor [B 1234 XYZ], bergerak menuju Timur."),
            ("CAM-005", 5, "B 1234 XYZ", "Sedan", "Hitam", "Sedan warna Hitam terdeteksi dengan Plat Nomor [B 1234 XYZ], melintas di Simpang Pancoran.")
        ]
        
        # Target 2: Red SUV D 9999 SS moving from Tomang -> Harmoni -> Monas -> Bundaran HI
        rute_2 = [
            ("CAM-007", 60, "D 9999 SS", "SUV / MPV", "Merah", "SUV warna Merah dengan Plat Nomor [D 9999 SS], roof rack bagasi atas."),
            ("CAM-010", 42, "D 9999 SS", "SUV / MPV", "Merah", "SUV warna Merah dengan Plat Nomor [D 9999 SS], roof rack bagasi atas."),
            ("CAM-003", 25, "D 9999 SS", "SUV / MPV", "Merah", "SUV warna Merah terdeteksi melintas kawasan Monas."),
            ("CAM-002", 10, "D 9999 SS", "SUV / MPV", "Merah", "SUV warna Merah terdeteksi di sekitar Bundaran HI.")
        ]

        # Target 3: White Minibus F 4321 AB moving from TB Simatupang -> Pancoran -> Cawang
        rute_3 = [
            ("CAM-009", 50, "F 4321 AB", "Minibus / Hatchback", "Putih", "Minibus warna Putih dengan Plat [F 4321 AB], stiker kaca belakang."),
            ("CAM-005", 30, "F 4321 AB", "Minibus / Hatchback", "Putih", "Minibus warna Putih melintasi Pancoran."),
            ("CAM-008", 12, "F 4321 AB", "Minibus / Hatchback", "Putih", "Minibus Putih terdeteksi di Cawang Interjunction.")
        ]

        # Target 4: Black Motorbike B 5555 KOK moving around Kuningan & Semanggi
        rute_4 = [
            ("CAM-006", 22, "B 5555 KOK", "Sepeda Motor", "Hitam", "Sepeda Motor Hitam Plat [B 5555 KOK], boks bagasi belakang."),
            ("CAM-001", 11, "B 5555 KOK", "Sepeda Motor", "Hitam", "Sepeda Motor Hitam melintas Semanggi Loop.")
        ]

        sample_routes = [rute_1, rute_2, rute_3, rute_4]

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
                        "zone": cam["zone"],
                        "plate_number": plate,
                        "vehicle_type": vtype,
                        "vehicle_color": color,
                        "visual_description": desc,
                        "confidence": 0.94,
                        "timestamp": timestamp
                    })

    def add_capture(self, capture_data):
        capture_data["id"] = f"CAP-{len(self.vehicle_captures)+1:04d}"
        if "timestamp" not in capture_data:
            capture_data["timestamp"] = datetime.datetime.now().isoformat()
        self.vehicle_captures.append(capture_data)
        return capture_data

    def get_cameras(self):
        return self.camera_nodes

    def get_all_captures(self):
        return self.vehicle_captures

db = JagaRayaDatabase()
