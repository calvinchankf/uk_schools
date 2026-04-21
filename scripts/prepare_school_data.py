"""
Merge school information with KS2 performance data and calculate composite scores.
Outputs schools_with_performance.json for the web application.
"""

import pandas as pd
import json
from pathlib import Path

def safe_float(value):
    """Safely convert a value to float, handling % signs and other formats."""
    if pd.isna(value) or value == 'SUPP':
        return None
    try:
        # Remove '%' sign if present
        if isinstance(value, str):
            value = value.strip().rstrip('%')
        return float(value)
    except (ValueError, TypeError):
        return None

def normalize_score(value, min_val, max_val):
    """Normalize a score to 0-100 scale."""
    value = safe_float(value)
    if value is None:
        return None
    return ((value - min_val) / (max_val - min_val)) * 100

def calculate_composite_score(row):
    """
    Calculate composite performance score (0-100).

    Weights:
    - PTRWM_EXP (% at expected standard): 40%
    - PTRWM_HIGH (% at high standard): 20%
    - READ_AVERAGE (reading scaled score): 15%
    - MAT_AVERAGE (maths scaled score): 15%
    - GPS_AVERAGE (GPS scaled score): 10%

    Returns:
        Composite score (0-100) or None if insufficient data
    """
    scores = []
    weights = []

    # PTRWM_EXP (already 0-100 scale)
    ptrwm_exp = safe_float(row.get('PTRWM_EXP'))
    if ptrwm_exp is not None:
        scores.append(ptrwm_exp)
        weights.append(0.40)

    # PTRWM_HIGH (already 0-100 scale)
    ptrwm_high = safe_float(row.get('PTRWM_HIGH'))
    if ptrwm_high is not None:
        scores.append(ptrwm_high)
        weights.append(0.20)

    # READ_AVERAGE (scaled score ~80-120, normalize to 0-100)
    read_norm = normalize_score(row.get('READ_AVERAGE'), 80, 120)
    if read_norm is not None:
        scores.append(read_norm)
        weights.append(0.15)

    # MAT_AVERAGE (scaled score ~80-120, normalize to 0-100)
    mat_norm = normalize_score(row.get('MAT_AVERAGE'), 80, 120)
    if mat_norm is not None:
        scores.append(mat_norm)
        weights.append(0.15)

    # GPS_AVERAGE (scaled score ~80-120, normalize to 0-100)
    gps_norm = normalize_score(row.get('GPS_AVERAGE'), 80, 120)
    if gps_norm is not None:
        scores.append(gps_norm)
        weights.append(0.10)

    # Calculate weighted average if we have at least 3 metrics
    if len(scores) >= 3:
        # Normalize weights to sum to 1
        total_weight = sum(weights)
        weighted_sum = sum(s * w for s, w in zip(scores, weights))
        return round(weighted_sum / total_weight, 1)

    return None

def main():
    print("=" * 60)
    print("UK Schools Data Preparation")
    print("=" * 60)

    # Load school information
    print("\n1. Loading school information...")
    schools_df = pd.read_csv('../data_2024-2025/england_school_information.csv')
    print(f"   Total schools: {len(schools_df)}")

    # Load KS2 performance data
    print("\n2. Loading KS2 performance data...")
    ks2_df = pd.read_csv('../data_2024-2025/england_ks2revised.csv')
    print(f"   KS2 records: {len(ks2_df)}")

    # Load geocoded coordinates
    print("\n3. Loading postcode coordinates...")
    with open('../data_processed/postcode_coordinates.json', 'r') as f:
        coordinates = json.load(f)
    print(f"   Geocoded postcodes: {len(coordinates)}")

    # Filter for primary schools
    print("\n4. Filtering for primary schools...")
    primary_schools = schools_df[schools_df['ISPRIMARY'] == 1].copy()
    print(f"   Primary schools: {len(primary_schools)}")

    # Merge with KS2 data on URN
    print("\n5. Merging with KS2 performance data...")
    merged_df = primary_schools.merge(
        ks2_df,
        on='URN',
        how='left',
        suffixes=('', '_ks2')
    )
    print(f"   Merged records: {len(merged_df)}")

    # Add coordinates
    print("\n6. Adding geocoded coordinates...")
    merged_df['latitude'] = merged_df['POSTCODE'].map(
        lambda pc: coordinates.get(pc, {}).get('latitude') if pd.notna(pc) and pc in coordinates and coordinates.get(pc) is not None else None
    )
    merged_df['longitude'] = merged_df['POSTCODE'].map(
        lambda pc: coordinates.get(pc, {}).get('longitude') if pd.notna(pc) and pc in coordinates and coordinates.get(pc) is not None else None
    )

    # Filter for schools with coordinates and KS2 data
    schools_with_data = merged_df[
        merged_df['latitude'].notna() &
        merged_df['longitude'].notna() &
        merged_df['PTRWM_EXP'].notna()
    ].copy()

    print(f"   Schools with coordinates and KS2 data: {len(schools_with_data)}")

    # Calculate composite performance scores
    print("\n7. Calculating performance scores...")
    schools_with_data['performance_score'] = schools_with_data.apply(
        calculate_composite_score, axis=1
    )

    # Filter out schools without valid performance scores
    final_schools = schools_with_data[schools_with_data['performance_score'].notna()].copy()
    print(f"   Schools with valid performance scores: {len(final_schools)}")

    # Prepare output data structure
    print("\n8. Preparing output data...")
    schools_list = []

    for _, row in final_schools.iterrows():
        school = {
            'urn': int(row['URN']),
            'name': row['SCHNAME'],
            'postcode': row['POSTCODE'],
            'latitude': float(row['latitude']),
            'longitude': float(row['longitude']),
            'school_type': row['SCHOOLTYPE'] if pd.notna(row['SCHOOLTYPE']) else 'Unknown',
            'age_low': int(row['AGELOW']) if pd.notna(row['AGELOW']) else None,
            'age_high': int(row['AGEHIGH']) if pd.notna(row['AGEHIGH']) else None,
            'performance_score': float(row['performance_score']),
            'metrics': {
                'ptrwm_exp': safe_float(row['PTRWM_EXP']),
                'ptrwm_high': safe_float(row['PTRWM_HIGH']),
                'read_average': safe_float(row['READ_AVERAGE']),
                'mat_average': safe_float(row['MAT_AVERAGE']),
                'gps_average': safe_float(row['GPS_AVERAGE']),
            },
            'address': {
                'street': row['STREET'] if pd.notna(row['STREET']) else '',
                'town': row['TOWN'] if pd.notna(row['TOWN']) else '',
                'locality': row['LOCALITY'] if pd.notna(row['LOCALITY']) else '',
            }
        }
        schools_list.append(school)

    # Save to JSON
    output_path = Path('../data_processed/schools_with_performance.json')
    with open(output_path, 'w') as f:
        json.dump(schools_list, f, indent=2)

    print(f"\n9. Data saved to: {output_path}")

    # Summary statistics
    print("\n" + "=" * 60)
    print("Summary Statistics")
    print("=" * 60)
    print(f"Total schools in output: {len(schools_list)}")
    print(f"Performance score range: {final_schools['performance_score'].min():.1f} - {final_schools['performance_score'].max():.1f}")
    print(f"Performance score mean: {final_schools['performance_score'].mean():.1f}")
    print(f"Performance score median: {final_schools['performance_score'].median():.1f}")
    print("\nPerformance distribution:")
    print(f"  Excellent (75+): {len(final_schools[final_schools['performance_score'] >= 75])}")
    print(f"  Good (60-74): {len(final_schools[(final_schools['performance_score'] >= 60) & (final_schools['performance_score'] < 75)])}")
    print(f"  Average (45-59): {len(final_schools[(final_schools['performance_score'] >= 45) & (final_schools['performance_score'] < 60)])}")
    print(f"  Below average (<45): {len(final_schools[final_schools['performance_score'] < 45])}")
    print("=" * 60)

if __name__ == '__main__':
    main()
