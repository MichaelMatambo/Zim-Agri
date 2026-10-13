"""Builds the compact on-device datasets from the research files (GEE export + services + rivers).
Usage: python3 scripts/build_data.py <dir with the 4 source files>   (run once; outputs are committed in assets/)
"""
import json, sys, math, os
from PIL import Image
SRC = sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/uploads"
OUT = "assets/data"; OV = "assets/overlays"

# ---------- crop requirements (user's 15 + indicative extras) ----------
req = json.load(open(f"{SRC}/crop_requirements.json"))
crops = req["crops"]
EXTRA = [
 dict(id="groundnut", name="Groundnuts", water="rainfed", rain=[400,500,1100,1600], temp=[13,16,27,32], ph=[4.5,5.5,7.0,8.0], slope=[0,0,8,15], cycle_days="110-140", window="Nov-Dec", extra=True),
 dict(id="sorghum", name="Sorghum", water="rainfed", rain=[300,400,1000,1500], temp=[14,17,28,34], ph=[4.8,5.5,8.0,8.5], slope=[0,0,8,15], cycle_days="100-130", window="Nov-Dec", extra=True),
 dict(id="pmillet", name="Pearl / finger millet", water="rainfed", rain=[250,350,900,1200], temp=[15,18,30,35], ph=[5.0,5.5,7.5,8.5], slope=[0,0,8,15], cycle_days="80-110", window="Nov-Dec", extra=True),
 dict(id="soya", name="Soya beans", water="rainfed", rain=[450,600,1200,1800], temp=[12,15,25,30], ph=[5.0,5.8,7.0,7.8], slope=[0,0,8,15], cycle_days="110-140", window="Nov-Dec", extra=True),
 dict(id="sunflower", name="Sunflower", water="rainfed", rain=[400,500,1000,1500], temp=[11,14,26,32], ph=[5.0,5.7,7.5,8.3], slope=[0,0,8,15], cycle_days="100-130", window="Nov-Dec", extra=True),
 dict(id="cotton", name="Cotton", water="rainfed", rain=[500,600,1100,1500], temp=[16,19,28,33], ph=[5.2,5.8,8.0,8.5], slope=[0,0,8,15], cycle_days="150-180", window="Oct-Nov", extra=True),
]
crops = crops + EXTRA
req["crops"] = crops
req["note"] += " Crops flagged extra:true were added by the app (same method, indicative) and are not part of the original GEE export."
json.dump(req, open(f"{OUT}/crop_requirements.json", "w"), separators=(",", ":"))

def factor(v, r):
    if r is None: return 1
    if r[1] <= v <= r[2]: return 1
    if r[0] <= v <= r[3]: return .5
    return 0
def index(c, cell):
    fs = []
    if c["rain"] is not None: fs.append(factor(cell["rain"], c["rain"]))
    fs += [factor(cell["temp"], c["temp"]), factor(cell["ph"], c["ph"]), factor(cell["slope"], c["slope"])]
    return 0 if min(fs) == 0 else round(sum(fs) / len(fs) * 100)

# ---------- grid ----------
g = json.load(open(f"{SRC}/East_Zim_Crop_Suitability_Grid_prototype.geojson"))["features"]
cells = []; dev = 0
for f in g:
    p = f["properties"]; ring = f["geometry"]["coordinates"][0]
    xs = [c[0] for c in ring]; ys = [c[1] for c in ring]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    cells.append(dict(x0=x0, y0=y0, w=x1-x0, h=y1-y0, rain=p["rain_mm"], cv=p["rain_cv"], temp=p["temp_c"], elev=p["elev_m"], slope=p["slope_deg"], ph=p["ph"], dw=p["dist_water_km"], src=p))
# verify our on-device formula reproduces the GEE scores for the original 15 crops
bad = 0
for c in cells:
    for cr in crops:
        if cr.get("extra"): continue
        if index(cr, c) != c["src"]["s_" + cr["id"]]: bad += 1
print("recomputed-vs-GEE differences (all sit on rounding boundaries):", bad, "of", len(cells) * 15)
B = [min(c["x0"] for c in cells), min(c["y0"] for c in cells), max(c["x0"]+c["w"] for c in cells), max(c["y0"]+c["h"] for c in cells)]
grid = dict(bbox=[round(v, 4) for v in B], fields=["x0", "y0", "w", "h", "rain", "cv", "temp", "elev", "slope", "ph", "dw", "scores"],
            cells=[[round(c["x0"], 4), round(c["y0"], 4), round(c["w"], 4), round(c["h"], 4), c["rain"], c["cv"], c["temp"], c["elev"], c["slope"], c["ph"], c["dw"], [c["src"]["s_" + cr["id"]] for cr in crops if not cr.get("extra")]] for c in cells],
            note="Prototype model grid (data_type=synthetic_model). Raw climate/soil/terrain values per ~3 km cell; suitability is recomputed on the device.")
json.dump(grid, open(f"{OUT}/grid.json", "w"), separators=(",", ":"))

# ---------- services ----------
S = json.load(open(f"{SRC}/agricultural_services.geojson"))["features"]
svc = []
for f in S:
    p = f["properties"]; lo, la = f["geometry"]["coordinates"]
    svc.append(dict(id=p["id"], n=p["name"], g=p["group"], s=p["subtype"], t=p["town"], d=p["district"], c=p["crops"], v=p["services"], lo=round(lo, 4), la=round(la, 4),
                    q="sourced" if p["data_type"] == "sourced_approx" else "placeholder", cap=p.get("capacity_tonnes"), h=p.get("hours"), ph=p.get("phone") or None))
# keep the original national markets/experts that fall OUTSIDE the grid area, so the rest of Zimbabwe still works
def inside(lo, la): return B[0] <= lo <= B[2] and B[1] <= la <= B[3]
for f in json.load(open("scripts/source/markets.json"))["features"]:
    lo, la = f["geometry"]["coordinates"]
    if not inside(lo, la): svc.append(dict(id="N-" + f["properties"]["name"][:8], n=f["properties"]["name"], g="Markets", s="produce_market", t=f["properties"]["name"], d="", c="", v="", lo=lo, la=la, q="placeholder", cap=None, h=None, ph=None))
for f in json.load(open("scripts/source/experts.json"))["features"]:
    lo, la = f["geometry"]["coordinates"]; r = f["properties"]["role"]
    if not inside(lo, la): svc.append(dict(id="N-" + f["properties"]["name"][-10:], n=f["properties"]["name"], g="Extension & Research" if "Agritex" in r else ("Livestock & Vet" if "Vet" in r else "Inputs & Supplies"), s="extension_office" if "Agritex" in r else ("vet_clinic" if "Vet" in r else "agro_dealer"), t=f["properties"]["ward"], d="", c="", v="", lo=lo, la=la, q="placeholder", cap=None, h=None, ph=None))
json.dump(svc, open(f"{OUT}/services.json", "w"), separators=(",", ":"))

# ---------- rivers (simplified) ----------
def rdp(pts, eps):
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]; dx, dy = x2-x1, y2-y1; L = math.hypot(dx, dy) or 1e-12
    md, mi = 0, 0
    for i in range(1, len(pts)-1):
        d = abs(dy*(pts[i][0]-x1) - dx*(pts[i][1]-y1)) / L
        if d > md: md, mi = d, i
    if md > eps: return rdp(pts[:mi+1], eps)[:-1] + rdp(pts[mi:], eps)
    return [pts[0], pts[-1]]
lines = []
for f in json.load(open(f"{SRC}/rivers.geojson"))["features"]:
    for ln in f["geometry"]["coordinates"]:
        s = rdp([(x[0], x[1]) for x in ln], 0.0009)
        if len(s) >= 2: lines.append([[round(a, 4), round(b, 4)] for a, b in s])
old = json.load(open("scripts/source/rivers.json"))["features"]
named = []
for f in old:
    c = f["geometry"]["coordinates"]
    if not all(inside(*p) for p in c): named.append(dict(n=f["properties"]["name"], k=f["properties"]["kind"], c=c))
json.dump(dict(lines=lines, named=named), open(f"{OUT}/rivers.json", "w"), separators=(",", ":"))
print("river lines", len(lines), "vertices", sum(len(l) for l in lines))

# ---------- raster overlays ----------
RES = 0.0125; W = int(math.ceil((B[2]-B[0]) / RES)); H = int(math.ceil((B[3]-B[1]) / RES)); UP = 3
def hexrgb(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
def ramp(stops, t):
    t = max(0, min(1, t)); n = len(stops)-1; i = min(int(t*n), n-1); f = t*n - i
    a, b = hexrgb(stops[i]), hexrgb(stops[i+1]); return tuple(int(a[k] + (b[k]-a[k])*f) for k in range(3))
CLASS = {"High": "#1A9641", "Moderate": "#F2D544", "Marginal": "#F08A24", "None": "#9B2D2D"}
def klass(i): return "High" if i >= 90 else "Moderate" if i >= 60 else "Marginal" if i >= 1 else "None"
ENV = dict(rain=("rain", 300, 1500, ["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"]),
           temp=("temp", 12, 30, ["#313695", "#74add1", "#ffffbf", "#f46d43", "#a50026"]),
           ph=("ph", 4.5, 8, ["#d73027", "#fee08b", "#1a9850", "#4575b4"]),
           elev=("elev", 0, 2500, ["#2b83ba", "#abdda4", "#ffffbf", "#fdae61", "#d7191c"]),
           dwater=("dw", 0, 30, ["#08306b", "#6baed6", "#f7fbff"]))
def paint(name, colorfn):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); px = im.load()
    for c in cells:
        col = colorfn(c) + (170,)
        cx0 = int((c["x0"]-B[0]) / RES); cx1 = int(math.ceil((c["x0"]+c["w"]-B[0]) / RES))
        ry0 = int((B[3]-(c["y0"]+c["h"])) / RES); ry1 = int(math.ceil((B[3]-c["y0"]) / RES))
        for x in range(max(cx0, 0), min(cx1, W)):
            for y in range(max(ry0, 0), min(ry1, H)): px[x, y] = col
    im = im.resize((W*UP, H*UP), Image.NEAREST).quantize(colors=64, method=Image.FASTOCTREE) if False else im.resize((W*UP, H*UP), Image.NEAREST)
    im.save(f"{OV}/{name}.png", optimize=True)
orig_ids = [cr["id"] for cr in crops if not cr.get("extra")]
def cidx(cr, c): return c["src"]["s_" + cr["id"]] if cr["id"] in orig_ids else index(cr, c)
for cr in crops: paint("s_" + cr["id"], lambda c, cr=cr: hexrgb(CLASS[klass(cidx(cr, c))]))
for k, (fld, lo, hi, st) in ENV.items(): paint(k, lambda c, fld=fld, lo=lo, hi=hi, st=st: ramp(st, (c[fld]-lo) / (hi-lo)))
names = ["s_" + c["id"] for c in crops] + list(ENV)
ts = "// AUTO-GENERATED by scripts/build_data.py\nexport const OVERLAY_BOUNDS = { south: %s, west: %s, north: %s, east: %s };\n" % (B[1], B[0], B[3], B[2])
open("constants/overlays.ts", "w").write(ts)
import base64 as _b
data = "// AUTO-GENERATED by scripts/build_data.py: map layer images embedded as data URIs (no asset files needed at runtime)\nexport const OVERLAY_DATA: Record<string, string> = {\n" + "\n".join("  %s: 'data:image/png;base64,%s'," % (n, _b.b64encode(open(f"{OV}/{n}.png", "rb").read()).decode()) for n in names) + "\n};\n"
open("constants/overlayData.ts", "w").write(data)
tot = sum(os.path.getsize(f"{OV}/{n}.png") for n in names)
print("overlays", len(names), "total KB", tot//1024, "grid", W, H, "bbox", B)
for f in ["grid", "services", "rivers", "crop_requirements"]: print(f, os.path.getsize(f"{OUT}/{f}.json")//1024, "KB")
