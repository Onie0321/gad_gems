"use client";

import React, { useState, useEffect } from "react";
import {
  databases,
  databaseId,
  eventCollectionId,
  participantCollectionId,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import { LoadingAnimation } from "@/components/loading/loading-animation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

const chartColors = {
  type: [
    "#FF6B6B", // Coral Red
    "#4ECDC4", // Turquoise
    "#45B7D1", // Sky Blue
    "#96CEB4", // Sage Green
    "#FFEEAD", // Cream Yellow
    "#D4A5A5", // Dusty Rose
    "#9B5DE5", // Purple
    "#F15BB5", // Pink
    "#00BBF9", // Bright Blue
    "#00F5D4", // Mint
  ],
  venue: [
    "#FF9F1C", // Orange
    "#2EC4B6", // Teal
    "#E71D36", // Red
    "#662E9B", // Purple
    "#43AA8B", // Green
    "#F9C74F", // Yellow
    "#577590", // Blue
    "#8338EC", // Violet
    "#FF006E", // Pink
    "#3A86FF", // Royal Blue
  ],
};

const EventAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventData, setEventData] = useState([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    fetchAllEventData();
  }, []);

  const fetchAllEventData = async () => {
    try {
      setLoading(true);

      // Fetch all events
      const eventsResponse = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [Query.orderDesc("eventDate")]
      );

      const events = eventsResponse.documents;
      setTotalEvents(events.length);

      // Process events with their participants
      const processedEvents = events.map((event) => ({
        ...event,
        participantCount: event.participants?.length || 0,
        name: event.eventName,
        venue: event.eventVenue,
        type: event.eventType,
        category: event.eventCategory,
        duration: event.numberOfHours,
        status: event.approvalStatus,
      }));

      const totalParticipantsCount = processedEvents.reduce(
        (sum, event) => sum + event.participantCount,
        0
      );

      setTotalParticipants(totalParticipantsCount);
      setEventData(processedEvents);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching event data:", err);
      setError("Failed to load event data. Please try again.");
      setLoading(false);
    }
  };

  const processEventCategories = () => {
    const categoryCount = eventData.reduce((acc, event) => {
      const category = event.eventCategory || "Uncategorized";
      acc[category] = {
        count: (acc[category]?.count || 0) + 1,
        participants:
          (acc[category]?.participants || 0) + event.participantCount,
      };
      return acc;
    }, {});

    return Object.entries(categoryCount).map(([name, data]) => ({
      name,
      value: data.count,
      participants: data.participants,
    }));
  };

  const processEventTypes = () => {
    const typeCount = eventData.reduce((acc, event) => {
      const type = event.eventType || "Unspecified";
      acc[type] = {
        count: (acc[type]?.count || 0) + 1,
        participants: (acc[type]?.participants || 0) + event.participantCount,
      };
      return acc;
    }, {});

    return Object.entries(typeCount).map(([name, data]) => ({
      name,
      value: data.count,
      participants: data.participants,
    }));
  };

  const processVenueData = () => {
    const venueCount = eventData.reduce((acc, event) => {
      const venue = event.eventVenue || "Unspecified";
      acc[venue] = {
        count: (acc[venue]?.count || 0) + 1,
        participants: (acc[venue]?.participants || 0) + event.participantCount,
      };
      return acc;
    }, {});

    return Object.entries(venueCount).map(([name, data]) => ({
      name,
      value: data.count,
      participants: data.participants,
    }));
  };

  const processDurationData = () => {
    return eventData.map((event) => ({
      name: event.eventName,
      duration: event.numberOfHours,
      participantCount: event.participantCount,
      timeFrom: new Date(event.eventTimeFrom).toLocaleTimeString(),
      timeTo: new Date(event.eventTimeTo).toLocaleTimeString(),
      date: new Date(event.eventDate).toLocaleDateString(),
    }));
  };

  if (loading) {
    return <LoadingAnimation message="Loading event analysis..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        <p>{error}</p>
        <button
          onClick={() => fetchAllEventData()}
          className="mt-2 px-4 py-2 bg-red-100 rounded-md hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  const categoryData = processEventCategories();
  const typeData = processEventTypes();
  const venueData = processVenueData();
  const durationData = processDurationData();

  return (
    <div className="space-y-8">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Event Analysis Summary</CardTitle>
          <CardDescription>Overall statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold">Total Events</h3>
              <p className="text-2xl">{totalEvents}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold">Total Participants</h3>
              <p className="text-2xl">{totalParticipants}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold">Average Participants/Event</h3>
              <p className="text-2xl">
                {totalEvents ? (totalParticipants / totalEvents).toFixed(1) : 0}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold">Approved Events</h3>
              <p className="text-2xl">
                {
                  eventData.filter((e) => e.approvalStatus === "approved")
                    .length
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Event Category Distribution</CardTitle>
          <CardDescription>Number of events by category</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(${index * 45}, 70%, 50%)`}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryData.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Event Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Event Type Distribution</CardTitle>
          <CardDescription>Number of events by type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [`${value} events`, name]}
                labelStyle={{ color: "#374151" }}
              />
              <Legend />
              <Bar dataKey="value" name="Events">
                {typeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={chartColors.type[index % chartColors.type.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Participants</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typeData.map((item, index) => (
                <TableRow key={item.name}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            chartColors.type[index % chartColors.type.length],
                        }}
                      />
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell>{item.value}</TableCell>
                  <TableCell>{item.participants}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Venue Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Event Venue Distribution</CardTitle>
          <CardDescription>Number of events by venue</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={venueData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip
                formatter={(value, name) => [`${value} events`, name]}
                labelStyle={{ color: "#374151" }}
              />
              <Legend />
              <Bar dataKey="value" name="Events">
                {venueData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={chartColors.venue[index % chartColors.venue.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venue</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Participants</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venueData.map((item, index) => (
                <TableRow key={item.name}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            chartColors.venue[index % chartColors.venue.length],
                        }}
                      />
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell>{item.value}</TableCell>
                  <TableCell>{item.participants}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Duration Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Event Duration & Participation Analysis</CardTitle>
          <CardDescription>
            Duration of events and participant count
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={durationData}>
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="duration"
                stroke="hsl(250, 70%, 50%)"
                name="Duration (hours)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="participantCount"
                stroke="hsl(300, 70%, 50%)"
                name="Participants"
              />
            </LineChart>
          </ResponsiveContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Duration (hours)</TableHead>
                <TableHead>Participants</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {durationData.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.duration}</TableCell>
                  <TableCell>{item.participantCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventAnalysis;
