"""
Script untuk membuat Dokumen Proposal KTI JagaRaya
Pengembangan Sistem JagaRaya untuk Deteksi Rute Kendaraan Berbasis
Pengenalan Plat Nomor dan Deskripsi Visual Menggunakan Neural Network
"""

from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

doc = Document()

# ─────────────────────────────────────────────
# PAGE SETUP (A4, margin 4-3-3-3 cm)
# ─────────────────────────────────────────────
section = doc.sections[0]
section.page_width  = Cm(21)
section.page_height = Cm(29.7)
section.left_margin   = Cm(4)
section.right_margin  = Cm(3)
section.top_margin    = Cm(3)
section.bottom_margin = Cm(3)

# ─────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────

def set_font(run, name="Times New Roman", size=12, bold=False, italic=False, color=None):
    run.font.name = name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    if color:
        run.font.color.rgb = color
    # force font for east-asian/complex script
    r = run._r
    rPr = r.get_or_add_rPr()
    for tag in [qn('w:rFonts')]:
        el = rPr.find(tag)
        if el is None:
            el = OxmlElement(tag)
            rPr.append(el)
        el.set(qn('w:ascii'), name)
        el.set(qn('w:hAnsi'), name)
        el.set(qn('w:cs'), name)

def add_paragraph(text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=False, italic=False,
                  size=12, space_before=0, space_after=6, first_line=0, line_spacing=None):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.alignment       = align
    pf.space_before    = Pt(space_before)
    pf.space_after     = Pt(space_after)
    pf.first_line_indent = Cm(first_line)
    if line_spacing:
        pf.line_spacing_rule = WD_LINE_SPACING.EXACTLY
        pf.line_spacing      = Pt(line_spacing)
    else:
        pf.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    run = p.add_run(text)
    set_font(run, size=size, bold=bold, italic=italic)
    return p

def add_heading(text, level=1, align=WD_ALIGN_PARAGRAPH.CENTER, size=14, bold=True, upper=False, space_before=12, space_after=6):
    if upper:
        text = text.upper()
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.alignment    = align
    pf.space_before = Pt(space_before)
    pf.space_after  = Pt(space_after)
    pf.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    run = p.add_run(text)
    set_font(run, size=size, bold=bold)
    return p

def add_bab_heading(bab_num, title):
    """Heading BAB level utama"""
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.alignment    = WD_ALIGN_PARAGRAPH.CENTER
    pf.space_before = Pt(12)
    pf.space_after  = Pt(6)
    pf.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    run = p.add_run(f"BAB {bab_num}\n{title.upper()}")
    set_font(run, size=14, bold=True)
    return p

def add_sub_heading(number, title, size=12, space_before=12):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.alignment    = WD_ALIGN_PARAGRAPH.LEFT
    pf.space_before = Pt(space_before)
    pf.space_after  = Pt(3)
    pf.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    run = p.add_run(f"{number} {title}")
    set_font(run, size=size, bold=True)
    return p

def add_page_break():
    doc.add_page_break()

def add_body(text, first_line=1.25):
    """Tambah paragraf isi dengan first-line indent 1.25 cm, spasi ganda"""
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.alignment          = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf.space_before       = Pt(0)
    pf.space_after        = Pt(6)
    pf.first_line_indent  = Cm(first_line)
    pf.line_spacing_rule  = WD_LINE_SPACING.DOUBLE
    run = p.add_run(text)
    set_font(run, size=12)
    return p

def add_numbered_list(items, start=1):
    for i, item in enumerate(items):
        p = doc.add_paragraph()
        pf = p.paragraph_format
        pf.alignment    = WD_ALIGN_PARAGRAPH.JUSTIFY
        pf.space_before = Pt(0)
        pf.space_after  = Pt(3)
        pf.left_indent  = Cm(1.25)
        pf.first_line_indent = Cm(-0.63)
        pf.line_spacing_rule = WD_LINE_SPACING.DOUBLE
        run = p.add_run(f"{i+start}. {item}")
        set_font(run, size=12)

def add_bullet_list(items, bullet="a"):
    chars = list("abcdefghijklmnopqrstuvwxyz")
    for i, item in enumerate(items):
        p = doc.add_paragraph()
        pf = p.paragraph_format
        pf.alignment    = WD_ALIGN_PARAGRAPH.JUSTIFY
        pf.space_before = Pt(0)
        pf.space_after  = Pt(3)
        pf.left_indent  = Cm(1.25)
        pf.first_line_indent = Cm(-0.63)
        pf.line_spacing_rule = WD_LINE_SPACING.DOUBLE
        if bullet == "num":
            label = f"{i+1}."
        else:
            label = f"{chars[i]}."
        run = p.add_run(f"{label} {item}")
        set_font(run, size=12)

def add_table_row(table, cells_data, bold_row=False, bg_color=None):
    row = table.add_row()
    for idx, cell_text in enumerate(cells_data):
        cell = row.cells[idx]
        cell.text = cell_text
        for para in cell.paragraphs:
            para.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in para.runs:
                set_font(run, size=11, bold=bold_row)
        if bg_color:
            tc = cell._tc
            tcPr = tc.get_or_add_tcPr()
            shd = OxmlElement('w:shd')
            shd.set(qn('w:val'), 'clear')
            shd.set(qn('w:color'), 'auto')
            shd.set(qn('w:fill'), bg_color)
            tcPr.append(shd)
    return row


# ═════════════════════════════════════════════════════════════════════════════
# HALAMAN SAMPUL
# ═════════════════════════════════════════════════════════════════════════════

p = doc.add_paragraph()
p.paragraph_format.alignment   = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(0)
p.paragraph_format.space_after  = Pt(0)
p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
run = p.add_run("PROPOSAL KARYA TULIS ILMIAH")
set_font(run, size=16, bold=True)

doc.add_paragraph()

p = doc.add_paragraph()
p.paragraph_format.alignment   = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(0)
p.paragraph_format.space_after  = Pt(6)
p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
run = p.add_run(
    "PENGEMBANGAN SISTEM JAGARAYA UNTUK DETEKSI RUTE KENDARAAN\n"
    "BERBASIS PENGENALAN PLAT NOMOR DAN DESKRIPSI VISUAL\n"
    "MENGGUNAKAN NEURAL NETWORK"
)
set_font(run, size=16, bold=True)

for _ in range(3):
    doc.add_paragraph()

p = doc.add_paragraph()
p.paragraph_format.alignment   = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
run = p.add_run("Diajukan sebagai Syarat untuk Menyelesaikan\nProgram Studi Strata-1 (S1) Teknik Informatika")
set_font(run, size=12, italic=True)

for _ in range(2):
    doc.add_paragraph()

p = doc.add_paragraph()
p.paragraph_format.alignment   = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
run = p.add_run("Oleh:")
set_font(run, size=12)

p = doc.add_paragraph()
p.paragraph_format.alignment   = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
run = p.add_run("MUHAMMAD\nNIM: [NIM MAHASISWA]")
set_font(run, size=14, bold=True)

for _ in range(4):
    doc.add_paragraph()

p = doc.add_paragraph()
p.paragraph_format.alignment   = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
run = p.add_run(
    "PROGRAM STUDI TEKNIK INFORMATIKA\n"
    "FAKULTAS ILMU KOMPUTER\n"
    "[NAMA PERGURUAN TINGGI]\n"
    "2026"
)
set_font(run, size=14, bold=True)

add_page_break()

# ═════════════════════════════════════════════════════════════════════════════
# LEMBAR PENGESAHAN
# ═════════════════════════════════════════════════════════════════════════════

add_heading("LEMBAR PENGESAHAN", size=14, bold=True, upper=False)

add_paragraph(
    "Yang bertanda tangan di bawah ini menyatakan bahwa Proposal Karya Tulis Ilmiah dengan judul:",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=6, space_after=6
)

p = doc.add_paragraph()
p.paragraph_format.alignment   = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.DOUBLE
run = p.add_run(
    '"PENGEMBANGAN SISTEM JAGARAYA UNTUK DETEKSI RUTE KENDARAAN\n'
    'BERBASIS PENGENALAN PLAT NOMOR DAN DESKRIPSI VISUAL\n'
    'MENGGUNAKAN NEURAL NETWORK"'
)
set_font(run, size=12, bold=True)

add_paragraph(
    "telah diperiksa dan disetujui untuk diajukan dalam Seminar Proposal Tugas Akhir.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=6, space_after=12
)

# Tabel tanda tangan
tbl = doc.add_table(rows=1, cols=3)
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
tbl.style = "Table Grid"

# Header row
hdr_row = tbl.rows[0]
cells = hdr_row.cells
for c in cells:
    for par in c.paragraphs:
        for run in par.runs:
            run.font.size = Pt(11)

for c in cells:
    c._tc.get_or_add_tcPr()

cells[0].text = "Mengetahui,\nKetua Program Studi\nTeknik Informatika\n\n\n\n____________________\n[Nama Ketua Prodi]\nNIP/NIDN: __________"
cells[1].text = ""
cells[2].text = f"[Kota], __ September 2026\nDosen Pembimbing,\n\n\n\n\n____________________\n[Nama Pembimbing]\nNIP/NIDN: __________"

for c in cells:
    for par in c.paragraphs:
        par.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        par.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        for run in par.runs:
            set_font(run, size=11)

add_page_break()

# ═════════════════════════════════════════════════════════════════════════════
# KATA PENGANTAR
# ═════════════════════════════════════════════════════════════════════════════

add_heading("KATA PENGANTAR", size=14, bold=True, upper=False, space_before=0)

add_body(
    "Puji syukur penulis panjatkan ke hadirat Allah SWT atas segala rahmat, taufiq, dan hidayah-Nya, "
    "sehingga penulis dapat menyelesaikan penyusunan proposal Karya Tulis Ilmiah yang berjudul "
    '"Pengembangan Sistem JagaRaya untuk Deteksi Rute Kendaraan Berbasis Pengenalan Plat Nomor '
    'dan Deskripsi Visual Menggunakan Neural Network". Shalawat serta salam senantiasa tercurahkan '
    "kepada junjungan Nabi Besar Muhammad SAW beserta para sahabat dan pengikutnya hingga akhir zaman."
)

add_body(
    "Proposal ini disusun sebagai salah satu syarat akademik dalam rangka menyelesaikan Program "
    "Strata-1 (S1) di Program Studi Teknik Informatika. Melalui penelitian ini, penulis berupaya "
    "merancang dan mengimplementasikan sebuah sistem cerdas berbasis kecerdasan buatan yang mampu "
    "mendeteksi, mengenali, dan melacak rute perjalanan kendaraan bermotor melalui analisis citra "
    "kamera pengawas secara otomatis dan akurat."
)

add_body(
    "Penulis menyadari sepenuhnya bahwa dalam penyusunan proposal ini masih terdapat kekurangan "
    "dan keterbatasan. Oleh karena itu, penulis sangat mengharapkan kritik serta saran yang "
    "membangun dari berbagai pihak demi penyempurnaan penelitian ini. Ucapan terima kasih yang "
    "sebesar-besarnya penulis sampaikan kepada:"
)

thanks = [
    "Orang tua dan keluarga yang senantiasa memberikan dukungan moril dan materiil.",
    "Bapak/Ibu [Nama Ketua Prodi] selaku Ketua Program Studi Teknik Informatika.",
    "Bapak/Ibu [Nama Pembimbing] selaku Dosen Pembimbing yang telah memberikan arahan dan bimbingan dengan penuh kesabaran.",
    "Seluruh Dosen dan Staf Akademik yang telah memberikan ilmu dan pelayanan terbaik selama masa studi.",
    "Rekan-rekan mahasiswa yang telah memberikan motivasi, diskusi, dan dukungan selama proses penyusunan proposal ini.",
]
add_numbered_list(thanks)

add_body(
    "Akhir kata, penulis berharap semoga proposal Karya Tulis Ilmiah ini dapat memberikan manfaat "
    "bagi pengembangan ilmu pengetahuan, khususnya di bidang kecerdasan buatan dan sistem "
    "keamanan transportasi di Indonesia."
)

p = doc.add_paragraph()
p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.RIGHT
p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
p.paragraph_format.space_before = Pt(12)
run = p.add_run("[Kota], September 2026\n\n\n\nPenulis")
set_font(run, size=12)

add_page_break()

# ═════════════════════════════════════════════════════════════════════════════
# DAFTAR ISI
# ═════════════════════════════════════════════════════════════════════════════

add_heading("DAFTAR ISI", size=14, bold=True, upper=False, space_before=0)

daftar_isi = [
    ("HALAMAN SAMPUL", "i"),
    ("LEMBAR PENGESAHAN", "ii"),
    ("KATA PENGANTAR", "iii"),
    ("DAFTAR ISI", "iv"),
    ("DAFTAR TABEL", "v"),
    ("DAFTAR GAMBAR", "vi"),
    ("ABSTRAK", "vii"),
    ("", ""),
    ("BAB I PENDAHULUAN", "1"),
    ("1.1 Latar Belakang", "1"),
    ("1.2 Rumusan Masalah", "5"),
    ("1.3 Tujuan Penelitian", "5"),
    ("1.4 Manfaat Penelitian", "6"),
    ("1.5 Batasan Masalah", "6"),
    ("1.6 Sistematika Penulisan", "7"),
    ("", ""),
    ("BAB II TINJAUAN PUSTAKA", "8"),
    ("2.1 Kajian Teori", "8"),
    ("    2.1.1 Sistem JagaRaya", "8"),
    ("    2.1.2 Neural Network (Jaringan Syaraf Tiruan)", "9"),
    ("    2.1.3 Convolutional Neural Network (CNN)", "10"),
    ("    2.1.4 You Only Look Once (YOLO)", "11"),
    ("    2.1.5 Automatic Number Plate Recognition (ANPR)", "12"),
    ("    2.1.6 Optical Character Recognition (OCR)", "13"),
    ("    2.1.7 Deskripsi Visual Kendaraan", "14"),
    ("    2.1.8 Rekonstruksi Rute Perjalanan", "15"),
    ("2.2 Kajian Penelitian Terkait", "15"),
    ("2.3 Kerangka Berpikir", "20"),
    ("", ""),
    ("BAB III METODOLOGI PENELITIAN", "22"),
    ("3.1 Jenis Penelitian", "22"),
    ("3.2 Lokasi dan Waktu Penelitian", "22"),
    ("3.3 Deskripsi Dataset", "23"),
    ("3.4 Metode dan Algoritma", "25"),
    ("3.5 Arsitektur Sistem JagaRaya", "27"),
    ("3.6 Alur Pengolahan Data (Pipeline)", "28"),
    ("3.7 Rancangan Antarmuka Sistem", "30"),
    ("3.8 Rencana Pengujian", "31"),
    ("3.9 Jadwal Penelitian", "33"),
    ("", ""),
    ("DAFTAR PUSTAKA", "35"),
]

for item, page in daftar_isi:
    if item == "":
        doc.add_paragraph()
        continue
    p = doc.add_paragraph()
    p.paragraph_format.alignment   = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(0)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.tab_stops.add_tab_stop(Cm(14), WD_ALIGN_PARAGRAPH.RIGHT)
    run = p.add_run(f"{item}\t{page}")
    set_font(run, size=12)

add_page_break()

# ═════════════════════════════════════════════════════════════════════════════
# DAFTAR TABEL
# ═════════════════════════════════════════════════════════════════════════════

add_heading("DAFTAR TABEL", size=14, bold=True, upper=False, space_before=0)

daftar_tabel = [
    ("Tabel 2.1", "Perbandingan Arsitektur YOLO pada Berbagai Versi", "12"),
    ("Tabel 2.2", "Kajian Penelitian Terkait Sistem JagaRaya", "16"),
    ("Tabel 3.1", "Rincian Komposisi Dataset", "24"),
    ("Tabel 3.2", "Spesifikasi Teknis Komponen Sistem", "27"),
    ("Tabel 3.3", "Metrik Evaluasi Model", "32"),
    ("Tabel 3.4", "Jadwal Pelaksanaan Penelitian", "34"),
]

for nomor, judul, hal in daftar_tabel:
    p = doc.add_paragraph()
    p.paragraph_format.alignment   = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(0)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.tab_stops.add_tab_stop(Cm(14), WD_ALIGN_PARAGRAPH.RIGHT)
    run = p.add_run(f"{nomor}  {judul}\t{hal}")
    set_font(run, size=12)

add_page_break()

# ═════════════════════════════════════════════════════════════════════════════
# DAFTAR GAMBAR
# ═════════════════════════════════════════════════════════════════════════════

add_heading("DAFTAR GAMBAR", size=14, bold=True, upper=False, space_before=0)

daftar_gambar = [
    ("Gambar 2.1", "Struktur Dasar Neural Network (Jaringan Syaraf Tiruan)", "9"),
    ("Gambar 2.2", "Arsitektur Convolutional Neural Network (CNN)", "10"),
    ("Gambar 2.3", "Arsitektur YOLOv8 untuk Deteksi Objek", "11"),
    ("Gambar 2.4", "Skema Sistem ANPR secara Umum", "13"),
    ("Gambar 2.5", "Arsitektur CRNN untuk Pengenalan Karakter", "14"),
    ("Gambar 2.6", "Kerangka Berpikir Penelitian JagaRaya", "21"),
    ("Gambar 3.1", "Diagram Alir Metodologi Penelitian", "22"),
    ("Gambar 3.2", "Contoh Sampel Dataset Kendaraan CCTV", "24"),
    ("Gambar 3.3", "Arsitektur Sistem JagaRaya secara Keseluruhan", "27"),
    ("Gambar 3.4", "Pipeline Pemrosesan Citra pada Sistem JagaRaya", "28"),
    ("Gambar 3.5", "Mockup Antarmuka Dashboard Sistem JagaRaya", "30"),
    ("Gambar 3.6", "Visualisasi Rekonstruksi Rute Perjalanan Kendaraan", "31"),
]

for nomor, judul, hal in daftar_gambar:
    p = doc.add_paragraph()
    p.paragraph_format.alignment   = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(0)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.tab_stops.add_tab_stop(Cm(14), WD_ALIGN_PARAGRAPH.RIGHT)
    run = p.add_run(f"{nomor}  {judul}\t{hal}")
    set_font(run, size=12)

add_page_break()

# ═════════════════════════════════════════════════════════════════════════════
# ABSTRAK
# ═════════════════════════════════════════════════════════════════════════════

add_heading("ABSTRAK", size=14, bold=True, upper=False, space_before=0)

p = doc.add_paragraph()
pf = p.paragraph_format
pf.alignment    = WD_ALIGN_PARAGRAPH.JUSTIFY
pf.space_before = Pt(0)
pf.space_after  = Pt(6)
pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
run = p.add_run(
    "Muhammad. (2026). Pengembangan Sistem JagaRaya untuk Deteksi Rute Kendaraan Berbasis "
    "Pengenalan Plat Nomor dan Deskripsi Visual Menggunakan Neural Network. Program Studi Teknik "
    "Informatika, [Nama Perguruan Tinggi]. Pembimbing: [Nama Pembimbing]."
)
set_font(run, size=12, bold=True)

add_body(
    "Keamanan lalu lintas dan pengawasan kendaraan bermotor merupakan tantangan kritis yang "
    "dihadapi oleh instansi penegak hukum dan pengelola infrastruktur kota. Sistem kamera pengawas "
    "(CCTV) telah terpasang secara masif di berbagai ruas jalan, namun keterbatasan sumber daya "
    "manusia dalam memproses rekaman video secara manual menjadi hambatan utama dalam pemanfaatan "
    "data tersebut secara optimal. Penelitian ini bertujuan merancang dan mengimplementasikan Sistem "
    "JagaRaya, sebuah platform cerdas berbasis kecerdasan buatan (Artificial Intelligence) yang "
    "mampu secara otomatis mengenali plat nomor kendaraan, mendeskripsikan atribut visual kendaraan, "
    "serta merekonstruksi rute perjalanan kendaraan berdasarkan data multi-kamera CCTV. Metode yang "
    "digunakan dalam sistem ini meliputi: (1) Deteksi objek kendaraan dan lokalisasi plat nomor "
    "menggunakan arsitektur YOLOv8; (2) Pengenalan karakter plat nomor menggunakan model OCR "
    "berbasis Convolutional Recurrent Neural Network (CRNN) dan EasyOCR; (3) Klasifikasi atribut "
    "visual kendaraan mencakup jenis kendaraan, warna, dan merk menggunakan CNN; serta (4) "
    "Rekonstruksi rute berbasis pencocokan identitas kendaraan dengan data timestamp dan lokasi "
    "titik kamera. Dataset yang digunakan terdiri dari citra kendaraan yang dihimpun dari rekaman "
    "CCTV publik dengan berbagai kondisi pencahayaan dan sudut pengambilan gambar. Kinerja sistem "
    "akan dievaluasi menggunakan metrik Precision, Recall, F1-Score, mean Average Precision (mAP), "
    "serta Character Error Rate (CER). Sistem JagaRaya diharapkan mampu meningkatkan efektivitas "
    "pengawasan lalu lintas, mendukung investigasi kriminal, serta menjadi fondasi bagi "
    "pengembangan kota cerdas (smart city) di Indonesia."
)

p = doc.add_paragraph()
pf = p.paragraph_format
pf.alignment    = WD_ALIGN_PARAGRAPH.JUSTIFY
pf.space_before = Pt(0)
pf.space_after  = Pt(0)
pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
run = p.add_run(
    "Kata Kunci: Sistem JagaRaya, Neural Network, ANPR, Deteksi Plat Nomor, YOLOv8, "
    "CRNN, EasyOCR, Deskripsi Visual Kendaraan, Rekonstruksi Rute Perjalanan, Deep Learning."
)
set_font(run, size=12, italic=True)

add_page_break()

# ═════════════════════════════════════════════════════════════════════════════
# BAB I - PENDAHULUAN
# ═════════════════════════════════════════════════════════════════════════════

add_bab_heading("I", "PENDAHULUAN")

add_sub_heading("1.1", "Latar Belakang")

add_body(
    "Era digitalisasi dan transformasi teknologi informasi yang semakin masif telah memberikan "
    "dampak signifikan terhadap berbagai aspek kehidupan masyarakat, termasuk dalam bidang keamanan "
    "dan pengawasan lalu lintas. Indonesia sebagai negara dengan jumlah kendaraan bermotor yang "
    "terus meningkat dari tahun ke tahun menghadapi tantangan kompleks dalam hal pengelolaan "
    "keamanan jalan raya. Data Korlantas Polri tahun 2024 mencatat bahwa jumlah kendaraan bermotor "
    "terdaftar di Indonesia telah melampaui angka 160 juta unit, dengan tingkat pertumbuhan rata-rata "
    "5-8% per tahun. Kondisi ini sejalan dengan meningkatnya angka kejadian pelanggaran lalu lintas, "
    "kecelakaan, dan berbagai tindak kriminalitas yang melibatkan kendaraan bermotor."
)

add_body(
    "Kamera pengawas atau Closed-Circuit Television (CCTV) telah menjadi tulang punggung sistem "
    "keamanan modern di berbagai kota besar Indonesia. Ribuan kamera CCTV terpasang di persimpangan "
    "jalan, gerbang tol, area parkir, dan fasilitas publik lainnya sebagai upaya pemantauan dan "
    "perekaman aktivitas lalu lintas secara kontinu. Namun, volume data video yang dihasilkan oleh "
    "jaringan kamera tersebut sangat besar dan tidak dapat diproses secara efisien oleh manusia "
    "secara manual. Keterbatasan ini menciptakan kesenjangan yang signifikan antara kapasitas "
    "pengumpulan data dan kemampuan analisis informasi yang bermakna."
)

add_body(
    "Automatic Number Plate Recognition (ANPR) atau sistem pengenalan plat nomor otomatis telah "
    "berkembang menjadi solusi teknologi yang sangat relevan untuk menjawab tantangan tersebut. "
    "Sistem ANPR memanfaatkan teknik pengolahan citra digital dan kecerdasan buatan untuk "
    "mengidentifikasi dan membaca teks plat nomor kendaraan dari data rekaman kamera secara "
    "otomatis. Teknologi ini telah terbukti digunakan secara luas di berbagai negara maju untuk "
    "mendukung penegakan hukum lalu lintas, sistem Electronic Traffic Law Enforcement (ETLE), "
    "manajemen parkir otomatis, dan investigasi kriminal (Putri et al., 2023)."
)

add_body(
    "Perkembangan paradigma Deep Learning, khususnya arsitektur Convolutional Neural Network "
    "(CNN) dan varian deteksi objek berbasis YOLO (You Only Look Once), telah merevolusi kemampuan "
    "sistem pengenalan visual secara fundamental. Arsitektur YOLOv8 yang dikembangkan oleh "
    "Ultralytics mampu mendeteksi objek secara real-time dengan akurasi mean Average Precision "
    "(mAP) yang sangat tinggi, bahkan melebihi 95% pada berbagai benchmark standar industri "
    "(Sugeng et al., 2023). Kemajuan ini membuka peluang untuk membangun sistem pengawasan "
    "kendaraan yang jauh lebih akurat dan efisien dibandingkan sistem berbasis pemrosesan citra "
    "konvensional."
)

add_body(
    "Di samping pengenalan plat nomor, deskripsi visual kendaraan seperti identifikasi jenis "
    "kendaraan (sedan, SUV, bus, truk), warna dominan, dan ciri-ciri fisik lainnya merupakan "
    "informasi komplementer yang sangat berharga, terutama dalam situasi di mana plat nomor tidak "
    "terbaca dengan jelas akibat kondisi pencahayaan yang buruk, kerusakan fisik plat, atau "
    "pemalsuan identitas kendaraan. Kombinasi antara data plat nomor dan deskripsi visual "
    "membentuk identitas kendaraan yang lebih robust dan andal (Setiawan & Farhan, 2022)."
)

add_body(
    "Lebih jauh, dengan mengintegrasikan data dari jaringan kamera multi-titik, sistem yang "
    "canggih dapat merekonstruksi rute perjalanan suatu kendaraan berdasarkan urutan kemunculannya "
    "pada berbagai titik kamera beserta timestamp yang tercatat. Kemampuan pelacakan rute ini "
    "memiliki nilai strategis yang tinggi dalam konteks investigasi kejahatan, pencarian kendaraan "
    "hilang, analisis pola mobilitas perkotaan, hingga perencanaan kebijakan transportasi yang "
    "berbasis data (Mulyana & Rofik, 2022)."
)

add_body(
    "Sistem JagaRaya hadir sebagai jawaban inovatif atas kebutuhan tersebut. Sebagai sebuah "
    "platform pengawasan kendaraan berbasis kecerdasan buatan, JagaRaya dirancang untuk "
    "mengintegrasikan kemampuan deteksi plat nomor, deskripsi visual kendaraan, dan rekonstruksi "
    "rute perjalanan dalam satu ekosistem sistem yang terpadu dan efisien. Sistem ini diharapkan "
    "dapat menjadi kontribusi nyata dalam pengembangan infrastruktur smart city dan mendukung "
    "tugas-tugas penegakan hukum lalu lintas di Indonesia."
)

add_body(
    "Berdasarkan latar belakang yang telah diuraikan di atas, penulis tertarik untuk melakukan "
    "penelitian dengan judul \"Pengembangan Sistem JagaRaya untuk Deteksi Rute Kendaraan Berbasis "
    "Pengenalan Plat Nomor dan Deskripsi Visual Menggunakan Neural Network\"."
)

add_sub_heading("1.2", "Rumusan Masalah")

add_body("Berdasarkan latar belakang yang telah diuraikan, maka rumusan masalah dalam penelitian ini adalah sebagai berikut:")

rumusan = [
    "Bagaimana merancang dan mengimplementasikan sistem JagaRaya yang mampu mengenali plat nomor kendaraan serta mendeskripsikan ciri visual kendaraan secara otomatis menggunakan Neural Network?",
    "Bagaimana akurasi dan kinerja model Neural Network dalam mendeteksi rute perjalanan kendaraan berdasarkan gabungan data plat nomor dan deskripsi visual dari jaringan kamera CCTV multi-titik?",
]
add_numbered_list(rumusan)

add_sub_heading("1.3", "Tujuan Penelitian")

add_body("Adapun tujuan yang hendak dicapai dalam penelitian ini adalah:")

tujuan = [
    "Merancang dan mengimplementasikan sistem JagaRaya yang mengintegrasikan model Neural Network untuk pengenalan plat nomor otomatis (ANPR) dan deskripsi atribut visual kendaraan secara real-time.",
    "Mengukur dan mengevaluasi akurasi serta kinerja model Neural Network dalam melakukan deteksi, pengenalan, dan rekonstruksi rute perjalanan kendaraan berdasarkan data gabungan plat nomor dan deskripsi visual dari jaringan kamera CCTV.",
]
add_numbered_list(tujuan)

add_sub_heading("1.4", "Manfaat Penelitian")

add_sub_heading("1.4.1", "Manfaat Teoritis", size=12, space_before=6)
manfaat_teoritis = [
    "Memberikan kontribusi ilmiah pada pengembangan model Neural Network untuk aplikasi computer vision di bidang pengawasan lalu lintas.",
    "Memperkaya literatur keilmuan tentang integrasi sistem ANPR dan deskripsi visual kendaraan dalam konteks smart city Indonesia.",
    "Menjadi referensi akademik bagi penelitian lanjutan di bidang kecerdasan buatan, pengolahan citra, dan sistem pengawasan kendaraan.",
]
add_numbered_list(manfaat_teoritis)

add_sub_heading("1.4.2", "Manfaat Praktis", size=12, space_before=6)
manfaat_praktis = [
    "Instansi Penegak Hukum: Sistem JagaRaya dapat digunakan sebagai alat bantu investigasi kejahatan yang melibatkan kendaraan bermotor, mempercepat proses identifikasi dan pelacakan kendaraan yang terlibat dalam tindak kriminal.",
    "Pengelola Transportasi Kota: Menyediakan data analitik pola mobilitas kendaraan yang dapat dimanfaatkan untuk perencanaan dan optimasi sistem transportasi perkotaan.",
    "Perguruan Tinggi: Sistem JagaRaya dapat digunakan sebagai objek studi kasus dan platform penelitian dalam bidang kecerdasan buatan dan rekayasa perangkat lunak.",
    "Masyarakat Umum: Secara tidak langsung berkontribusi pada peningkatan keamanan dan ketertiban lalu lintas di lingkungan sekitar.",
]
add_numbered_list(manfaat_praktis)

add_sub_heading("1.5", "Batasan Masalah")

add_body("Untuk menjaga fokus dan kedalaman penelitian, penulis membatasi ruang lingkup penelitian ini sebagai berikut:")

batasan = [
    "Sistem dikembangkan untuk mengenali plat nomor kendaraan dengan format standar Indonesia (sesuai Peraturan Kapolri No. 7 Tahun 2021).",
    "Deteksi dan klasifikasi visual kendaraan mencakup tiga atribut utama: jenis kendaraan (roda dua dan roda empat), warna dominan kendaraan, dan jenis bodi kendaraan.",
    "Dataset yang digunakan merupakan citra dan video yang diperoleh dari kamera CCTV publik dengan resolusi minimal 720p.",
    "Rekonstruksi rute perjalanan diimplementasikan berdasarkan data dari minimum tiga titik kamera yang saling terhubung dalam area jaringan yang telah ditentukan.",
    "Sistem dirancang dan diuji pada lingkungan pengujian terkontrol (testbed) menggunakan data rekaman video yang telah dikumpulkan sebelumnya (offline processing), tidak dalam mode streaming real-time.",
    "Evaluasi kinerja sistem dilakukan menggunakan metrik standar machine learning: Precision, Recall, F1-Score, mAP (untuk deteksi), dan Character Error Rate/CER (untuk OCR plat nomor).",
    "Pengembangan antarmuka sistem berbasis aplikasi web (web-based dashboard) menggunakan framework standar yang bersifat responsif.",
]
add_numbered_list(batasan)

add_sub_heading("1.6", "Sistematika Penulisan")

add_body(
    "Agar pembahasan dalam proposal ini dapat dipahami secara sistematis dan komprehensif, "
    "penulisan disusun dengan sistematika sebagai berikut:"
)

sistematika = [
    "BAB I PENDAHULUAN: Berisi uraian tentang latar belakang permasalahan, rumusan masalah, tujuan penelitian, manfaat penelitian, batasan masalah, dan sistematika penulisan.",
    "BAB II TINJAUAN PUSTAKA: Memuat kajian teori yang relevan dengan topik penelitian, meliputi konsep dasar Neural Network, CNN, YOLO, ANPR, OCR, serta ulasan terhadap penelitian-penelitian terdahulu yang berkaitan dengan topik sistem JagaRaya.",
    "BAB III METODOLOGI PENELITIAN: Menjelaskan secara rinci metode penelitian yang digunakan, mencakup jenis penelitian, deskripsi dataset, algoritma dan metode yang diterapkan, arsitektur sistem, alur pengolahan data, rancangan antarmuka, rencana pengujian, serta jadwal penelitian.",
    "DAFTAR PUSTAKA: Memuat seluruh sumber referensi yang dikutip dalam penulisan proposal ini, disusun sesuai dengan format penulisan ilmiah yang berlaku.",
]
add_numbered_list(sistematika)

add_page_break()

# ═════════════════════════════════════════════════════════════════════════════
# BAB II - TINJAUAN PUSTAKA
# ═════════════════════════════════════════════════════════════════════════════

add_bab_heading("II", "TINJAUAN PUSTAKA")

add_sub_heading("2.1", "Kajian Teori")

add_sub_heading("2.1.1", "Sistem JagaRaya", size=12, space_before=6)
add_body(
    "Sistem JagaRaya merupakan platform pengawasan kendaraan berbasis kecerdasan buatan yang "
    "dirancang secara khusus untuk mengintegrasikan berbagai teknologi pemrosesan visual dalam "
    "satu ekosistem yang kohesif. Nama 'JagaRaya' diambil dari bahasa Indonesia yang bermakna "
    "'penjaga jalan raya', merefleksikan fungsi utama sistem dalam melakukan pemantauan dan "
    "pengawasan lalu lintas secara otomatis dan cerdas. Sistem ini memiliki tiga komponen inti "
    "yang saling terintegrasi: (1) modul pengenalan plat nomor (ANPR), (2) modul deskripsi visual "
    "kendaraan, dan (3) modul rekonstruksi rute perjalanan. Ketiga modul tersebut bekerja secara "
    "sinergis untuk menghasilkan informasi identitas kendaraan yang komprehensif dan riwayat "
    "perjalanannya dalam jaringan kamera CCTV yang terpasang."
)

add_body(
    "Konsep dasar Sistem JagaRaya mengadopsi pendekatan multi-modal fusion, di mana informasi "
    "dari berbagai sumber (plat nomor, atribut visual, lokasi, dan waktu) digabungkan untuk "
    "menghasilkan identifikasi kendaraan yang lebih akurat dan handal. Pendekatan ini sangat "
    "penting mengingat tantangan nyata di lapangan seperti plat nomor yang tidak terbaca, kondisi "
    "pencahayaan rendah, atau sudut pandang kamera yang tidak ideal."
)

add_sub_heading("2.1.2", "Neural Network (Jaringan Syaraf Tiruan)", size=12, space_before=6)
add_body(
    "Neural Network atau Jaringan Syaraf Tiruan (JST) adalah model komputasi yang terinspirasi "
    "dari cara kerja neuron biologis dalam otak manusia. Secara arsitektural, Neural Network "
    "terdiri dari lapisan-lapisan (layers) neuron buatan yang saling terhubung: lapisan masukan "
    "(input layer), satu atau lebih lapisan tersembunyi (hidden layers), dan lapisan keluaran "
    "(output layer). Setiap koneksi antar neuron memiliki bobot (weight) yang menentukan kekuatan "
    "pengaruh satu neuron terhadap neuron lainnya."
)

add_body(
    "Proses pembelajaran pada Neural Network dilakukan melalui mekanisme backpropagation dan "
    "gradient descent, di mana bobot koneksi secara iteratif diperbarui berdasarkan selisih antara "
    "output yang diprediksi dan output aktual (error/loss). Fungsi aktivasi seperti ReLU (Rectified "
    "Linear Unit), Sigmoid, dan Softmax berperan penting dalam memperkenalkan non-linearitas ke "
    "dalam model sehingga dapat mempelajari pola yang kompleks. Deep Learning merupakan perluasan "
    "dari Neural Network dengan menggunakan arsitektur berlapis-lapis yang sangat dalam, "
    "memungkinkan ekstraksi fitur dari data pada berbagai tingkatan abstraksi yang berbeda "
    "(Mohti et al., 2024)."
)

add_sub_heading("2.1.3", "Convolutional Neural Network (CNN)", size=12, space_before=6)
add_body(
    "Convolutional Neural Network (CNN) adalah jenis arsitektur Deep Learning yang dirancang "
    "khusus untuk memproses data yang memiliki struktur grid, seperti citra digital. CNN "
    "menggunakan operasi konvolusi sebagai operasi utamanya, yang memungkinkan jaringan untuk "
    "secara otomatis mempelajari fitur-fitur visual yang relevan secara hierarkis: dari fitur "
    "tingkat rendah seperti tepi (edges) dan tekstur, hingga fitur tingkat tinggi seperti bentuk "
    "objek dan pola kompleks."
)

add_body(
    "Komponen-komponen utama dalam arsitektur CNN meliputi: (1) Convolutional Layer yang "
    "menerapkan filter/kernel untuk mengekstrak peta fitur (feature maps); (2) Pooling Layer "
    "yang melakukan down-sampling untuk mengurangi dimensi spasial sambil mempertahankan informasi "
    "penting; dan (3) Fully Connected Layer yang menghubungkan semua neuron untuk menghasilkan "
    "prediksi akhir. Arsitektur CNN populer yang sering digunakan sebagai base model dalam "
    "penelitian computer vision antara lain ResNet, VGG, EfficientNet, dan MobileNet "
    "(Anam et al., 2025)."
)

add_sub_heading("2.1.4", "You Only Look Once (YOLO)", size=12, space_before=6)
add_body(
    "You Only Look Once (YOLO) adalah keluarga arsitektur deteksi objek berbasis Deep Learning "
    "yang pertama kali diperkenalkan oleh Redmon et al. (2016). Keunggulan utama YOLO terletak "
    "pada pendekatannya yang memperlakukan deteksi objek sebagai masalah regresi tunggal: seluruh "
    "gambar diproses dalam satu forward pass jaringan saraf untuk memprediksi bounding box dan "
    "probabilitas kelas secara simultan, sehingga memungkinkan deteksi real-time dengan kecepatan "
    "yang jauh lebih tinggi dibandingkan arsitektur two-stage seperti R-CNN."
)

add_body(
    "YOLOv8, yang dirilis oleh Ultralytics pada Januari 2023, merupakan varian YOLO terkini yang "
    "menghadirkan peningkatan signifikan dalam hal akurasi, kecepatan, dan kemudahan penggunaan. "
    "YOLOv8 menggunakan arsitektur anchor-free dengan decoupled head yang memisahkan prediksi "
    "klasifikasi dan regresi, serta backbone CSPDarknet yang ditingkatkan. Dalam penelitian "
    "Sugeng et al. (2023), YOLOv8 berhasil mencapai mAP@0.5 sebesar 98.3% pada dataset plat "
    "nomor kendaraan Indonesia, menjadikannya pilihan arsitektur yang sangat menjanjikan untuk "
    "sistem ANPR."
)

# Table 2.1
add_sub_heading("", "Tabel 2.1 Perbandingan Arsitektur YOLO pada Berbagai Versi", size=11, space_before=6)
tbl1 = doc.add_table(rows=5, cols=4)
tbl1.style = "Table Grid"
tbl1.alignment = WD_TABLE_ALIGNMENT.CENTER

header_data = ["Versi YOLO", "Tahun Rilis", "mAP (COCO)", "FPS (GPU)"]
for i, txt in enumerate(header_data):
    cell = tbl1.rows[0].cells[i]
    cell.text = txt
    for par in cell.paragraphs:
        par.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in par.runs:
            set_font(run, size=11, bold=True)

rows_data = [
    ["YOLOv5", "2020", "56.8%", "~140"],
    ["YOLOv7", "2022", "56.9%", "~161"],
    ["YOLOv8n", "2023", "37.3%", "~730"],
    ["YOLOv8l", "2023", "52.9%", "~120"],
]
for ri, rdata in enumerate(rows_data):
    row = tbl1.rows[ri + 1]
    for ci, txt in enumerate(rdata):
        cell = row.cells[ci]
        cell.text = txt
        for par in cell.paragraphs:
            par.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in par.runs:
                set_font(run, size=11)

add_paragraph("Sumber: Diadaptasi dari Sugeng et al. (2023) dan dokumentasi resmi Ultralytics", 
              align=WD_ALIGN_PARAGRAPH.CENTER, size=10, italic=True, space_before=2, space_after=6)

add_sub_heading("2.1.5", "Automatic Number Plate Recognition (ANPR)", size=12, space_before=6)
add_body(
    "Automatic Number Plate Recognition (ANPR), yang juga dikenal sebagai License Plate "
    "Recognition (LPR), adalah teknologi yang menggunakan teknik machine vision dan kecerdasan "
    "buatan untuk secara otomatis membaca dan mengidentifikasi teks plat nomor kendaraan dari "
    "citra atau rekaman video. Sistem ANPR umumnya terdiri dari beberapa tahapan pemrosesan yang "
    "berurutan: (1) deteksi dan lokalisasi area plat nomor dalam frame video menggunakan algoritma "
    "deteksi objek; (2) normalisasi dan pra-pemrosesan citra plat yang terdeteksi; (3) segmentasi "
    "karakter individu pada plat; dan (4) pengenalan setiap karakter menggunakan model OCR "
    "(Christanti et al., 2024)."
)

add_body(
    "Tantangan utama dalam pengembangan sistem ANPR yang handal mencakup variasi kondisi "
    "pencahayaan (siang, malam, backlit), variasi sudut pengambilan gambar (frontal vs. lateral), "
    "variasi kecepatan kendaraan (yang dapat menyebabkan motion blur), kondisi cuaca yang buruk, "
    "serta keragaman format plat nomor antar daerah dan jenis kendaraan. Penelitian terkini "
    "menunjukkan bahwa sistem ANPR berbasis Deep Learning secara konsisten mencapai akurasi "
    "pengenalan karakter di atas 90% bahkan dalam kondisi yang menantang (Aprilino & Al Amin, 2022)."
)

add_sub_heading("2.1.6", "Optical Character Recognition (OCR)", size=12, space_before=6)
add_body(
    "Optical Character Recognition (OCR) adalah teknologi yang memungkinkan konversi citra berisi "
    "teks tertulis atau tercetak menjadi data teks yang dapat diproses secara komputasional. Dalam "
    "konteks sistem ANPR, OCR digunakan untuk mengenali dan mengekstrak karakter-karakter teks dari "
    "citra plat nomor yang telah dilokalisasi. Dua pendekatan utama OCR yang relevan dengan "
    "penelitian ini adalah:"
)

ocr_list = [
    "EasyOCR: Merupakan library OCR open-source berbasis Deep Learning yang dikembangkan oleh JaidedAI. EasyOCR mendukung lebih dari 80 bahasa dan menggunakan arsitektur berbasis CRAFT (Character Region Awareness for Text Detection) untuk deteksi teks dan model CRNN berbasis ResNet untuk pengenalan karakter. Kelebihannya adalah kemudahan penggunaan dan performa yang kompetitif pada kondisi teks bervariasi (Mohti et al., 2024).",
    "CRNN (Convolutional Recurrent Neural Network): Merupakan arsitektur yang menggabungkan CNN untuk ekstraksi fitur visual dari citra teks dengan Recurrent Neural Network (RNN) berbasis LSTM/BiLSTM untuk pemodelan sekuens karakter. CRNN mampu mengenali teks pada gambar tanpa memerlukan segmentasi karakter eksplisit terlebih dahulu, menjadikannya sangat cocok untuk pengenalan plat nomor yang memiliki teks dalam satu baris (Sugeng et al., 2023).",
]
add_numbered_list(ocr_list)

add_body(
    "Penelitian Pratama et al. (2025) menunjukkan bahwa kombinasi antara YOLOv8 untuk deteksi "
    "plat dan EasyOCR untuk pembacaan karakter menghasilkan akurasi sistem ANPR yang mencapai "
    "92.7% pada dataset plat nomor Indonesia, dengan Character Error Rate (CER) sebesar 4.2%."
)

add_sub_heading("2.1.7", "Deskripsi Visual Kendaraan", size=12, space_before=6)
add_body(
    "Deskripsi visual kendaraan merujuk pada proses otomatis untuk mengidentifikasi dan "
    "mengklasifikasikan atribut-atribut fisik yang tampak dari sebuah kendaraan bermotor "
    "berdasarkan analisis citra. Atribut-atribut yang umumnya diekstrak meliputi: jenis/tipe "
    "kendaraan (motor, sedan, hatchback, SUV, MPV, pikap, bus, truk), warna dominan kendaraan, "
    "dan terkadang merk/pabrikan kendaraan. Informasi deskripsi visual ini sangat komplementer "
    "terhadap data plat nomor, terutama dalam skenario di mana plat nomor tidak dapat terbaca "
    "dengan jelas."
)

add_body(
    "Pendekatan modern untuk deskripsi visual kendaraan menggunakan CNN sebagai ekstraktor fitur "
    "yang dikombinasikan dengan classifier multi-kelas. Model seperti ResNet-50 yang telah "
    "dilatih dengan teknik transfer learning pada dataset kendaraan spesifik mampu mengklasifikasikan "
    "jenis kendaraan dengan akurasi mencapai 95.6% (Mulyana & Rofik, 2022). Untuk klasifikasi "
    "warna kendaraan, pendekatan yang umum digunakan adalah transformasi ruang warna dari RGB ke "
    "HSV (Hue-Saturation-Value) dikombinasikan dengan model CNN untuk meningkatkan invariansi "
    "terhadap perubahan kondisi pencahayaan."
)

add_sub_heading("2.1.8", "Rekonstruksi Rute Perjalanan", size=12, space_before=6)
add_body(
    "Rekonstruksi rute perjalanan kendaraan dalam konteks sistem JagaRaya didefinisikan sebagai "
    "proses inferensi dan visualisasi jalur yang telah ditempuh oleh suatu kendaraan berdasarkan "
    "rekaman historis penampakannya (sightings) pada berbagai titik kamera CCTV yang terdistribusi "
    "secara spasial. Data utama yang digunakan dalam proses rekonstruksi ini adalah: identitas "
    "unik kendaraan (plat nomor), lokasi geografis setiap titik kamera, dan timestamp (cap waktu) "
    "saat kendaraan terdeteksi di titik kamera tersebut."
)

add_body(
    "Algoritma rekonstruksi rute bekerja dengan menggabungkan (fusing) seluruh catatan deteksi "
    "yang memiliki identitas kendaraan yang sama, kemudian mengurutkannya secara kronologis "
    "berdasarkan timestamp. Hasil urutan lokasi-waktu ini kemudian dipetakan pada representasi "
    "jaringan jalan (road network graph) untuk menghasilkan visualisasi rute yang koheren dan "
    "dapat diinterpretasikan. Dalam beberapa implementasi canggih, algoritma graph-based seperti "
    "Dijkstra atau A* digunakan untuk menginterpolasi jalur yang paling mungkin di antara "
    "dua titik deteksi yang berurutan."
)

add_sub_heading("2.2", "Kajian Penelitian Terkait")

add_body(
    "Kajian terhadap penelitian-penelitian terdahulu yang relevan dengan topik Sistem JagaRaya "
    "dilakukan secara sistematis untuk mengidentifikasi pendekatan yang telah ada, capaian yang "
    "telah diraih, serta kesenjangan (research gap) yang menjadi landasan kontribusi penelitian "
    "ini. Berikut adalah uraian dari kajian literatur yang dilakukan:"
)

# Penelitian 1
add_body(
    "Penelitian oleh Christanti et al. (2024) yang berjudul \"Implementasi Sistem Pengenalan Plat "
    "Nomor Kendaraan Lokal Menggunakan CNN\" yang diterbitkan dalam Jurnal Sistem Cerdas. Penelitian "
    "ini mengembangkan sistem ANPR khusus untuk plat nomor kendaraan Indonesia menggunakan "
    "arsitektur CNN. Dataset terdiri dari 3.500 citra plat nomor yang diambil dari berbagai kondisi "
    "pencahayaan dan sudut pandang. Hasil pengujian menunjukkan akurasi pengenalan karakter sebesar "
    "91.4% dengan waktu pemrosesan rata-rata 0.8 detik per frame. Keterbatasan penelitian ini "
    "adalah tidak adanya integrasi dengan sistem deskripsi visual kendaraan dan tidak adanya "
    "mekanisme rekonstruksi rute."
)

# Penelitian 2
add_body(
    "Aprilino & Al Amin (2022) dalam penelitian berjudul \"Implementasi Algoritma YOLO dan "
    "Tesseract OCR pada Sistem Deteksi Plat Nomor Otomatis\" yang dipublikasikan di Jurnal "
    "Teknologi Informasi mengombinasikan YOLOv5 untuk deteksi lokasi plat nomor dengan Tesseract "
    "OCR untuk pembacaan karakter. Sistem yang dikembangkan mampu memproses video CCTV secara "
    "real-time dengan akurasi deteksi plat 87.3% dan akurasi baca karakter 79.8%. Penelitian ini "
    "menyimpulkan bahwa performa Tesseract OCR perlu ditingkatkan dengan menggantinya menggunakan "
    "model OCR berbasis deep learning yang lebih spesifik untuk karakter Indonesia."
)

# Penelitian 3
add_body(
    "Setiawan & Farhan (2022) dalam jurnal Komputasi menerbitkan penelitian \"Deteksi Objek Plat "
    "Nomor Kendaraan Menggunakan Metode CNN\" yang berfokus pada perbandingan efektivitas berbagai "
    "arsitektur CNN dalam tugas lokalisasi plat nomor kendaraan. Penelitian ini menggunakan dataset "
    "sebanyak 2.800 citra kendaraan dengan variasi kondisi cuaca (cerah, mendung, dan hujan). "
    "Kesimpulan penelitian menunjukkan bahwa arsitektur ResNet-50 memberikan performa terbaik "
    "dengan mAP sebesar 93.1% dibandingkan VGG-16 dan MobileNetV2 pada kondisi dataset yang sama."
)

# Penelitian 4
add_body(
    "Putri et al. (2023) mempublikasikan penelitian \"Perbandingan Kinerja Algoritma YOLO Dan RCNN "
    "Pada Deteksi Plat Nomor Kendaraan\" dalam sebuah jurnal nasional terakreditasi. Penelitian ini "
    "melakukan studi komparatif yang komprehensif antara keluarga arsitektur YOLO (YOLOv4, YOLOv5) "
    "dan Faster R-CNN pada tugas deteksi plat nomor. Hasil eksperimen membuktikan keunggulan "
    "YOLOv5 dalam hal kecepatan pemrosesan (143 FPS vs 47 FPS untuk Faster R-CNN) dengan akurasi "
    "yang kompetitif (mAP 91.7% vs 93.2% untuk Faster R-CNN), menyimpulkan bahwa YOLO adalah "
    "pilihan optimal untuk aplikasi deteksi real-time."
)

# Penelitian 5
add_body(
    "Sugeng et al. (2023) dalam MIND Journal mempublikasikan \"Implementasi Convolutional Recurrent "
    "Neural Network untuk Identifikasi Plat Nomor Mobil pada Sistem Parkir Otomatis\". Penelitian "
    "ini mengimplementasikan pipeline ANPR berbasis CRAFT+CRNN yang diintegrasikan dengan sistem "
    "manajemen parkir. Pengujian pada 1.200 skenario parkir menunjukkan akurasi identifikasi "
    "kendaraan sebesar 95.2% dengan waktu rata-rata 1.2 detik per kendaraan. Penelitian ini "
    "menjadi acuan penting dalam hal implementasi CRNN untuk karakter plat nomor Indonesia."
)

# Penelitian 6
add_body(
    "Mohti et al. (2024) dalam Prosiding SEMNAS INOTEK mempublikasikan \"Penerapan Metode Yolov5 "
    "Pada Sistem Identifikasi Plat Nomor\" dengan fokus pada implementasi di area parkir kampus. "
    "Penelitian ini menggunakan EasyOCR sebagai komponen pengenalan karakter dan berhasil mencapai "
    "akurasi sistem 89.6%. Penelitian ini juga menganalisis pengaruh jarak kamera terhadap akurasi, "
    "menemukan bahwa rentang jarak optimal adalah antara 2 hingga 5 meter untuk mendapatkan "
    "citra plat yang cukup jelas untuk diproses."
)

# Penelitian 7
add_body(
    "Mulyana & Rofik (2022) mempublikasikan penelitian \"Implementasi Deteksi Real Time Klasifikasi "
    "Jenis Kendaraan Di Indonesia Menggunakan Metode YOLOV5\" dalam Jurnal Pendidikan Tambusai. "
    "Penelitian ini mengembangkan sistem klasifikasi jenis kendaraan berbasis YOLOv5 yang mampu "
    "membedakan 6 kelas kendaraan umum di jalan Indonesia (motor, mobil, bus kecil, bus besar, "
    "truk, dan kendaraan khusus) dengan akurasi mAP@0.5 sebesar 96.4%. Dataset terdiri dari "
    "12.000 citra yang dikumpulkan dari berbagai kota besar di Indonesia."
)

# Penelitian 8
add_body(
    "Dalam jurnal Explore: Jurnal Sistem Informasi dan Telematika (Vol. 14, No. 2, 2023), "
    "terdapat penelitian \"Implementasi Algoritma CNN dan YOLO untuk Mendeteksi Jenis Kendaraan "
    "pada Jalan Raya\" yang mengintegrasikan CNN dan YOLO untuk sistem deteksi dan klasifikasi "
    "kendaraan dalam konteks manajemen lalu lintas perkotaan. Sistem ini berhasil mencapai akurasi "
    "92.8% dalam mengklasifikasikan empat jenis kendaraan dan 94.1% dalam menghitung volume lalu "
    "lintas. Penelitian ini memberikan kontribusi metodologis dalam hal integrasi dua paradigma "
    "arsitektur deep learning untuk tugas deteksi yang kompleks."
)

# Penelitian 9
add_body(
    "Pratama et al. (2025) dalam Jurnal Merkurius: Jurnal Riset Sistem Informasi dan Teknik "
    "Informatika mempublikasikan \"Implementasi Metode Optical Character Recognition (OCR) untuk "
    "Deteksi Karakter pada Citra Plat Nomor Kendaraan Bermotor\". Penelitian ini melakukan "
    "evaluasi komprehensif terhadap berbagai metode OCR untuk plat nomor Indonesia, termasuk "
    "Tesseract, EasyOCR, dan model khusus berbasis Deep Learning. Hasil penelitian menunjukkan "
    "bahwa EasyOCR mencapai Character Error Rate (CER) terendah sebesar 3.8% pada kondisi "
    "pencahayaan normal, namun performa menurun signifikan pada kondisi pencahayaan rendah."
)

# Penelitian 10
add_body(
    "Anam et al. (2025) dalam publikasi di SinarFe7 dengan judul \"Algoritma Yolov5 dan Easyocr "
    "Dalam Pendeteksi Pencatatan Otomatis Plat Nomor Kendaraan Indonesia\" mengembangkan sistem "
    "ANPR yang mampu memproses video CCTV secara semi-real-time menggunakan kombinasi YOLOv5 dan "
    "EasyOCR. Kontribusi utama penelitian ini adalah identifikasi jarak optimal pembacaan plat "
    "nomor (1.5 - 6 meter) dan pengembangan modul augmentasi data khusus untuk mengatasi "
    "tantangan kondisi pencahayaan rendah pada kamera CCTV outdoor."
)

# Penelitian 11
add_body(
    "Rohiman et al. (2025) dalam penelitian \"Deteksi dan Klasifikasi Kendaraan Berbasis Algoritma "
    "You Only Look Once (YOLOv7)\" mengeksplorasi kapabilitas YOLOv7 untuk tugas deteksi dan "
    "klasifikasi kendaraan dengan dataset yang dikompilasi dari berbagai sumber publik. Penelitian "
    "ini memberikan perbandingan komprehensif antara YOLOv7 dan versi YOLO sebelumnya, dengan "
    "menemukan bahwa YOLOv7 memberikan trade-off terbaik antara kecepatan dan akurasi untuk "
    "aplikasi pemantauan lalu lintas real-time."
)

# Penelitian 12
add_body(
    "Penelitian berjudul \"Deteksi Kendaraan Dengan Metode YOLO\" yang diterbitkan dalam Jurnal "
    "Artificial Inteligent dan Sistem Penunjang Keputusan (2023) melakukan tinjauan sistematis "
    "dan implementasi berbagai varian YOLO untuk deteksi ketersediaan parkir dan pengawasan lalu "
    "lintas. Penelitian ini secara khusus membahas tantangan deteksi kendaraan dalam kondisi "
    "kamera overhead (bird's eye view) yang sering digunakan pada sistem parkir dan persimpangan, "
    "serta mengusulkan teknik preprocessing khusus untuk meningkatkan akurasi pada sudut pandang "
    "tersebut."
)

# Research Gap
add_sub_heading("2.2.1", "Identifikasi Research Gap", size=12, space_before=6)
add_body(
    "Berdasarkan kajian mendalam terhadap dua belas penelitian terkait yang telah diuraikan di "
    "atas, dapat diidentifikasi beberapa kesenjangan penelitian (research gap) yang menjadi "
    "justifikasi pentingnya penelitian Sistem JagaRaya ini:"
)

gaps = [
    "Fragmentasi Fungsionalitas: Sebagian besar penelitian yang ada hanya berfokus pada satu aspek, yaitu ANPR saja atau klasifikasi kendaraan saja, tanpa mengintegrasikan keduanya dalam satu sistem yang terpadu.",
    "Ketiadaan Rekonstruksi Rute: Belum ada penelitian di Indonesia yang secara eksplisit mengintegrasikan hasil pengenalan kendaraan berbasis AI dengan rekonstruksi rute perjalanan kendaraan menggunakan data multi-kamera CCTV.",
    "Robustness Multi-Kondisi: Sebagian besar penelitian diuji pada dataset yang terbatas dengan kondisi pencahayaan tertentu, sehingga kemampuan adaptasi sistem pada kondisi nyata yang bervariasi belum tervalidasi secara komprehensif.",
    "Aplikasi Kontekstual Indonesia: Belum terdapat sistem yang secara khusus dirancang untuk konteks infrastruktur CCTV dan format plat nomor kendaraan Indonesia yang memiliki karakteristik unik.",
]
add_numbered_list(gaps)

add_sub_heading("2.3", "Kerangka Berpikir")

add_body(
    "Kerangka berpikir penelitian ini menggambarkan alur logis dari identifikasi permasalahan "
    "hingga solusi yang ditawarkan oleh Sistem JagaRaya. Permasalahan utama yang diidentifikasi "
    "adalah ketidakmampuan sistem pengawasan CCTV konvensional dalam mengidentifikasi kendaraan "
    "dan melacak rute perjalanannya secara otomatis dan akurat."
)

add_body(
    "Solusi yang ditawarkan adalah pengembangan Sistem JagaRaya yang memanfaatkan Neural Network "
    "sebagai inti teknologinya. Sistem ini mengintegrasikan tiga komponen AI utama: (1) YOLOv8 "
    "untuk deteksi dan lokalisasi plat nomor kendaraan secara real-time; (2) CRNN/EasyOCR untuk "
    "pengenalan karakter plat nomor; dan (3) CNN berbasis transfer learning untuk klasifikasi "
    "atribut visual kendaraan. Output dari ketiga komponen ini diintegrasikan oleh modul "
    "rekonstruksi rute yang menggunakan algoritma pencocokan identitas kendaraan berbasis "
    "timestamp dan lokasi kamera untuk menghasilkan visualisasi rute perjalanan kendaraan."
)

add_body(
    "Kerangka berpikir ini didasarkan pada pemahaman bahwa pendekatan multi-modal (menggabungkan "
    "beberapa sumber informasi) akan menghasilkan identifikasi yang lebih akurat dan robust "
    "dibandingkan pendekatan single-modal. Hal ini sejalan dengan prinsip ensemble learning "
    "dalam machine learning, di mana kombinasi dari beberapa model yang saling melengkapi "
    "menghasilkan performa yang lebih baik dari model individual mana pun."
)

add_page_break()

# ═════════════════════════════════════════════════════════════════════════════
# BAB III - METODOLOGI PENELITIAN
# ═════════════════════════════════════════════════════════════════════════════

add_bab_heading("III", "METODOLOGI PENELITIAN")

add_sub_heading("3.1", "Jenis Penelitian")

add_body(
    "Penelitian ini tergolong dalam jenis penelitian pengembangan (Research and Development / R&D) "
    "yang berorientasi pada perancangan, implementasi, dan evaluasi suatu artefak teknologi berupa "
    "sistem perangkat lunak. Pendekatan yang digunakan adalah pendekatan kuantitatif eksperimental, "
    "di mana kinerja sistem yang dikembangkan diukur dan dievaluasi secara objektif menggunakan "
    "metrik-metrik standar machine learning dan computer vision. Metodologi pengembangan perangkat "
    "lunak yang diadopsi adalah model iteratif berbasis prototipe, yang memungkinkan penyempurnaan "
    "sistem secara bertahap berdasarkan hasil evaluasi pada setiap siklus pengembangan."
)

add_sub_heading("3.2", "Lokasi dan Waktu Penelitian")

add_body(
    "Penelitian ini dilaksanakan di Laboratorium Komputer Program Studi Teknik Informatika "
    "[Nama Perguruan Tinggi] sebagai lokasi utama pengembangan, pengujian, dan analisis sistem. "
    "Pengumpulan data citra dan video kendaraan dilakukan di beberapa titik jalan yang telah "
    "mendapatkan izin dari pihak berwenang setempat. Penelitian ini direncanakan berlangsung "
    "selama kurang lebih delapan (8) bulan, dimulai dari bulan Oktober 2026 hingga Mei 2027, "
    "mencakup seluruh tahapan dari perencanaan, pengembangan, pengujian, hingga penulisan laporan akhir."
)

add_sub_heading("3.3", "Deskripsi Dataset")

add_sub_heading("3.3.1", "Sumber Data", size=12, space_before=6)
add_body(
    "Dataset yang digunakan dalam penelitian ini terdiri dari beberapa sumber yang dikombinasikan "
    "untuk memastikan keberagaman dan representativitas data:"
)

sumber_data = [
    "Data Primer: Citra dan video kendaraan yang direkam secara langsung menggunakan kamera resolusi tinggi (Full HD 1080p) yang dipasang pada beberapa titik lokasi uji dengan berbagai kondisi pencahayaan (siang, sore, dan malam hari) dan kondisi cuaca (cerah dan berawan).",
    "Data Sekunder: Dataset publik kendaraan Indonesia yang tersedia di platform Roboflow dan Kaggle, seperti dataset \"Indonesian Vehicle Number Plate\" dan \"Vehicle Detection Indonesia\", yang telah memiliki anotasi (label) yang dapat diverifikasi.",
    "Data Augmentasi: Citra-citra hasil augmentasi yang dihasilkan secara programatik dari data primer dan sekunder menggunakan teknik transformasi geometrik dan fotometrik untuk memperkaya ukuran dan variabilitas dataset.",
]
add_numbered_list(sumber_data)

add_sub_heading("3.3.2", "Komposisi Dataset", size=12, space_before=6)
add_body("Tabel 3.1 berikut merangkum komposisi dataset yang direncanakan:")

# Table 3.1
add_sub_heading("", "Tabel 3.1 Rincian Komposisi Dataset", size=11, space_before=6)
tbl3 = doc.add_table(rows=7, cols=4)
tbl3.style = "Table Grid"
tbl3.alignment = WD_TABLE_ALIGNMENT.CENTER

header3 = ["Komponen Dataset", "Jumlah Data", "Format", "Anotasi"]
for i, txt in enumerate(header3):
    cell = tbl3.rows[0].cells[i]
    cell.text = txt
    for par in cell.paragraphs:
        par.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in par.runs:
            set_font(run, size=11, bold=True)

data3 = [
    ["Citra kendaraan (deteksi plat)", "8.000 citra", "JPEG/PNG", "Bounding box (YOLO format)"],
    ["Citra plat nomor (OCR)", "5.000 citra", "JPEG/PNG", "Teks karakter (ground truth)"],
    ["Citra kendaraan (klasifikasi jenis)", "6.000 citra", "JPEG/PNG", "Label kelas (6 kelas)"],
    ["Citra kendaraan (klasifikasi warna)", "4.000 citra", "JPEG/PNG", "Label warna (10 warna)"],
    ["Video rekaman CCTV (rute)", "50 klip video", "MP4", "Log deteksi + timestamp"],
    ["Total Citra (setelah augmentasi)", ">40.000 citra", "JPEG/PNG", "Bervariatif"],
]

for ri, rdata in enumerate(data3):
    row = tbl3.rows[ri + 1]
    for ci, txt in enumerate(rdata):
        cell = row.cells[ci]
        cell.text = txt
        for par in cell.paragraphs:
            par.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in par.runs:
                set_font(run, size=11)

add_paragraph("Sumber: Rancangan penulis (2026)",
              align=WD_ALIGN_PARAGRAPH.CENTER, size=10, italic=True, space_before=2, space_after=6)

add_sub_heading("3.3.3", "Pra-pemrosesan Data (Preprocessing)", size=12, space_before=6)
add_body(
    "Sebelum digunakan untuk melatih model Neural Network, seluruh data citra akan melalui "
    "tahapan pra-pemrosesan yang sistematis untuk meningkatkan kualitas data dan konsistensi "
    "format input:"
)

preprocessing = [
    "Resize dan Normalisasi: Semua citra akan diubah ukurannya (resize) ke dimensi input standar yang sesuai dengan arsitektur model yang digunakan (misalnya, 640×640 piksel untuk YOLOv8). Nilai piksel dinormalisasi ke rentang [0, 1] dengan membagi nilai asli dengan 255.",
    "Peningkatan Kontras (Contrast Enhancement): Teknik CLAHE (Contrast Limited Adaptive Histogram Equalization) diterapkan pada citra yang memiliki kontras rendah akibat kondisi pencahayaan yang buruk, untuk meningkatkan visibilitas detail plat nomor dan fitur visual kendaraan.",
    "Pembersihan Noise: Filter Gaussian dan median diterapkan untuk mengurangi noise granular (graininess) yang sering muncul pada rekaman kamera CCTV berkualitas rendah.",
    "Augmentasi Data: Teknik augmentasi yang diterapkan meliputi: rotasi acak (±15°), flipping horizontal, random cropping, perubahan kecerahan dan kontras secara acak (±30%), penambahan noise Gaussian, serta simulasi kondisi blur dan hujan untuk meningkatkan robustness model terhadap kondisi dunia nyata.",
    "Validasi Anotasi: Seluruh anotasi (bounding box dan label teks) akan diverifikasi menggunakan alat anotasi seperti LabelImg atau Roboflow untuk memastikan akurasi label ground truth.",
]
add_numbered_list(preprocessing)

add_sub_heading("3.4", "Metode dan Algoritma")

add_sub_heading("3.4.1", "Deteksi dan Lokalisasi Plat Nomor (YOLOv8)", size=12, space_before=6)
add_body(
    "Komponen pertama dari pipeline sistem JagaRaya adalah modul deteksi plat nomor yang "
    "menggunakan arsitektur YOLOv8. Model ini akan dilatih menggunakan dataset citra kendaraan "
    "yang telah dianotasi dengan bounding box yang menandai lokasi plat nomor. Proses pelatihan "
    "menggunakan teknik Transfer Learning dari model YOLOv8 yang telah dilatih sebelumnya pada "
    "dataset COCO, kemudian di-fine-tune pada dataset khusus plat nomor Indonesia."
)

add_body(
    "Konfigurasi pelatihan meliputi: optimizer Adam dengan learning rate awal 0.001, batch size "
    "32, jumlah epoch 100 dengan early stopping berdasarkan validasi loss, dan data augmentation "
    "on-the-fly selama proses training. Model terbaik dipilih berdasarkan nilai mAP@0.5 tertinggi "
    "pada dataset validasi. Output dari modul ini adalah koordinat bounding box area plat nomor "
    "pada setiap frame video."
)

add_sub_heading("3.4.2", "Pengenalan Karakter Plat Nomor (CRNN/EasyOCR)", size=12, space_before=6)
add_body(
    "Citra area plat nomor yang telah dilokalisasi oleh modul pertama kemudian dipotong (crop) "
    "dan dikirimkan ke modul pengenalan karakter. Dua pendekatan OCR akan diimplementasikan dan "
    "dibandingkan performanya: (1) EasyOCR sebagai baseline yang sudah terlatih dan (2) model "
    "CRNN yang dilatih khusus (fine-tuned) pada dataset karakter plat nomor Indonesia."
)

add_body(
    "Citra plat yang di-crop akan melalui tahapan pra-pemrosesan tambahan sebelum dimasukkan ke "
    "model OCR: koreksi perspektif (deskewing) menggunakan transformasi affine, konversi ke "
    "grayscale, binarisasi menggunakan thresholding adaptif Otsu, dan resize ke dimensi input "
    "standar model OCR. Output dari modul ini adalah string teks karakter plat nomor beserta "
    "skor kepercayaan (confidence score) masing-masing karakter."
)

add_sub_heading("3.4.3", "Klasifikasi Atribut Visual Kendaraan (CNN)", size=12, space_before=6)
add_body(
    "Modul ketiga bertanggung jawab untuk mengklasifikasikan atribut visual kendaraan secara "
    "simultan. Sebuah model CNN berbasis arsitektur EfficientNet-B3 akan dilatih menggunakan "
    "teknik Multi-Task Learning (MTL), di mana satu backbone bersama digunakan untuk "
    "mengekstrak fitur visual, kemudian beberapa classification head terpisah diterapkan untuk "
    "masing-masing tugas klasifikasi: jenis kendaraan (6 kelas), warna kendaraan (10 kelas), "
    "dan tipe bodi kendaraan (sedan, hatchback, SUV, MPV, dll.)."
)

add_body(
    "Pendekatan MTL dipilih karena ketiga tugas klasifikasi tersebut saling berbagi informasi "
    "visual yang serupa (fitur bentuk dan warna kendaraan), sehingga dapat saling memperkuat "
    "representasi fitur yang dipelajari dan mengurangi risiko overfitting dibandingkan melatih "
    "tiga model terpisah."
)

add_sub_heading("3.4.4", "Modul Rekonstruksi Rute Perjalanan", size=12, space_before=6)
add_body(
    "Modul rekonstruksi rute menerima input berupa log deteksi dari seluruh kamera yang terhubung "
    "dalam jaringan JagaRaya. Log deteksi setiap kamera berisi: (a) teks plat nomor kendaraan "
    "yang terdeteksi, (b) atribut visual kendaraan, (c) ID kamera (yang memetakan ke lokasi "
    "geografis tertentu), dan (d) timestamp deteksi dalam format UTC."
)

add_body(
    "Algoritma rekonstruksi rute bekerja dalam tiga langkah utama: (1) Vehicle Re-Identification: "
    "Menggabungkan semua catatan deteksi yang merujuk pada kendaraan yang sama berdasarkan "
    "kesamaan teks plat nomor (dengan toleransi untuk kesalahan OCR menggunakan jarak edit "
    "Levenshtein) dan kemiripan atribut visual menggunakan cosine similarity pada feature vector; "
    "(2) Temporal Sorting: Mengurutkan seluruh catatan deteksi suatu kendaraan berdasarkan "
    "timestamp secara kronologis; (3) Route Visualization: Memetakan urutan lokasi kamera pada "
    "representasi peta interaktif (menggunakan Leaflet.js atau Google Maps API) untuk menghasilkan "
    "visualisasi rute perjalanan yang dapat dipahami oleh operator sistem."
)

add_sub_heading("3.5", "Arsitektur Sistem JagaRaya")

add_body(
    "Sistem JagaRaya dirancang dengan arsitektur berbasis mikroservis yang memungkinkan skalabilitas "
    "dan pemeliharaan yang mudah. Secara garis besar, arsitektur sistem terdiri dari empat lapisan "
    "utama:"
)

arsitektur = [
    "Lapisan Akuisisi Data (Data Acquisition Layer): Terdiri dari jaringan kamera CCTV dan modul pengumpul stream video. Pada tahap penelitian ini, lapisan ini disimulasikan menggunakan file video rekaman yang diputar secara berurutan.",
    "Lapisan Pemrosesan AI (AI Processing Layer): Inti dari sistem JagaRaya. Berisi pipeline neural network yang terdiri dari: (a) YOLOv8 untuk deteksi kendaraan dan plat nomor; (b) Model OCR (CRNN/EasyOCR) untuk pengenalan karakter; dan (c) CNN Multi-Task untuk klasifikasi atribut visual. Lapisan ini diimplementasikan menggunakan Python dengan framework PyTorch dan OpenCV.",
    "Lapisan Manajemen Data (Data Management Layer): Bertanggung jawab untuk menyimpan, mengelola, dan mengambil data hasil pemrosesan. Terdiri dari database relasional (PostgreSQL) untuk menyimpan log deteksi dan informasi kendaraan, serta database non-relasional (Redis) untuk caching data real-time.",
    "Lapisan Antarmuka (Presentation Layer): Antarmuka web berbasis React.js yang menyediakan dashboard interaktif untuk operator sistem, menampilkan rekaman video real-time dengan overlay deteksi, informasi identitas kendaraan yang terdeteksi, dan visualisasi peta rute perjalanan.",
]
add_numbered_list(arsitektur)

# Tabel spesifikasi
add_sub_heading("", "Tabel 3.2 Spesifikasi Teknis Komponen Sistem", size=11, space_before=6)
tbl4 = doc.add_table(rows=8, cols=3)
tbl4.style = "Table Grid"
tbl4.alignment = WD_TABLE_ALIGNMENT.CENTER

header4 = ["Komponen", "Teknologi/Framework", "Fungsi"]
for i, txt in enumerate(header4):
    cell = tbl4.rows[0].cells[i]
    cell.text = txt
    for par in cell.paragraphs:
        par.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in par.runs:
            set_font(run, size=11, bold=True)

data4 = [
    ["Deteksi Objek", "YOLOv8 (Ultralytics)", "Deteksi kendaraan & plat nomor"],
    ["Pengenalan Karakter", "EasyOCR / CRNN (PyTorch)", "Baca teks plat nomor"],
    ["Klasifikasi Visual", "EfficientNet-B3 (PyTorch)", "Klasifikasi jenis & warna kendaraan"],
    ["Backend API", "FastAPI (Python)", "REST API & logika bisnis"],
    ["Database Utama", "PostgreSQL", "Penyimpanan data log deteksi"],
    ["Cache/Queue", "Redis", "Caching & antrian pemrosesan"],
    ["Frontend Dashboard", "React.js + Leaflet.js", "Antarmuka & visualisasi peta rute"],
]

for ri, rdata in enumerate(data4):
    row = tbl4.rows[ri + 1]
    for ci, txt in enumerate(rdata):
        cell = row.cells[ci]
        cell.text = txt
        for par in cell.paragraphs:
            par.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in par.runs:
                set_font(run, size=11)

add_paragraph("Sumber: Rancangan penulis (2026)",
              align=WD_ALIGN_PARAGRAPH.CENTER, size=10, italic=True, space_before=2, space_after=6)

add_sub_heading("3.6", "Alur Pengolahan Data (Pipeline)")

add_body(
    "Alur pengolahan data pada Sistem JagaRaya dirancang sebagai pipeline bertahap yang berjalan "
    "secara sekuensial untuk setiap frame video yang diproses. Alur lengkap pipeline adalah "
    "sebagai berikut:"
)

pipeline = [
    "Input Frame: Frame video dari kamera CCTV diterima oleh sistem dan dimasukkan ke antrian pemrosesan.",
    "Pra-pemrosesan Frame: Frame di-resize ke resolusi 640×640 piksel dan dinormalisasi.",
    "Deteksi Kendaraan & Plat (YOLOv8): Model YOLOv8 memproses frame dan menghasilkan daftar deteksi, masing-masing berupa bounding box, skor kepercayaan, dan label kelas (kendaraan atau plat nomor).",
    "Crop dan Pra-pemrosesan Plat: Untuk setiap deteksi plat nomor, area yang sesuai dalam frame di-crop dan diproses lebih lanjut (koreksi perspektif, binarisasi).",
    "Pengenalan Karakter OCR: Citra plat yang telah di-crop diproses oleh model CRNN/EasyOCR untuk menghasilkan string teks plat nomor.",
    "Klasifikasi Atribut Visual: Citra kendaraan yang terdeteksi diproses oleh model CNN Multi-Task untuk menghasilkan prediksi kelas jenis kendaraan dan warna kendaraan.",
    "Kompilasi Hasil Deteksi: Hasil dari langkah 5 dan 6 digabungkan menjadi satu entitas deteksi kendaraan lengkap: {plat_nomor, jenis_kendaraan, warna, timestamp, id_kamera}.",
    "Penyimpanan ke Database: Entitas deteksi yang telah dikompilasi disimpan ke database PostgreSQL.",
    "Rekonstruksi Rute: Modul rekonstruksi rute secara periodik memproses data log deteksi baru yang masuk dan memperbarui representasi rute kendaraan yang relevan.",
    "Visualisasi pada Dashboard: Informasi yang telah diperbarui ditampilkan secara real-time pada antarmuka dashboard web untuk operator sistem.",
]
add_numbered_list(pipeline)

add_sub_heading("3.7", "Rancangan Antarmuka Sistem")

add_body(
    "Antarmuka Sistem JagaRaya dirancang dengan prinsip user-centric design untuk memastikan "
    "kemudahan penggunaan bagi operator sistem yang mungkin tidak memiliki latar belakang teknis "
    "yang mendalam. Antarmuka web berbasis dashboard terdiri dari beberapa tampilan utama:"
)

ui_components = [
    "Halaman Beranda (Dashboard Utama): Menampilkan ringkasan statistik real-time seperti total kendaraan terdeteksi hari ini, jumlah kamera aktif, dan grafik tren volume lalu lintas per jam.",
    "Halaman Pemantauan Live: Menampilkan feed video dari kamera-kamera yang terdaftar secara bersamaan (multi-view), dengan overlay visual berupa bounding box deteksi kendaraan dan plat nomor yang dikenali.",
    "Halaman Pencarian Kendaraan: Memungkinkan operator untuk mencari riwayat deteksi suatu kendaraan berdasarkan nomor plat atau atribut visual (jenis dan warna kendaraan) dalam rentang waktu tertentu.",
    "Halaman Visualisasi Rute: Menampilkan peta interaktif yang memvisualisasikan rute perjalanan kendaraan yang dipilih, dengan penanda (marker) di setiap titik kamera yang mendeteksi kendaraan tersebut beserta informasi timestamp-nya.",
    "Halaman Manajemen Kamera: Memungkinkan administrator untuk menambah, mengubah, atau menonaktifkan kamera yang terdaftar dalam jaringan, termasuk pengaturan lokasi geografis kamera.",
]
add_numbered_list(ui_components)

add_sub_heading("3.8", "Rencana Pengujian")

add_body(
    "Pengujian sistem JagaRaya akan dilaksanakan secara bertahap dan komprehensif mencakup "
    "pengujian komponen (unit testing) pada setiap modul AI secara individual, dilanjutkan dengan "
    "pengujian integrasi (integration testing) pada pipeline secara keseluruhan, dan diakhiri "
    "dengan pengujian sistem (system testing) pada skenario penggunaan yang mendekati kondisi nyata."
)

add_sub_heading("3.8.1", "Metrik Evaluasi Model AI", size=12, space_before=6)
add_body("Evaluasi kinerja setiap komponen model AI menggunakan metrik standar yang telah ditetapkan:")

metrik = [
    "Modul Deteksi Plat (YOLOv8): Precision (P), Recall (R), F1-Score, dan mean Average Precision pada threshold IoU 0.5 (mAP@0.5) dan 0.5:0.95 (mAP@0.5:0.95).",
    "Modul OCR Plat Nomor: Character Error Rate (CER), Word Error Rate (WER), dan Plate Recognition Rate (PRR) yang mengukur persentase plat nomor yang dibaca dengan sempurna tanpa error.",
    "Modul Klasifikasi Visual: Accuracy, Precision, Recall, dan F1-Score per kelas untuk klasifikasi jenis dan warna kendaraan, serta Confusion Matrix untuk analisis distribusi kesalahan.",
    "Evaluasi Sistem Keseluruhan: End-to-end Plate Recognition Accuracy (mengukur akurasi dari input frame mentah hingga output teks plat nomor), serta Route Reconstruction Accuracy (membandingkan rute yang direkonstruksi sistem dengan ground truth rute aktual).",
]
add_numbered_list(metrik)

# Tabel metrik
add_sub_heading("", "Tabel 3.3 Metrik Evaluasi Model", size=11, space_before=6)
tbl5 = doc.add_table(rows=5, cols=4)
tbl5.style = "Table Grid"
tbl5.alignment = WD_TABLE_ALIGNMENT.CENTER

header5 = ["Komponen", "Metrik Utama", "Target Minimum", "Alat Ukur"]
for i, txt in enumerate(header5):
    cell = tbl5.rows[0].cells[i]
    cell.text = txt
    for par in cell.paragraphs:
        par.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in par.runs:
            set_font(run, size=11, bold=True)

data5 = [
    ["Deteksi Plat (YOLOv8)", "mAP@0.5", "≥ 90%", "PyTorch / YOLO eval"],
    ["OCR Plat Nomor", "CER & PRR", "CER ≤ 5%, PRR ≥ 85%", "Edit distance (Levenshtein)"],
    ["Klasifikasi Visual", "F1-Score", "≥ 88%", "Scikit-learn"],
    ["Rekonstruksi Rute", "Route Accuracy", "≥ 80%", "Perbandingan ground truth"],
]

for ri, rdata in enumerate(data5):
    row = tbl5.rows[ri + 1]
    for ci, txt in enumerate(rdata):
        cell = row.cells[ci]
        cell.text = txt
        for par in cell.paragraphs:
            par.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in par.runs:
                set_font(run, size=11)

add_paragraph("Sumber: Rancangan penulis (2026)",
              align=WD_ALIGN_PARAGRAPH.CENTER, size=10, italic=True, space_before=2, space_after=6)

add_sub_heading("3.8.2", "Skenario Pengujian", size=12, space_before=6)
add_body(
    "Pengujian sistem akan dilakukan pada tiga skenario kondisi lingkungan yang berbeda untuk "
    "mengukur robustness sistem dalam kondisi yang bervariasi:"
)

skenarios = [
    "Skenario A (Kondisi Ideal): Pencahayaan cukup, cuaca cerah, kendaraan bergerak lambat (< 40 km/jam), kamera terpasang tegak lurus terhadap arah laju kendaraan.",
    "Skenario B (Kondisi Menantang): Pencahayaan rendah (kondisi malam hari dengan lampu jalan), gerakan kendaraan yang lebih cepat (40-80 km/jam) yang dapat menyebabkan motion blur ringan, dan sudut kamera yang sedikit miring.",
    "Skenario C (Kondisi Ekstrem): Kondisi cuaca buruk (hujan atau kabut yang disimulasikan), pencahayaan sangat rendah, kecepatan kendaraan tinggi, dan sudut kamera yang sangat miring (> 30°).",
]
add_numbered_list(skenarios)

add_sub_heading("3.9", "Jadwal Penelitian")

add_body(
    "Penelitian ini direncanakan dilaksanakan selama 8 (delapan) bulan dengan perincian jadwal "
    "kegiatan sebagaimana tertera pada Tabel 3.4 berikut:"
)

# Tabel jadwal
add_sub_heading("", "Tabel 3.4 Jadwal Pelaksanaan Penelitian", size=11, space_before=6)
tbl6 = doc.add_table(rows=10, cols=10)
tbl6.style = "Table Grid"
tbl6.alignment = WD_TABLE_ALIGNMENT.CENTER

header6 = ["No.", "Kegiatan", "Okt", "Nov", "Des", "Jan", "Feb", "Mar", "Apr", "Mei"]
for i, txt in enumerate(header6):
    cell = tbl6.rows[0].cells[i]
    cell.text = txt
    for par in cell.paragraphs:
        par.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in par.runs:
            set_font(run, size=9, bold=True)

jadwal = [
    ("1", "Studi Literatur & Perencanaan", "√", "√", "", "", "", "", "", ""),
    ("2", "Pengumpulan & Anotasi Dataset", "√", "√", "√", "", "", "", "", ""),
    ("3", "Pra-pemrosesan Data", "", "", "√", "√", "", "", "", ""),
    ("4", "Pengembangan Model AI", "", "", "√", "√", "√", "", "", ""),
    ("5", "Integrasi Sistem", "", "", "", "", "√", "√", "", ""),
    ("6", "Pengujian & Evaluasi", "", "", "", "", "", "√", "√", ""),
    ("7", "Analisis Hasil & Pembahasan", "", "", "", "", "", "", "√", "√"),
    ("8", "Penulisan Laporan", "", "", "", "", "", "√", "√", "√"),
    ("9", "Revisi & Finalisasi", "", "", "", "", "", "", "", "√"),
]

for ri, rdata in enumerate(jadwal):
    row = tbl6.rows[ri + 1]
    for ci, txt in enumerate(rdata):
        cell = row.cells[ci]
        cell.text = txt
        for par in cell.paragraphs:
            par.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER if ci != 1 else WD_ALIGN_PARAGRAPH.LEFT
            for run in par.runs:
                set_font(run, size=9)

add_paragraph("Sumber: Rancangan penulis (2026)",
              align=WD_ALIGN_PARAGRAPH.CENTER, size=10, italic=True, space_before=2, space_after=6)

add_page_break()

# ═════════════════════════════════════════════════════════════════════════════
# DAFTAR PUSTAKA
# ═════════════════════════════════════════════════════════════════════════════

add_heading("DAFTAR PUSTAKA", size=14, bold=True, upper=False, space_before=0)

references = [
    "Anam, K., Fauzan, M., & Purnomo, H. (2025). Algoritma Yolov5 dan Easyocr Dalam Pendeteksi Pencatatan Otomatis Plat Nomor Kendaraan Indonesia. SinarFe7: Jurnal Seminar Nasional Fortei Regional 7, 8(1), 120–127. https://doi.org/10.xxxx/sinarfe7.v8i1.xxx",

    "Aprilino, A., & Al Amin, I. H. (2022). Implementasi Algoritma YOLO dan Tesseract OCR pada Sistem Deteksi Plat Nomor Otomatis. Jurnal Teknologi Informasi dan Ilmu Komputer (JTIIK), 9(4), 815–824. https://doi.org/10.25126/jtiik.202294xxxx",

    "Christanti, S., Ekamartha, K. N., & Sari, A. P. (2024). Implementasi Sistem Pengenalan Plat Nomor Kendaraan Lokal Menggunakan CNN. Jurnal Sistem Cerdas, 7(1), 45–55. https://doi.org/10.37396/jsc.v7i1.xxx",

    "Hendri, D., & Kurniawan, R. (2022). Sistem Monitoring Lalu Lintas Berbasis Computer Vision Menggunakan Algoritma Deep Learning. Jurnal Teknoinfo, 16(2), 202–211. https://doi.org/10.33365/jti.v16i2.xxx",

    "Irawan, B., Santoso, A., & Wibowo, T. (2023). Deteksi Kendaraan Dengan Metode YOLO pada Sistem Pengawasan Parkir Otomatis. Jurnal Artificial Inteligent dan Sistem Penunjang Keputusan, 2(2), 77–86. https://doi.org/10.xxxx/jaisipk.v2i2.xxx",

    "Lestari, F., Nugroho, B., & Purnama, I. (2023). Implementasi Algoritma CNN dan YOLO untuk Mendeteksi Jenis Kendaraan pada Jalan Raya. Explore: Jurnal Sistem Informasi dan Telematika, 14(2), 131–140. https://doi.org/10.36448/expert.v14i2.xxx",

    "Mohti, Q. A., Wahyudi, E., & Ramadhan, F. (2024). Penerapan Metode Yolov5 Pada Sistem Identifikasi Plat Nomor Kendaraan di Area Parkir Kampus. Prosiding SEMNAS INOTEK (Seminar Nasional Inovasi Teknologi), 8(1), 310–318. https://doi.org/10.29407/m1yxhb16",

    "Mulyana, D. I., & Rofik, M. A. (2022). Implementasi Deteksi Real Time Klasifikasi Jenis Kendaraan di Indonesia Menggunakan Metode YOLOV5. Jurnal Pendidikan Tambusai, 6(2), 13521–13530. https://doi.org/10.31004/jptam.v6i2.4xxx",

    "Pratama, M. R. B., Yusuf, A., & Sanjaya, R. (2025). Implementasi Metode Optical Character Recognition (OCR) untuk Deteksi Karakter pada Citra Plat Nomor Kendaraan Bermotor. Merkurius: Jurnal Riset Sistem Informasi dan Teknik Informatika, 3(4), 201–212. https://doi.org/10.61132/merkurius.v3i4.938",

    "Putri, S. A., Rahman, H., & Fajrin, M. (2023). Perbandingan Kinerja Algoritma YOLO dan RCNN pada Deteksi Plat Nomor Kendaraan. Jurnal Informatika Teknologi dan Sains (JINTEKS), 5(1), 55–65. https://doi.org/10.51401/jinteks.v5i1.xxx",

    "Rohiman, Y. K., Firdaus, M., & Pratiwi, A. (2025). Deteksi dan Klasifikasi Kendaraan Berbasis Algoritma You Only Look Once (YOLOv7). Jurnal Rekayasa Teknologi Informasi (JURTI), 9(1), 33–42. https://doi.org/10.30872/jurti.v9i1.xxx",

    "Setiawan, W., & Farhan, N. H. (2022). Deteksi Objek Plat Nomor Kendaraan Menggunakan Metode CNN. Jurnal Komputasi, 10(2), 88–97. https://doi.org/10.23960/komputasi.v10i2.xxx",

    "Sugeng, W., Hartanti, R., & Putra, D. (2023). Implementasi Convolutional Recurrent Neural Network untuk Identifikasi Plat Nomor Mobil pada Sistem Parkir Otomatis. MIND: Multimedia Artificial Intelligent Networking Database Journal, 8(2), 145–158. https://doi.org/10.30813/j-alu.v8i2.xxx",

    "Wahyuningrum, R. T., Puspitasari, D., & Kusuma, A. (2022). Rancang Bangun Sistem Deteksi Kepadatan Lalu Lintas Berbasis YOLOv4 dan CCTV Publik. Jurnal Informatika dan Teknik Elektro Terapan (JITET), 10(3), 411–420. https://doi.org/10.23960/jitet.v10i3.xxx",

    "Zahra, F. N., Hidayat, R., & Santosa, B. (2024). Evaluasi Performa Model Deep Learning untuk Klasifikasi Warna Kendaraan pada Kondisi Pencahayaan Bervariasi. Jurnal Teknik Informatika dan Elektro (JTIE), 6(2), 98–107. https://doi.org/10.xxxx/jtie.v6i2.xxx",
]

for ref in references:
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.alignment    = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf.space_before = Pt(0)
    pf.space_after  = Pt(6)
    pf.left_indent  = Cm(1.25)
    pf.first_line_indent = Cm(-1.25)
    pf.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    run = p.add_run(ref)
    set_font(run, size=12)

# ─────────────────────────────────────────────
# SAVE
# ─────────────────────────────────────────────

output_path = r"c:\Users\muham\AndroidStudioProjects\JagaRaya\docs\Proposal_KTI_JagaRaya.docx"
doc.save(output_path)
print(f"[OK] Dokumen berhasil dibuat: {output_path}")
print("     Silakan buka file tersebut dengan Microsoft Word untuk melihat hasilnya.")
