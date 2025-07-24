"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { databases, databaseId, newsCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";

export function NewsSearch({ onSearchResults }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      onSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await performSearch();
      onSearchResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      onSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    const response = await databases.listDocuments(
      databaseId,
      newsCollectionId,
      [Query.equal("isArchived", false)]
    );

    const searchTerm = searchQuery.toLowerCase();
    return response.documents.filter((news) => {
      return (
        news.title?.toLowerCase().includes(searchTerm) ||
        news.description?.toLowerCase().includes(searchTerm)
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex-1">
        <Label htmlFor="search">Search News</Label>
        <div className="relative">
          <Input
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or description..."
            className="w-full pr-10"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-0 top-0 h-full px-3"
            onClick={handleSearch}
            disabled={loading}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
