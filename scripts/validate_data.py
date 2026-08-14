"""
Validate geocoded data quality and generate a validation report.

Exits non-zero if any check fails on either phase -- this is what makes
run_all.sh's error handling (and the CI pipeline) actually fail closed on
bad data, rather than silently continuing.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent


def validate_schools(json_path: Path, label: str) -> tuple[bool, list[str]]:
    """Validate one schools JSON file. Returns (passed, report_lines)."""
    with open(json_path, 'r') as f:
        schools = json.load(f)

    print(f"\nValidating {label} ({json_path.name})...")
    print(f"   Total schools: {len(schools)}")

    missing_fields = []
    for i, school in enumerate(schools[:100], 1):
        required = ['urn', 'name', 'latitude', 'longitude', 'performance_score']
        for field in required:
            if field not in school or school[field] is None:
                missing_fields.append((i, school.get('urn'), field))

    if missing_fields:
        print(f"   WARNING: Missing required fields in {len(missing_fields)} schools")
    else:
        print("   All required fields present (checked first 100)")

    scores = [s['performance_score'] for s in schools]
    min_score, max_score = min(scores), max(scores)
    avg_score = sum(scores) / len(scores)
    print(f"   Score range: {min_score:.1f} - {max_score:.1f}, mean {avg_score:.1f}")

    invalid_scores = [s for s in scores if s < 0 or s > 100]
    if invalid_scores:
        print(f"   WARNING: {len(invalid_scores)} scores out of 0-100 range")
    else:
        print("   All scores in valid range (0-100)")

    out_of_bounds = [
        s for s in schools
        if not (49 <= s['latitude'] <= 61 and -8 <= s['longitude'] <= 2)
    ]
    if out_of_bounds:
        print(f"   WARNING: {len(out_of_bounds)} schools with coordinates outside UK bounds")
    else:
        print("   All coordinates within UK bounds")

    passed = not missing_fields and not invalid_scores and not out_of_bounds
    lines = [
        f"{label.upper()} ({json_path.name})",
        f"Total schools: {len(schools)}",
        f"Missing required fields (sampled first 100): {len(missing_fields)}",
        f"Score range: {min_score:.1f} - {max_score:.1f}, mean {avg_score:.1f}",
        f"Scores out of range: {len(invalid_scores)}",
        f"Coordinates out of UK bounds: {len(out_of_bounds)}",
        "PASS" if passed else "FAIL",
        "",
    ]
    return passed, lines


def main():
    print("=" * 60)
    print("Data Validation Report")
    print("=" * 60)

    processed = ROOT / 'data_processed'

    print("\n1. Validating postcode geocoding...")
    with open(processed / 'postcode_coordinates.json', 'r') as f:
        coordinates = json.load(f)

    total_postcodes = len(coordinates)
    successful = sum(1 for v in coordinates.values() if v is not None)
    failed = total_postcodes - successful
    success_rate = (successful / total_postcodes) * 100 if total_postcodes > 0 else 0
    geocoding_passed = success_rate >= 99.0

    print(f"   Total postcodes: {total_postcodes}")
    print(f"   Successfully geocoded: {successful} ({success_rate:.2f}%)")
    print(f"   Failed: {failed}")

    report_lines = [
        "=" * 60,
        "UK Schools Data Validation Report",
        "=" * 60,
        "",
        "POSTCODE GEOCODING",
        f"Total postcodes: {total_postcodes}",
        f"Successfully geocoded: {successful} ({success_rate:.2f}%)",
        "PASS" if geocoding_passed else "FAIL (below 99% success rate)",
        "",
    ]

    primary_passed, primary_lines = validate_schools(
        processed / 'schools_with_performance.json', 'primary schools'
    )
    secondary_passed, secondary_lines = validate_schools(
        processed / 'secondary_schools.json', 'secondary schools'
    )
    report_lines += primary_lines + secondary_lines

    all_passed = geocoding_passed and primary_passed and secondary_passed
    report_lines.append("OVERALL: " + ("ALL VALIDATION CHECKS PASSED" if all_passed else "SOME VALIDATION CHECKS FAILED"))
    report_lines.append("=" * 60)

    report_path = processed / 'validation_report.txt'
    with open(report_path, 'w') as f:
        f.write('\n'.join(report_lines))
    print(f"\nReport saved to: {report_path}")

    print("\n" + "=" * 60)
    print(f"Validation Status: {'PASS' if all_passed else 'FAIL'}")
    print("=" * 60)

    if not all_passed:
        sys.exit(1)


if __name__ == '__main__':
    main()
