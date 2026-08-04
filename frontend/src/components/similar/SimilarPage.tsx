'use client';

import React, { useState, useCallback } from 'react';
import { similarApi } from '@/lib/api';
import { ProblemSearchInput } from './ProblemSearchInput';
import { SimilarProblemsView } from './SimilarProblemsView';
import { UnsolvedAutoSurface } from './UnsolvedAutoSurface';
import type { SimilarProblemsResponse, ProblemLookupResult } from '@/types';

export function SimilarPage() {
  const [query, setQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<any[]>([]);
  const [urlLookupResult, setUrlLookupResult] = useState<ProblemLookupResult | null>(null);
  const [similarData, setSimilarData] = useState<SimilarProblemsResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  // Autocomplete on text query change (ProblemSearchInput already debounces)
  const handleQueryChange = useCallback(async (q: string) => {
    setQuery(q);
    setUrlLookupResult(null);

    if (!q || q.length < 2) {
      setAutocompleteResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await similarApi.autocomplete(q);
      setAutocompleteResults(res.data);
    } catch {
      setAutocompleteResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Select from autocomplete → fetch similar
  const handleSelect = useCallback(async (problemId: string) => {
    setAutocompleteResults([]);
    setUrlLookupResult(null);
    setIsLoadingSimilar(true);
    setSimilarData(null);

    try {
      const res = await similarApi.findSimilar(problemId);
      setSimilarData(res.data);
    } catch {
      setSimilarData(null);
    } finally {
      setIsLoadingSimilar(false);
    }
  }, []);

  // URL paste → look up, then fetch similar if found
  const handleUrlLookup = useCallback(async (url: string) => {
    setAutocompleteResults([]);
    setUrlLookupResult(null);
    setIsLoadingSimilar(true);
    setSimilarData(null);

    try {
      const res = await similarApi.lookupUrl(url);
      const result: ProblemLookupResult = res.data;
      setUrlLookupResult(result);

      // Problem not in DB at all
      if (result.not_indexed) {
        setIsLoadingSimilar(false);
        return;
      }

      // Problem exists but has no embedding — treat as not indexed
      if (result.has_embedding === false) {
        setUrlLookupResult({ ...result, not_indexed: true, message: 'This problem exists but doesn\'t have a precomputed embedding yet. The corpus is refreshed periodically.' });
        setIsLoadingSimilar(false);
        return;
      }

      if (result.id) {
        const simRes = await similarApi.findSimilar(result.id);
        setSimilarData(simRes.data);
      }
    } catch {
      setUrlLookupResult({ not_indexed: true, message: 'Could not parse this URL. Please check the format.' });
    } finally {
      setIsLoadingSimilar(false);
    }
  }, []);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#E6EDF3] mb-1">
          Similar Problems
        </h1>
        <p className="text-xs text-[#8B949E]">
          Paste a problem URL or search by name to find semantically similar problems across platforms.
        </p>
      </div>

      {/* Auto-surface Unsolved Codeforces Problems */}
      <UnsolvedAutoSurface onFindSimilar={handleSelect} />

      {/* Search input */}
      <ProblemSearchInput
        onSelect={handleSelect}
        onUrlLookup={handleUrlLookup}
        autocompleteResults={autocompleteResults}
        onQueryChange={handleQueryChange}
        isLoading={isSearching}
        urlLookupResult={urlLookupResult}
      />

      {/* Results */}
      <div className="mt-8">
        <SimilarProblemsView
          data={similarData}
          isLoading={isLoadingSimilar}
        />
      </div>
    </div>
  );
}
