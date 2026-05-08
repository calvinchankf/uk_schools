"""
Merge school information with KS4 performance data and calculate composite scores
for secondary schools. Outputs secondary_schools.json for the web application.
"""

import pandas as pd
import json
from pathlib import Path


def safe_float(value):
    if pd.isna(value) or value in ('SUPP', 'NP', 'NE', 'NA', 'LOWCOV'):
        return None
    try:
        if isinstance(value, str):
            value = value.strip().rstrip('%')
        return float(value)
    except (ValueError, TypeError):
        return None


ATT8_MAX = 87.2  # observed maximum in the 2024-2025 dataset


def calculate_composite_score(row):
    """
    KS4 composite score (0-100).

    Weights:
    - PTL2BASICS_94 (% grade 5+ in English & Maths): 50%
    - ATT8SCR (Attainment 8, normalised from 0-87.2):  35%
    - PTEBACC_94 (% EBacc grade 4+):                   15%

    Requires at least 2 valid metrics.
    """
    scores = []
    weights = []

    basics = safe_float(row.get('PTL2BASICS_94'))
    if basics is not None:
        scores.append(basics)
        weights.append(0.50)

    att8 = safe_float(row.get('ATT8SCR'))
    if att8 is not None:
        scores.append(min((att8 / ATT8_MAX) * 100, 100))
        weights.append(0.35)

    ebacc = safe_float(row.get('PTEBACC_94'))
    if ebacc is not None:
        scores.append(ebacc)
        weights.append(0.15)

    if len(scores) < 2:
        return None

    total_weight = sum(weights)
    return round(sum(s * w for s, w in zip(scores, weights)) / total_weight, 1)


def main():
    print("=" * 60)
    print("UK Secondary Schools Data Preparation (KS4)")
    print("=" * 60)

    print("\n1. Loading school information...")
    schools_df = pd.read_csv(
        '../data_2024-2025/england_school_information.csv',
        encoding='utf-8-sig',
    )
    print(f"   Total schools: {len(schools_df)}")

    print("\n2. Loading KS4 performance data...")
    ks4_df = pd.read_csv(
        '../data_2024-2025/england_ks4provisional.csv',
        encoding='utf-8-sig',
        low_memory=False,
    )
    # RECTYPE=1 = individual school rows
    ks4_df = ks4_df[ks4_df['RECTYPE'] == 1].copy()
    ks4_df['URN'] = pd.to_numeric(ks4_df['URN'], errors='coerce')
    print(f"   KS4 school-level records: {len(ks4_df)}")

    print("\n3. Loading postcode coordinates...")
    with open('../data_processed/postcode_coordinates.json') as f:
        coordinates = json.load(f)
    print(f"   Cached postcodes: {len(coordinates)}")

    print("\n4. Filtering for secondary schools...")
    secondary = schools_df[schools_df['ISSECONDARY'] == 1].copy()
    print(f"   Secondary schools: {len(secondary)}")

    print("\n5. Merging with KS4 data...")
    ks4_cols = ['URN', 'ATT8SCR', 'PTL2BASICS_94', 'PTEBACC_94', 'PTEBACC_E_PTQ_EE', 'PTFSM6CLA1A']
    ks4_subset = ks4_df[[c for c in ks4_cols if c in ks4_df.columns]].copy()
    merged = secondary.merge(ks4_subset, on='URN', how='left', suffixes=('', '_ks4'))
    print(f"   Merged records: {len(merged)}")

    print("\n6. Adding coordinates...")
    merged['latitude'] = merged['POSTCODE'].map(
        lambda pc: coordinates.get(pc, {}).get('latitude')
        if isinstance(pc, str) and pc in coordinates and coordinates.get(pc) is not None
        else None
    )
    merged['longitude'] = merged['POSTCODE'].map(
        lambda pc: coordinates.get(pc, {}).get('longitude')
        if isinstance(pc, str) and pc in coordinates and coordinates.get(pc) is not None
        else None
    )

    has_data = merged[
        merged['latitude'].notna() &
        merged['longitude'].notna() &
        merged['ATT8SCR'].notna()
    ].copy()
    print(f"   With coordinates + KS4 data: {len(has_data)}")

    print("\n7. Calculating performance scores...")
    has_data['performance_score'] = has_data.apply(calculate_composite_score, axis=1)
    final = has_data[has_data['performance_score'].notna()].copy()
    print(f"   Schools with valid scores: {len(final)}")

    print("\n8. Preparing output...")
    schools_list = []
    for _, row in final.iterrows():
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
            'phase': 'secondary',
            'metrics': {
                'att8_score': safe_float(row.get('ATT8SCR')),
                'l2basics_94': safe_float(row.get('PTL2BASICS_94')),
                'ebacc_94': safe_float(row.get('PTEBACC_94')),
                'ebacc_entry': safe_float(row.get('PTEBACC_E_PTQ_EE')),
            },
            'fsm_pct': safe_float(row.get('PTFSM6CLA1A')),
            'address': {
                'street': row['STREET'] if pd.notna(row.get('STREET')) else '',
                'town': row['TOWN'] if pd.notna(row.get('TOWN')) else '',
                'locality': row['LOCALITY'] if pd.notna(row.get('LOCALITY')) else '',
            },
        }
        schools_list.append(school)

    output_path = Path('../data_processed/secondary_schools.json')
    with open(output_path, 'w') as f:
        json.dump(schools_list, f, indent=2)
    print(f"\n9. Saved to: {output_path}")

    scores = [s['performance_score'] for s in schools_list]
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"Total secondary schools: {len(schools_list)}")
    print(f"Score range: {min(scores):.1f} – {max(scores):.1f}")
    print(f"Mean: {sum(scores)/len(scores):.1f}")
    print(f"Excellent (75+):      {sum(1 for s in scores if s >= 75)}")
    print(f"Good (60-74):         {sum(1 for s in scores if 60 <= s < 75)}")
    print(f"Average (45-59):      {sum(1 for s in scores if 45 <= s < 60)}")
    print(f"Below average (<45):  {sum(1 for s in scores if s < 45)}")
    print("=" * 60)


if __name__ == '__main__':
    main()
