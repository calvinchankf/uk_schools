import csv, math

COORDS_FILE  = "/Users/kinfungchan/Desktop/kid/uk_schools/data_2024-2025/england_school_coords.csv"
FEEDER_FILE  = "/Users/kinfungchan/Desktop/kid/uk_schools/data_2024-2025/england_feeder_schools.csv"

FEEDER_RADIUS_KM = 3.0
MAX_FEEDERS = 10

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

primaries   = []
secondaries = []

with open(COORDS_FILE, encoding="utf-8") as f:
    for row in csv.DictReader(f):
        if not row["LAT"]:
            continue
        s = {"URN": row["URN"], "NAME": row["SCHNAME"], "LAT": float(row["LAT"]), "LON": float(row["LON"])}
        # Exclude all-through schools from the primary list to avoid self-references
        if row["ISPRIMARY"] == "1" and row["ISSECONDARY"] == "0":
            primaries.append(s)
        if row["ISSECONDARY"] == "1":
            secondaries.append(s)

print(f"Pure primary schools (excl. all-through): {len(primaries)}")
print(f"Secondary schools:                        {len(secondaries)}")

rows_written = 0
with open(FEEDER_FILE, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["SECONDARY_URN","SECONDARY_NAME","FEEDER_URN","FEEDER_NAME","DISTANCE_KM","RANK"])
    for sec in secondaries:
        nearby = []
        for pri in primaries:
            if pri["URN"] == sec["URN"]:
                continue
            d = haversine(sec["LAT"], sec["LON"], pri["LAT"], pri["LON"])
            if d <= FEEDER_RADIUS_KM:
                nearby.append((d, pri))
        nearby.sort(key=lambda x: x[0])
        for rank, (dist, pri) in enumerate(nearby[:MAX_FEEDERS], start=1):
            w.writerow([sec["URN"], sec["NAME"], pri["URN"], pri["NAME"], round(dist, 3), rank])
            rows_written += 1

print(f"Feeder rows written: {rows_written}")
print(f"Avg feeders/secondary: {rows_written/len(secondaries):.1f}")

with open(FEEDER_FILE, encoding="utf-8") as f:
    rows = list(csv.DictReader(f))
print("\nSample rows:")
for r in rows[:6]:
    print(f"  [{r['RANK']}] {r['SECONDARY_NAME'][:35]:<35} <- {r['FEEDER_NAME'][:35]:<35} {r['DISTANCE_KM']} km")
