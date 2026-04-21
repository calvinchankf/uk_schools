"""
Geocode UK school postcodes to latitude/longitude coordinates.
Uses postcodes.io API (free, UK-specific) with Nominatim fallback.
"""

import pandas as pd
import requests
import json
import time
from pathlib import Path

def batch_geocode_postcodes(postcodes, batch_size=100):
    """
    Geocode postcodes using postcodes.io batch API.

    Args:
        postcodes: List of UK postcodes
        batch_size: Number of postcodes per batch (max 100)

    Returns:
        Dictionary mapping postcode -> {latitude, longitude}
    """
    results = {}

    # Process in batches
    for i in range(0, len(postcodes), batch_size):
        batch = postcodes[i:i+batch_size]
        print(f"Processing batch {i//batch_size + 1}/{(len(postcodes)-1)//batch_size + 1} ({len(batch)} postcodes)...")

        try:
            # postcodes.io batch endpoint
            response = requests.post(
                'https://api.postcodes.io/postcodes',
                json={'postcodes': batch},
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()

                for item in data.get('result', []):
                    if item['result'] and item['query']:
                        postcode = item['query']
                        result = item['result']
                        results[postcode] = {
                            'latitude': result.get('latitude'),
                            'longitude': result.get('longitude'),
                            'source': 'postcodes.io'
                        }
                    elif item['query']:
                        # Mark as failed for fallback
                        results[item['query']] = None

            # Rate limiting: wait 0.5s between batches
            time.sleep(0.5)

        except Exception as e:
            print(f"  Error in batch: {e}")
            # Mark batch as failed
            for postcode in batch:
                if postcode not in results:
                    results[postcode] = None

    return results

def fallback_geocode_nominatim(postcode):
    """
    Fallback geocoding using Nominatim (OSM) API.

    Args:
        postcode: UK postcode

    Returns:
        Dictionary with latitude/longitude or None
    """
    try:
        response = requests.get(
            'https://nominatim.openstreetmap.org/search',
            params={
                'q': postcode,
                'country': 'UK',
                'format': 'json',
                'limit': 1
            },
            headers={'User-Agent': 'UK-Schools-App/1.0'},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            if data:
                return {
                    'latitude': float(data[0]['lat']),
                    'longitude': float(data[0]['lon']),
                    'source': 'nominatim'
                }

        time.sleep(1)  # Nominatim rate limit

    except Exception as e:
        print(f"  Nominatim error for {postcode}: {e}")

    return None

def main():
    print("=" * 60)
    print("UK Schools Postcode Geocoding")
    print("=" * 60)

    # Load school data
    print("\n1. Loading school data...")
    schools_df = pd.read_csv('../data_2024-2025/england_school_information.csv')
    print(f"   Total schools: {len(schools_df)}")

    # Filter for primary schools with postcodes
    primary_schools = schools_df[schools_df['ISPRIMARY'] == 1].copy()
    print(f"   Primary schools: {len(primary_schools)}")

    # Get unique postcodes
    postcodes = primary_schools['POSTCODE'].dropna().unique().tolist()
    print(f"   Unique postcodes to geocode: {len(postcodes)}")

    # Batch geocode using postcodes.io
    print("\n2. Geocoding postcodes (postcodes.io)...")
    results = batch_geocode_postcodes(postcodes)

    # Count successes and failures
    successful = sum(1 for v in results.values() if v is not None)
    failed = sum(1 for v in results.values() if v is None)

    print(f"\n   Successful: {successful}/{len(postcodes)} ({successful/len(postcodes)*100:.1f}%)")
    print(f"   Failed: {failed}")

    # Fallback for failed postcodes
    if failed > 0:
        print(f"\n3. Trying Nominatim fallback for {failed} failed postcodes...")
        failed_postcodes = [k for k, v in results.items() if v is None]

        for i, postcode in enumerate(failed_postcodes[:50], 1):  # Limit to 50 for time
            print(f"   {i}/{min(failed, 50)}: {postcode}")
            fallback_result = fallback_geocode_nominatim(postcode)
            if fallback_result:
                results[postcode] = fallback_result

    # Final statistics
    final_successful = sum(1 for v in results.values() if v is not None)
    print(f"\n4. Final geocoding results:")
    print(f"   Successful: {final_successful}/{len(postcodes)} ({final_successful/len(postcodes)*100:.1f}%)")
    print(f"   Failed: {len(postcodes) - final_successful}")

    # Save results
    output_path = Path('../data_processed/postcode_coordinates.json')
    output_path.parent.mkdir(exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n5. Results saved to: {output_path}")
    print("\n" + "=" * 60)
    print("Geocoding complete!")
    print("=" * 60)

if __name__ == '__main__':
    main()
