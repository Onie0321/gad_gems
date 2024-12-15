import React, { useEffect, useState } from "react";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Cell, XAxis, YAxis, Tooltip } from "recharts";
import { Calendar, Users, PieChartIcon, Users2 } from 'lucide-react';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getEvents,
  getParticipants,
  subscribeToRealTimeUpdates, userCollectionId, databaseId, databases  
} from "@/lib/appwrite";

export default function DashboardOverview() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [genderDistribution, setGenderDistribution] = useState([]);
  const [ageDistribution, setAgeDistribution] = useState([]);
  const [locationDistribution, setLocationDistribution] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchData();

    const unsubscribeEvents = subscribeToRealTimeUpdates("events", fetchData);
    const unsubscribeParticipants = subscribeToRealTimeUpdates(
      "participants",
      fetchData
    );

    return () => {
      unsubscribeEvents();
      unsubscribeParticipants();
    };
  }, []);

  const fetchData = async () => {
    try {
      const eventsData = await getEvents();
      setEvents(eventsData);

      let allParticipants = [];
      for (const event of eventsData) {
        const eventParticipants = await getParticipants(event.$id);
        allParticipants = [...allParticipants, ...eventParticipants];
      }
      setParticipants(allParticipants);

      processData(allParticipants);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        const response = await databases.listDocuments(databaseId, userCollectionId);
        setTotalUsers(response.total);
      } catch (error) {
        console.error("Error fetching total users:", error);
      }
    };

    fetchTotalUsers();
  }, []);

  const processData = (participantsData) => {
    // Process gender distribution
    const genderCount = participantsData.reduce((acc, p) => {
      acc[p.sex] = (acc[p.sex] || 0) + 1;
      return acc;
    }, {});
    setGenderDistribution(
      Object.entries(genderCount).map(([name, value]) => ({ name, value }))
    );

    // Process age distribution
    const ageGroups = {
      "Under 18": 0,
      "18-24": 0,
      "25-34": 0,
      "35-44": 0,
      "45-54": 0,
      "55+": 0,
    };
    participantsData.forEach((p) => {
      const age = parseInt(p.age);
      if (age < 18) ageGroups["Under 18"]++;
      else if (age <= 24) ageGroups["18-24"]++;
      else if (age <= 34) ageGroups["25-34"]++;
      else if (age <= 44) ageGroups["35-44"]++;
      else if (age <= 54) ageGroups["45-54"]++;
      else ageGroups["55+"]++;
    });
    setAgeDistribution(
      Object.entries(ageGroups).map(([age, count]) => ({ age, count }))
    );

    // Process location distribution
    const locationCount = participantsData.reduce((acc, p) => {
      const event = events.find(e => e.$id === p.eventId);
      if (event) {
        acc[event.eventVenue] = (acc[event.eventVenue] || 0) + 1;
      }
      return acc;
    }, {});
    setLocationDistribution(
      Object.entries(locationCount).map(([name, value]) => ({ name, value }))
    );
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              {events.length > 0
                ? `+${events.length} from last month`
                : "No events yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Participants
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participants.length}</div>
            <p className="text-xs text-muted-foreground">
              {participants.length > 0
                ? `+15% from last month`
                : "No participants yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gender Distribution
            </CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={40}
                  >
                    {genderDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? "#8884d8" : index === 1 ? "#82ca9d" : "#ffc658"}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-center space-x-2">
              {genderDistribution.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center">
                  <div
                    className="w-3 h-3 mr-1"
                    style={{ 
                      backgroundColor: index === 0 ? "#8884d8" : index === 1 ? "#82ca9d" : "#ffc658"
                    }}
                  ></div>
                  <span className="text-xs">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Participants</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.slice(0, 3).map((event) => (
                  <TableRow key={event.$id}>
                    <TableCell>{event.eventName}</TableCell>
                    <TableCell>
                      {new Date(event.eventDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{event.eventVenue}</TableCell>
                    <TableCell className="text-center">
                      {event.participants?.length || 0}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          new Date(event.eventDate) < new Date()
                            ? "default"
                            : "outline"
                        }
                      >
                        {new Date(event.eventDate) < new Date()
                          ? "Completed"
                          : "Upcoming"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Demographic Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="age">
              <TabsList>
                <TabsTrigger value="age">Age Distribution</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>
              <TabsContent value="age">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageDistribution}>
                      <XAxis dataKey="age" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="location">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={locationDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {locationDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`hsl(${index * 45}, 70%, 60%)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

