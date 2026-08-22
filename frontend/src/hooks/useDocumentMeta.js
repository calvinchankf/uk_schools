import { useEffect } from 'react';

const SITE_NAME = 'UK Schools Search';
const DEFAULT_TITLE = `${SITE_NAME} — Compare Primary & Secondary Schools in England`;
const DEFAULT_DESCRIPTION =
  'Search UK primary and secondary schools by postcode or place name and compare ' +
  'performance scores, exam results, and pupil demographics.';

function getMetaDescriptionEl() {
  let el = document.querySelector('meta[name="description"]');
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', 'description');
    document.head.appendChild(el);
  }
  return el;
}

function locationLabel(searchLocation) {
  if (!searchLocation) return null;
  return searchLocation.postcode || searchLocation.place_name || null;
}

/**
 * Keeps document.title and <meta name="description"> in sync with the
 * current search/selection, so shared/crawled URLs carry real, distinct
 * content instead of the same static title everywhere. See
 * frontend/index.html for the static baseline these override once JS runs.
 */
export function useDocumentMeta({ phase, searchLocation, selectedSchool, resultCount }) {
  useEffect(() => {
    const phaseLabel = phase === 'secondary' ? 'Secondary' : 'Primary';
    const examLabel = phase === 'secondary' ? 'GCSE' : 'KS2';
    const label = locationLabel(searchLocation);

    let title = DEFAULT_TITLE;
    let description = DEFAULT_DESCRIPTION;

    if (selectedSchool) {
      const town = selectedSchool.address?.town || selectedSchool.postcode || '';
      title = `${selectedSchool.name} | ${SITE_NAME}`;
      description = [
        selectedSchool.name,
        selectedSchool.school_type && town ? `— ${selectedSchool.school_type} in ${town}.` : null,
        selectedSchool.performance_score != null
          ? `Performance score ${selectedSchool.performance_score}, ${examLabel} results and pupil demographics.`
          : null,
      ].filter(Boolean).join(' ');
    } else if (label) {
      title = `${phaseLabel} schools near ${label} | ${SITE_NAME}`;
      description = `Compare ${resultCount ?? 0} ${phaseLabel.toLowerCase()} schools near ${label}, ` +
        `ranked by performance score, exam results, and pupil demographics.`;
    }

    document.title = title;
    getMetaDescriptionEl().setAttribute('content', description);
  }, [phase, searchLocation, selectedSchool, resultCount]);
}
