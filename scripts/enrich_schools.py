"""
Enrich schools_with_performance.json with:
  - fsm_pct          : % pupils eligible for free school meals
  - ethnicity        : top-3 ethnic groups by %
  - feeder_secondary : nearest secondary school (name + URN + distance)
"""

import csv, json
from pathlib import Path
from collections import defaultdict

ROOT       = Path(__file__).parent.parent
DATA       = ROOT / "data_2024-2025"
PROCESSED  = ROOT / "data_processed"

JSON_IN    = PROCESSED / "schools_with_performance.json"
JSON_OUT   = PROCESSED / "schools_with_performance.json"

CENSUS_FILE  = DATA / "england_census.csv"
ETHNICITY_FILE = DATA / "england_ethnicity.csv"
FEEDER_FILE  = DATA / "england_feeder_schools.csv"

ETH_LABEL = {
    "ETH_WHITE_BRIT_PCT":       "White British",
    "ETH_WHITE_IRISH_PCT":      "White Irish",
    "ETH_TRAVELLER_PCT":        "Traveller",
    "ETH_GYPSY_ROMA_PCT":       "Gypsy/Roma",
    "ETH_WHITE_OTHER_PCT":      "Other White",
    "ETH_MIXED_WHITE_CARIB_PCT":"Mixed W/Caribbean",
    "ETH_MIXED_WHITE_AFR_PCT":  "Mixed W/African",
    "ETH_MIXED_WHITE_ASIAN_PCT":"Mixed W/Asian",
    "ETH_MIXED_OTHER_PCT":      "Mixed Other",
    "ETH_ASIAN_INDIAN_PCT":     "Indian",
    "ETH_ASIAN_PAKISTANI_PCT":  "Pakistani",
    "ETH_ASIAN_BANGLADESHI_PCT":"Bangladeshi",
    "ETH_ASIAN_OTHER_PCT":      "Other Asian",
    "ETH_BLACK_CARIB_PCT":      "Black Caribbean",
    "ETH_BLACK_AFR_PCT":        "Black African",
    "ETH_BLACK_OTHER_PCT":      "Other Black",
    "ETH_CHINESE_PCT":          "Chinese",
    "ETH_OTHER_PCT":            "Other",
}

# --- Load FSM data (URN -> fsm_pct) ---
print("Loading FSM data...")
fsm = {}
with open(CENSUS_FILE, encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        urn = row.get("URN", "").strip()
        val = row.get("PNUMFSMEVER", "").strip()
        if urn and val and val not in ("SUPP", "NA", ""):
            try:
                fsm[urn] = round(float(val.rstrip("%")), 1)
            except ValueError:
                pass
print(f"  FSM entries: {len(fsm)}")

# --- Load ethnicity data (URN -> top-3 groups) ---
print("Loading ethnicity data...")
ethnicity = {}
with open(ETHNICITY_FILE, encoding="utf-8") as f:
    for row in csv.DictReader(f):
        urn = row["URN"].strip()
        groups = []
        for col, label in ETH_LABEL.items():
            val = row.get(col, "").strip()
            if val and val not in ("SUPP", "NA", "x", ""):
                try:
                    pct = float(val)
                    if pct > 0:
                        groups.append({"group": label, "pct": round(pct, 1)})
                except ValueError:
                    pass
        groups.sort(key=lambda x: -x["pct"])
        if groups:
            ethnicity[urn] = groups  # store all non-zero groups
print(f"  Ethnicity entries: {len(ethnicity)}")

# --- Load feeder data: build primary_urn -> nearest secondary ---
print("Loading feeder school data...")
# feeder_schools.csv: SECONDARY_URN, SECONDARY_NAME, FEEDER_URN, FEEDER_NAME, DISTANCE_KM, RANK
# We want: for each primary (FEEDER_URN), find the secondary with lowest DISTANCE_KM
primary_to_secondary = defaultdict(list)
with open(FEEDER_FILE, encoding="utf-8") as f:
    for row in csv.DictReader(f):
        primary_urn = row["FEEDER_URN"].strip()
        primary_to_secondary[primary_urn].append({
            "urn":      int(row["SECONDARY_URN"]),
            "name":     row["SECONDARY_NAME"],
            "dist_km":  float(row["DISTANCE_KM"]),
        })

# Keep only the nearest secondary for each primary
feeder_secondary = {}
for p_urn, secs in primary_to_secondary.items():
    secs.sort(key=lambda x: x["dist_km"])
    feeder_secondary[p_urn] = secs[0]   # nearest secondary
print(f"  Primary→secondary mappings: {len(feeder_secondary)}")

# --- Enrich JSON ---
print("Enriching schools JSON...")
with open(JSON_IN) as f:
    schools = json.load(f)

matched_fsm = matched_eth = matched_feed = 0
for s in schools:
    urn = str(s["urn"])

    # FSM
    if urn in fsm:
        s["fsm_pct"] = fsm[urn]
        matched_fsm += 1
    else:
        s["fsm_pct"] = None

    # Ethnicity top-3
    if urn in ethnicity:
        s["ethnicity"] = ethnicity[urn]
        matched_eth += 1
    else:
        s["ethnicity"] = []

    # Nearest secondary (feeder)
    if urn in feeder_secondary:
        s["feeder_secondary"] = feeder_secondary[urn]
        matched_feed += 1
    else:
        s["feeder_secondary"] = None

print(f"  FSM matched:              {matched_fsm}/{len(schools)}")
print(f"  Ethnicity matched:        {matched_eth}/{len(schools)}")
print(f"  Feeder secondary matched: {matched_feed}/{len(schools)}")

with open(JSON_OUT, "w") as f:
    json.dump(schools, f)

print(f"\nSaved enriched JSON to {JSON_OUT}")
print("Sample record:")
sample = next(s for s in schools if s.get("feeder_secondary"))
print(json.dumps({k: sample[k] for k in ["urn","name","fsm_pct","ethnicity","feeder_secondary"]}, indent=2))
