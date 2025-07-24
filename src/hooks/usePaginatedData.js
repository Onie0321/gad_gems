import { useState, useEffect, useCallback } from "react";

export const usePaginatedData = (endpoint, options = {}) => {
  const {
    page = 1,
    limit = 10,
    includeArchived = false,
    enabled = true,
  } = options;

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: limit,
    hasNextPage: false,
    hasPreviousPage: false,
    startIndex: 0,
    endIndex: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (pageNum = page) => {
      if (!enabled) {
        console.log(`${endpoint} fetch disabled:`, { enabled });
        return;
      }

      console.log(`Starting ${endpoint} fetch (BYPASSING ACADEMIC PERIOD):`, {
        page: pageNum,
        limit,
        includeArchived,
        enabled,
      });

      setLoading(true);
      setError(null);

      try {
        // Build query parameters - NO ACADEMIC PERIOD FILTERING
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: limit.toString(),
        });

        if (includeArchived) {
          params.append("includeArchived", "true");
        }

        const url = `/api/${endpoint}?${params.toString()}`;
        console.log(`Fetching ${endpoint} from:`, url);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch data");
        }

        // Extract data based on endpoint
        let items = [];
        if (endpoint === "students") {
          items = result.data.students;
        } else if (endpoint === "staff-faculty") {
          items = result.data.staffFaculty;
        } else if (endpoint === "community") {
          items = result.data.community;
        }

        setData(items);
        setPagination(result.data.pagination);

        console.log(`Fetched ${endpoint} data:`, {
          items: items.length,
          pagination: result.data.pagination,
        });
      } catch (err) {
        console.error(`Error fetching ${endpoint}:`, err);
        setError(err.message);
        setData([]);
        setPagination({
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPreviousPage: false,
          startIndex: 0,
          endIndex: 0,
        });
      } finally {
        setLoading(false);
      }
    },
    [endpoint, page, limit, includeArchived, enabled]
  );

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Function to go to next page
  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      fetchData(pagination.currentPage + 1);
    }
  }, [pagination.hasNextPage, pagination.currentPage, fetchData]);

  // Function to go to previous page
  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      fetchData(pagination.currentPage - 1);
    }
  }, [pagination.hasPreviousPage, pagination.currentPage, fetchData]);

  // Function to go to specific page
  const goToPage = useCallback(
    (pageNum) => {
      if (pageNum >= 1 && pageNum <= pagination.totalPages) {
        fetchData(pageNum);
      }
    },
    [pagination.totalPages, fetchData]
  );

  // Function to refresh current page
  const refresh = useCallback(() => {
    fetchData(pagination.currentPage);
  }, [fetchData, pagination.currentPage]);

  return {
    data,
    pagination,
    loading,
    error,
    nextPage,
    previousPage,
    goToPage,
    refresh,
    fetchData,
  };
};
