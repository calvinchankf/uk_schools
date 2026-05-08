"""
Geocode secondary school postcodes and add them to the existing
postcode_coordinates.json cache (which was built for primary schools).
"""

import pandas as pd
import requests
import json
import time
from pathlib import Path


def batch_geocode_postcodes(postcodes, batch_size=100):
    results = {}
    total_batches = (len(postcodes) - 1) // batch_size + 1

    for i in range(0, len(postcodes), batch_size):
        batch = postcodes[i:i + batch_size]
        batch_num = i // batch_size + 1
        print(f"  Batch {batch_num}/{total_batches} ({len(batch)} postcodes)...")

        try:
            response = requests.post(
                'https://api.postcodes.io/postcodes',
                json={'postcodes': batch},
                timeout=30
            )
            if response.status_code == 200:
                for item in response.json().get('result', []):
                    if item['result'] and item['query']:
                        results[item['query']] = {
                            'latitude': item['result']['latitude'],
                            'longitude': item['result']['longitude'],
                            'source': 'postcodes.io',
                        }
                    elif item['query']:
                        results[item['query']] = None
            time.sleep(0.5)
        except Exception as e:
            print(f"  Error: {e}")
            for pc in batch:
                if pc not in results:
                    results[pc] = None

    return results


def main():
    print("=" * 60)
    print("Geocoding Secondary School Postcodes")
    print("=" * 60)

    coords_path = Path('../data_processed/postcode_coordinates.json')
    with open(coords_path) as f:
        existing = json.load(f)
    print(f"\nExisting cached postcodes: {len(existing)}")

    schools_df = pd.read_csv(
        '../data_2024-2025/england_school_information.csv',
        encoding='utf-8-sig',
    )
    sec = schools_df[schools_df['ISSECONDARY'] == 1]
    all_postcodes = set(sec['POSTCODE'].dropna().unique())
    new_postcodes = sorted(all_postcodes - set(existing.keys()))
    print(f"Secondary school postcodes total: {len(all_postcodes)}")
    print(f"New postcodes to geocode: {len(new_postcodes)}")

    if not new_postcodes:
        print("Nothing to do — all postcodes already cached.")
        return

    print("\nGeocoding...")
    new_results = batch_geocode_postcodes(new_postcodes)

    successful = sum(1 for v in new_results.values() if v is not None)
    print(f"\nGeocoded: {successful}/{len(new_postcodes)} ({successful/len(new_postcodes)*100:.1f}%)")

    existing.update(new_results)
    with open(coords_path, 'w') as f:
        json.dump(existing, f, indent=2)

    print(f"Cache updated: {coords_path}  (total {len(existing)} postcodes)")
    print("=" * 60)


if __name__ == '__main__':
    main()
