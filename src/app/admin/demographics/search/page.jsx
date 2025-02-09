"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { databases, databaseId, studentsCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";
import debounce from "lodash/debounce";
import GADConnectSimpleLoader from "@/components/loading/simpleLoading";

export default function AdvancedSearch({ onFilterChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const searchParticipants = async (query) => {
    if (!query) return [];

    const searchTerms = query.toLowerCase().split(' ');
    
    try {
      const queries = [
        Query.limit(100),
        ...searchTerms.map(term => 
          Query.search('name', term)
        )
      ];

      const response = await databases.listDocuments(
        databaseId,
        studentsCollectionId,
        queries
      );

      return response.documents;
    } catch (error) {
      console.error("Search error:", error);
      throw error;
    }
  };

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query) {
        setFilteredData([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchParticipants(query);
        setFilteredData(results);
        onFilterChange?.(results);
      } catch (error) {
        setError("Search failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Search</CardTitle>
        <CardDescription>
          Search for participants by name, event, or demographic information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="search">Search Query</Label>
            <Input
              id="search"
              placeholder="Enter search terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {isLoading && <GADConnectSimpleLoader />}
          
          {error && (
            <div className="text-red-500">{error}</div>
          )}

          {!isLoading && filteredData.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Found {filteredData.length} results
              </p>
              {/* Add your results display here */}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
