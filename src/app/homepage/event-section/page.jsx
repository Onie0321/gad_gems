"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { getEvents } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    async function fetchEvents() {
      try {
        const fetchedEvents = [
          {
            eventName: "Gender Equality Workshop",
            eventDate: "2024-05-15",
            eventCategory: "Workshop",
            eventVenue: "Main Hall",
          },
          {
            eventName: "Women in Tech Conference",
            eventDate: "2024-06-02",
            eventCategory: "Conference",
            eventVenue: "Tech Center",
          },
          {
            eventName: "LGBTQ+ Rights Seminar",
            eventDate: "2024-06-20",
            eventCategory: "Seminar",
            eventVenue: "Community Center",
          },
        ];
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    }
    fetchEvents();
  }, []);

  const sortedEvents = [...events].sort((a, b) => {
    if (sortBy === "date") return new Date(a.eventDate) - new Date(b.eventDate);
    if (sortBy === "location") return a.eventVenue.localeCompare(b.eventVenue);
    if (sortBy === "category")
      return a.eventCategory.localeCompare(b.eventCategory);
    return 0;
  });

  return (
    <section id="events" className="py-12">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8">Upcoming Events</h2>
        <div className="mb-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={sortBy} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="location">Sort by Location</SelectItem>
              <SelectItem value="category">Sort by Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map((event, index) => (
            <EventCard key={index} {...event} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EventCard({ eventName, eventDate, eventCategory, eventVenue, t }) {
  return (
    <Card className="p-4 rounded-lg shadow-lg transition-transform duration-300 hover:scale-105">
      <CardContent>
        <div className="text-sm font-semibold uppercase mb-2">
          {eventCategory}
        </div>
        <h3 className="text-lg font-bold mb-1">{eventName}</h3>
        <p className="text-sm mb-3">{eventDate}</p>
        <p className="text-sm">{eventVenue}</p>
        <Button className="mt-4" variant="outline">
          RSVP
        </Button>
      </CardContent>
    </Card>
  );
}
