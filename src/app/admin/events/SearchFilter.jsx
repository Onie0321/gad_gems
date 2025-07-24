"use client";

import React, { useState, useEffect } from "react";
import { databases, databaseId, eventCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/appwrite";

export function SearchFilter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const { toast } = useToast();
  const router = useRouter();

  // Check admin access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "admin") {
          router.push("/sign-in");
          return;
        }
        setUser(currentUser);
      } catch (error) {
        console.error("Error checking access:", error);
        router.push("/sign-in");
      }
    };
    checkAccess();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const searchResults = await performSearch();
      setResults(searchResults);
      toast({
        title: "Search Complete",
        description: `Found ${searchResults.length} results`,
      });
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    const queries = [];
    const searchTerm = searchQuery.toLowerCase();

    // Build queries based on search type
    if (searchType === "all" || searchType === "events") {
      const eventsPromise = databases.listDocuments(
        databaseId,
        eventCollectionId,
        [Query.equal("isArchived", false)]
      );
      queries.push(eventsPromise);
    }

    const results = await Promise.all(queries);
    const allResults = results.flatMap((result) => result.documents);

    // Filter results client-side
    return allResults.filter((item) => {
      if (searchType === "events") {
        return (
          item.eventName?.toLowerCase().includes(searchTerm) ||
          item.eventType?.toLowerCase().includes(searchTerm) ||
          item.eventVenue?.toLowerCase().includes(searchTerm)
        );
      }
      return true;
    });
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Search</CardTitle>
          <CardDescription>
            Search across events and participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Term</Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter search term..."
                className="w-full"
              />
            </div>
            <div className="w-48">
              <Label htmlFor="searchType">Search In</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger id="searchType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="events">Events Only</SelectItem>
                  <SelectItem value="participants">
                    Participants Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="mb-[2px]"
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {results.length} matching results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.$id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <h3 className="font-semibold">{result.eventName}</h3>
                  <p className="text-sm text-gray-600">
                    {result.eventType} - {result.eventVenue}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
