"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarIcon, MapPinIcon, UsersIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { databases, databaseId, eventCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";

export default function RecentEvents() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState([]);
  const [visibleEvents, setVisibleEvents] = useState(3);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          eventCollectionId,
          [Query.equal("showOnHomepage", true), Query.orderDesc("eventDate")]
        );

        // Transform the data to match your component's expectations
        const formattedEvents = response.documents.map((event) => ({
          id: event.$id,
          name: event.eventName,
          description: event.eventDescription || "",
          date: event.eventDate,
          location: event.eventVenue,
          attendees: event.participants?.length || 0,
          imageUrl: event.imageUrl || "/placeholder.svg?height=200&width=300",
        }));

        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    setMounted(true);
    fetchEvents();
  }, []);

  const loadMore = () => {
    setVisibleEvents((prevVisible) => prevVisible + 3);
  };

  if (!mounted) {
    return null; // or a loading skeleton
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Recent Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.slice(0, visibleEvents).map((event) => (
            <Card key={event.id} className="flex flex-col">
              {event.imageUrl && (
                <div className="relative w-full h-48">
                  <Image
                    src={event.imageUrl}
                    alt={event.name}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground mb-4">
                  {event.description}
                </p>
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPinIcon className="mr-2 h-4 w-4" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <UsersIcon className="mr-2 h-4 w-4" />
                  <span>{event.attendees} attendees</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">View Table and Graph</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{event.name} - Details</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="table" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="table">Table</TabsTrigger>
                        <TabsTrigger value="graph">Graph</TabsTrigger>
                      </TabsList>
                      <TabsContent value="table">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Event Name</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Attendees</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">
                                {event.name}
                              </TableCell>
                              <TableCell>{event.date}</TableCell>
                              <TableCell>{event.location}</TableCell>
                              <TableCell>{event.attendees}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TabsContent>
                      <TabsContent value="graph">
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[event]}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="attendees" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
        {visibleEvents < events.length && (
          <div className="mt-8 text-center">
            <Button onClick={loadMore}>See More</Button>
          </div>
        )}
      </div>
    </section>
  );
}
