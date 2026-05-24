#!/usr/bin/env python3
"""Generate places.json for client-side place name autocomplete.

Reads school JSON files (for lat/lon) and england_school_information.csv
(for TOWN and LANAME borough names), then outputs a sorted array of
{name, lat, lon} entries to frontend/public/data/places.json.
"""

import json
import csv
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).parent.parent

def is_valid_place_name(name):
    """Reject entries that are clearly not place names."""
    name = name.strip()
    if not name or len(name) < 3:
        return False
    if re.match(r'^\d+$', name):
        return False
    return True

def normalise(name):
    """Normalise to title case, strip extra whitespace."""
    return ' '.join(w.capitalize() for w in name.strip().split())

def main():
    # Build URN -> (lat, lon) from school JSON files
    urn_coords = {}
    for filename in ['schools.json', 'secondary.json']:
        path = ROOT / 'frontend' / 'public' / 'data' / filename
        with open(path) as f:
            schools = json.load(f)
        for s in schools:
            urn = str(s['urn'])
            if s.get('latitude') and s.get('longitude'):
                urn_coords[urn] = (s['latitude'], s['longitude'])

    print(f"Loaded coordinates for {len(urn_coords)} schools")

    # Accumulate coords per normalised place name
    # towns take priority over LAs — process towns first, then LAs
    town_coords = defaultdict(list)
    la_coords = defaultdict(list)

    csv_path = ROOT / 'data_2024-2025' / 'england_school_information.csv'
    with open(csv_path, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            urn = row['URN']
            coords = urn_coords.get(urn)
            if not coords:
                continue

            town = row.get('TOWN', '').strip()
            if town and is_valid_place_name(town):
                town_coords[normalise(town)].append(coords)

            laname = row.get('LANAME', '').strip()
            if laname and is_valid_place_name(laname):
                la_coords[normalise(laname)].append(coords)

    # Build places dict: name_lower -> entry (towns win over LAs)
    places = {}

    def add_place(name, coords_list):
        key = name.lower()
        if key in places or not coords_list:
            return
        avg_lat = sum(c[0] for c in coords_list) / len(coords_list)
        avg_lon = sum(c[1] for c in coords_list) / len(coords_list)
        places[key] = {
            'name': name,
            'lat': round(avg_lat, 5),
            'lon': round(avg_lon, 5),
        }

    for name, coords in town_coords.items():
        add_place(name, coords)

    for name, coords in la_coords.items():
        add_place(name, coords)

    result = sorted(places.values(), key=lambda x: x['name'].lower())

    out_path = ROOT / 'frontend' / 'public' / 'data' / 'places.json'
    with open(out_path, 'w') as f:
        json.dump(result, f, separators=(',', ':'))

    print(f"Generated {len(result)} places → {out_path}")
    size_kb = out_path.stat().st_size / 1024
    print(f"File size: {size_kb:.1f} KB")

if __name__ == '__main__':
    main()
