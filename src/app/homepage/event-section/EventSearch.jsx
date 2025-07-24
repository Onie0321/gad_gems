"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { databases, databaseId, eventCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";

export function EventSearch({ onSearchResults }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [eventType, setEventType] = useState("all");
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
    const queries = [Query.equal("isArchived", false)];

    if (eventType !== "all") {
      queries.push(Query.equal("eventType", eventType));
    }

    const response = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      queries
    );

    const searchTerm = searchQuery.toLowerCase();
    return response.documents.filter((event) => {
      return (
        event.eventName?.toLowerCase().includes(searchTerm) ||
        event.eventDescription?.toLowerCase().includes(searchTerm) ||
        event.eventVenue?.toLowerCase().includes(searchTerm)
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Events</Label>
          <div className="relative">
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event name, description, or venue..."
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
        <div className="w-full sm:w-48">
          <Label htmlFor="eventType">Event Type</Label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger id="eventType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="Academic">Academic</SelectItem>
              <SelectItem value="Non-Academic">Non-Academic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
