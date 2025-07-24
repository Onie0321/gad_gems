"use client";
import { useState, useCallback, useMemo } from "react";
import Fuse from "fuse.js";
import { debounce } from "lodash";

export const useFuseSearch = (students = []) => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    program: "",
    participantType: "",
    sex: "",
    year: "",
    school: "",
  });
  const [sortBy, setSortBy] = useState({ field: "lastName", direction: "asc" });
  const [resultLimit, setResultLimit] = useState(50); // Limit results for performance

  // Fuse.js configuration for optimal performance with 7000+ records
  const fuseOptions = useMemo(
    () => ({
      // Search in all specified fields with different weights
      keys: [
        { name: "studentId", weight: 0.8 },
        { name: "lastName", weight: 0.7 },
        { name: "firstName", weight: 0.7 },
        { name: "name", weight: 0.6 },
        { name: "school", weight: 0.5 },
        { name: "program", weight: 0.5 },
        { name: "address", weight: 0.4 },
        { name: "year", weight: 0.3 },
        { name: "section", weight: 0.3 },
        { name: "ethnicGroup", weight: 0.2 },
        { name: "religion", weight: 0.2 },
        { name: "orientation", weight: 0.2 },
        { name: "eventId", weight: 0.1 },
        { name: "createdBy", weight: 0.1 },
        { name: "academicPeriodId", weight: 0.1 },
        { name: "otherEthnicGroup", weight: 0.1 },
        { name: "middleName", weight: 0.1 },
        { name: "firstGen", weight: 0.1 },
        { name: "participantType", weight: 0.1 },
        { name: "source", weight: 0.1 },
        { name: "sex", weight: 0.1 },
        { name: "age", weight: 0.1 },
      ],
      // Fuzzy threshold - lower = more strict matching
      threshold: 0.4,
      // Include score in results for debugging/ranking
      includeScore: true,
      // Include matches for highlighting
      includeMatches: true,
      // Ignore location for better performance
      ignoreLocation: true,
      // Use extended search for more powerful queries
      useExtendedSearch: true,
      // Distance for fuzzy matching
      distance: 100,
      // Minimum character length for matching
      minMatchCharLength: 2,
      // Should the search be case sensitive
      isCaseSensitive: false,
      // Should the search look for exact matches
      findAllMatches: true,
      // Limit results for performance
      limit: resultLimit,
    }),
    [resultLimit]
  );

  // Initialize Fuse instance
  const fuse = useMemo(() => {
    if (!students || students.length === 0) return null;
    return new Fuse(students, fuseOptions);
  }, [students, fuseOptions]);

  // Apply filters to students
  const filteredStudents = useMemo(() => {
    if (!students || students.length === 0) return [];

    let filtered = students;

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "") {
        filtered = filtered.filter((student) => {
          const fieldValue = student[key];
          if (!fieldValue) return false;

          // Handle case-insensitive comparison
          return fieldValue.toString().toLowerCase() === value.toLowerCase();
        });
      }
    });

    return filtered;
  }, [students, filters]);

  // Search function with debouncing
  const debouncedSearch = useCallback(
    debounce((searchQuery, searchFilters, searchSortBy) => {
      // This will be handled by the search results computation
    }, 300),
    []
  );

  // Search results computation
  const searchResults = useMemo(() => {
    if (!fuse || !filteredStudents.length) return [];

    if (!query.trim()) {
      // If no query, return filtered students with sorting
      let results = filteredStudents
        .slice(0, resultLimit) // Limit results for performance
        .map((student, index) => ({
          item: student,
          refIndex: index,
          score: 0,
        }));

      // Apply sorting
      if (sortBy.field) {
        results.sort((a, b) => {
          const aValue = a.item[sortBy.field] || "";
          const bValue = b.item[sortBy.field] || "";

          if (sortBy.direction === "asc") {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        });
      }

      return results;
    }

    // Perform fuzzy search
    const searchResults = fuse.search(query);

    // Filter results based on current filters (already applied to filteredStudents)
    const filteredResults = searchResults.filter((result) =>
      filteredStudents.some((student) => student.$id === result.item.$id)
    );

    // Apply sorting
    if (sortBy.field) {
      filteredResults.sort((a, b) => {
        const aValue = a.item[sortBy.field] || "";
        const bValue = b.item[sortBy.field] || "";

        if (sortBy.direction === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filteredResults;
  }, [fuse, filteredStudents, query, sortBy, resultLimit]);

  // Search function
  const search = useCallback(
    (searchQuery, searchFilters = {}, searchSortBy = sortBy) => {
      setQuery(searchQuery);
      setFilters((prev) => ({ ...prev, ...searchFilters }));
      setSortBy(searchSortBy);
      debouncedSearch(searchQuery, searchFilters, searchSortBy);
    },
    [debouncedSearch, sortBy]
  );

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Update sorting
  const updateSorting = useCallback((field, direction = "asc") => {
    setSortBy({ field, direction });
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery("");
    setFilters({
      program: "",
      participantType: "",
      sex: "",
      year: "",
      school: "",
    });
    setSortBy({ field: "lastName", direction: "asc" });
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Get unique values for filter dropdowns
  const getUniqueValues = useCallback(
    (field) => {
      if (!students || students.length === 0) return [];

      const values = students
        .map((student) => student[field])
        .filter((value) => value && value !== "")
        .map((value) => value.toString());

      return [...new Set(values)].sort();
    },
    [students]
  );

  // Update result limit
  const updateResultLimit = useCallback((limit) => {
    setResultLimit(limit);
  }, []);

  return {
    // State
    query,
    filters,
    sortBy,
    results: searchResults,
    resultLimit,

    // Actions
    search,
    updateFilters,
    updateSorting,
    clearSearch,
    getUniqueValues,
    updateResultLimit,

    // Utilities
    hasResults: searchResults.length > 0,
    totalResults: searchResults.length,
    totalStudents: students.length,
    isSearching: query.trim().length > 0,
    hasMoreResults: filteredStudents.length > resultLimit,
  };
};
