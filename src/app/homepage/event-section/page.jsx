"use client";

import React, { useState, useEffect } from "react";
import { databases, databaseId, eventCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { EventSearch } from "./EventSearch";

export default function EventSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          eventCollectionId,
          [
            Query.equal("isArchived", false),
            Query.equal("showOnHomepage", true),
            Query.orderDesc("eventDate"),
          ]
        );

        // Get only the 3 most recent events
        const recentEvents = response.documents.slice(0, 3);
        setEvents(recentEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleSearchResults = (results) => {
    setEvents(results);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Upcoming Events
        </h2>

        <div className="mb-8">
          <EventSearch onSearchResults={handleSearchResults} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <Card key={event.$id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  {event.eventName}
                </CardTitle>
                <p className="text-sm text-gray-500">
                  {format(new Date(event.eventDate), "MMMM d, yyyy")}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {event.eventDescription}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {event.eventType}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {event.eventVenue}
                  </span>
                </div>
                <Link href={`/events/${event.$id}`}>
                  <Button className="w-full">View Details</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No events found. Please try a different search term.
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/events">
            <Button variant="outline">View All Events</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
