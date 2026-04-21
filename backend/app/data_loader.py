"""
Load schools data into memory for fast querying.
"""

import json
from pathlib import Path
from typing import List, Dict

class SchoolDataLoader:
    """Singleton class to load and cache school data."""

    _instance = None
    _schools: List[Dict] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SchoolDataLoader, cls).__new__(cls)
        return cls._instance

    def load_schools(self, data_path: str = None) -> List[Dict]:
        """
        Load schools data from JSON file.

        Args:
            data_path: Path to schools_with_performance.json

        Returns:
            List of school dictionaries
        """
        if self._schools is not None:
            return self._schools

        if data_path is None:
            # Default path relative to backend directory
            data_path = Path(__file__).parent.parent.parent / 'data_processed' / 'schools_with_performance.json'
        else:
            data_path = Path(data_path)

        if not data_path.exists():
            raise FileNotFoundError(f"Schools data not found at {data_path}")

        print(f"Loading schools data from {data_path}...")
        with open(data_path, 'r') as f:
            self._schools = json.load(f)

        print(f"Loaded {len(self._schools)} schools into memory")
        return self._schools

    def get_schools(self) -> List[Dict]:
        """Get cached schools data."""
        if self._schools is None:
            self.load_schools()
        return self._schools

    def get_school_by_urn(self, urn: int) -> Dict:
        """
        Find a school by its URN.

        Args:
            urn: Unique Reference Number

        Returns:
            School dictionary or None if not found
        """
        schools = self.get_schools()
        for school in schools:
            if school['urn'] == urn:
                return school
        return None

    def get_stats(self) -> Dict:
        """
        Get dataset statistics.

        Returns:
            Dictionary with statistics
        """
        schools = self.get_schools()
        scores = [s['performance_score'] for s in schools]

        return {
            'total_schools': len(schools),
            'score_range': {
                'min': round(min(scores), 1),
                'max': round(max(scores), 1),
                'mean': round(sum(scores) / len(scores), 1),
            },
            'score_distribution': {
                'excellent_75_plus': len([s for s in scores if s >= 75]),
                'good_60_74': len([s for s in scores if 60 <= s < 75]),
                'average_45_59': len([s for s in scores if 45 <= s < 60]),
                'below_average_under_45': len([s for s in scores if s < 45]),
            }
        }

# Create singleton instance
school_data_loader = SchoolDataLoader()
