"""
Validate geocoded data quality and generate validation report.
"""

import json
from pathlib import Path

def main():
    print("=" * 60)
    print("Data Validation Report")
    print("=" * 60)

    # Load postcode coordinates
    print("\n1. Validating postcode coordinates...")
    with open('../data_processed/postcode_coordinates.json', 'r') as f:
        coordinates = json.load(f)

    total_postcodes = len(coordinates)
    successful = sum(1 for v in coordinates.values() if v is not None)
    failed = total_postcodes - successful
    success_rate = (successful / total_postcodes) * 100 if total_postcodes > 0 else 0

    print(f"   Total postcodes: {total_postcodes}")
    print(f"   Successfully geocoded: {successful} ({success_rate:.2f}%)")
    print(f"   Failed: {failed}")

    # Validate coordinate bounds (UK: lat 49-61, lon -8 to 2)
    print("\n2. Validating coordinate bounds...")
    out_of_bounds = []

    for postcode, data in coordinates.items():
        if data is not None:
            lat, lon = data['latitude'], data['longitude']
            if not (49 <= lat <= 61 and -8 <= lon <= 2):
                out_of_bounds.append((postcode, lat, lon))

    if out_of_bounds:
        print(f"   WARNING: {len(out_of_bounds)} coordinates out of UK bounds")
        for pc, lat, lon in out_of_bounds[:5]:
            print(f"     {pc}: ({lat}, {lon})")
    else:
        print(f"   All {successful} coordinates within UK bounds ✓")

    # Load and validate schools data
    print("\n3. Validating schools data...")
    with open('../data_processed/schools_with_performance.json', 'r') as f:
        schools = json.load(f)

    print(f"   Total schools: {len(schools)}")

    # Check required fields
    missing_fields = []
    for i, school in enumerate(schools[:100], 1):  # Sample first 100
        required = ['urn', 'name', 'latitude', 'longitude', 'performance_score']
        for field in required:
            if field not in school or school[field] is None:
                missing_fields.append((i, school.get('urn'), field))

    if missing_fields:
        print(f"   WARNING: Missing required fields in {len(missing_fields)} schools")
    else:
        print(f"   All required fields present ✓")

    # Validate performance scores
    print("\n4. Validating performance scores...")
    scores = [s['performance_score'] for s in schools]
    min_score = min(scores)
    max_score = max(scores)
    avg_score = sum(scores) / len(scores)

    print(f"   Score range: {min_score:.1f} - {max_score:.1f}")
    print(f"   Average score: {avg_score:.1f}")

    invalid_scores = [s for s in scores if s < 0 or s > 100]
    if invalid_scores:
        print(f"   WARNING: {len(invalid_scores)} scores out of 0-100 range")
    else:
        print(f"   All scores in valid range (0-100) ✓")

    # Generate validation report
    print("\n5. Generating validation report...")
    report_lines = [
        "=" * 60,
        "UK Schools Data Validation Report",
        "=" * 60,
        "",
        "POSTCODE GEOCODING",
        f"Total postcodes: {total_postcodes}",
        f"Successfully geocoded: {successful} ({success_rate:.2f}%)",
        f"Failed: {failed}",
        f"Out of UK bounds: {len(out_of_bounds)}",
        "",
        "SCHOOLS DATA",
        f"Total schools: {len(schools)}",
        f"Schools with all required fields: {len(schools) - len(missing_fields)}",
        "",
        "PERFORMANCE SCORES",
        f"Score range: {min_score:.1f} - {max_score:.1f}",
        f"Average score: {avg_score:.1f}",
        f"Scores out of range: {len(invalid_scores)}",
        "",
        "VALIDATION STATUS",
    ]

    # Overall validation status
    all_checks_passed = (
        success_rate >= 99.0 and
        len(out_of_bounds) == 0 and
        len(missing_fields) == 0 and
        len(invalid_scores) == 0
    )

    if all_checks_passed:
        report_lines.append("✓ ALL VALIDATION CHECKS PASSED")
        status = "PASS"
    else:
        report_lines.append("✗ SOME VALIDATION CHECKS FAILED")
        status = "FAIL"
        if success_rate < 99.0:
            report_lines.append(f"  - Geocoding success rate below 99%: {success_rate:.2f}%")
        if len(out_of_bounds) > 0:
            report_lines.append(f"  - {len(out_of_bounds)} coordinates out of UK bounds")
        if len(missing_fields) > 0:
            report_lines.append(f"  - {len(missing_fields)} schools missing required fields")
        if len(invalid_scores) > 0:
            report_lines.append(f"  - {len(invalid_scores)} invalid performance scores")

    report_lines.append("")
    report_lines.append("=" * 60)

    # Save report
    report_path = Path('../data_processed/validation_report.txt')
    with open(report_path, 'w') as f:
        f.write('\n'.join(report_lines))

    print(f"   Report saved to: {report_path}")

    # Print summary
    print("\n" + "=" * 60)
    print(f"Validation Status: {status}")
    print("=" * 60)

    for line in report_lines:
        print(line)

if __name__ == '__main__':
    main()
