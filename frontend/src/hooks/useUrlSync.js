import { useEffect, useRef, useState } from 'react';
import { parseSearchParams, searchSignature, buildSearchString } from '../utils/urlParams';

/**
 * Two-way sync between App.jsx's search/selection state and the URL query
 * string. No router, no path segments -- see urlParams.js for why.
 *
 * - On mount and on popstate, re-parses window.location.search and calls
 *   onRestore(parsed) to reproduce that state (search / deep-link / both).
 * - Reflects state changes back into the URL via push/replaceState, using
 *   a deterministic serialization (buildSearchString) so a restore never
 *   re-triggers a write -- the URL an app-driven restore lands on always
 *   round-trips to the exact same string it started from.
 *
 * Push vs. replace: a new search destination or a phase change gets its
 * own history entry (pushState); a radius tweak or a selection change
 * mutates the current entry (replaceState) rather than bloating history.
 */
export function useUrlSync({ urlState, onRestore }) {
  const { searchLocation, radiusKm, phase, selectedSchool } = urlState;

  const isRestoringRef = useRef(false);
  const hasWrittenRef = useRef(false);
  const prevSignatureRef = useRef(undefined);
  const prevPhaseRef = useRef(undefined);
  const [restoreTick, setRestoreTick] = useState(0);

  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // Mount + popstate: parse the URL, restore state from it.
  useEffect(() => {
    const restore = async () => {
      isRestoringRef.current = true;
      try {
        await onRestoreRef.current(parseSearchParams(window.location.search));
      } finally {
        isRestoringRef.current = false;
        // Force one more pass of the write-effect below, now that React has
        // committed whatever state the restore produced -- see the module
        // doc comment for why this can't just rely on the effect's own deps.
        setRestoreTick((t) => t + 1);
      }
    };
    restore();

    const onPopState = () => { restore(); };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write effect: reflect current state into the URL.
  useEffect(() => {
    if (isRestoringRef.current) return;

    const nextSearch = buildSearchString({ searchLocation, radiusKm, phase, selectedSchool });
    const currentSearch = window.location.search;
    const signature = searchSignature(searchLocation);

    if (nextSearch === currentSearch) {
      prevSignatureRef.current = signature;
      prevPhaseRef.current = phase;
      hasWrittenRef.current = true;
      return;
    }

    const isFirstWrite = !hasWrittenRef.current;
    const isNewDestination = signature !== prevSignatureRef.current;
    const isPhaseChange = !isNewDestination && phase !== prevPhaseRef.current;
    const url = `${window.location.pathname}${nextSearch}${window.location.hash}`;

    if (isFirstWrite) {
      window.history.replaceState(null, '', url);
    } else if (isNewDestination || isPhaseChange) {
      window.history.pushState(null, '', url);
    } else {
      window.history.replaceState(null, '', url);
    }

    prevSignatureRef.current = signature;
    prevPhaseRef.current = phase;
    hasWrittenRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchSignature(searchLocation), radiusKm, phase, selectedSchool?.urn, restoreTick]);
}
