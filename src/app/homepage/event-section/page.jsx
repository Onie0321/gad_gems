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
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  Calendar,
  Sparkles,
} from "lucide-react";
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
import { motion } from "framer-motion";

export default function RecentEvents() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState([]);
  const [visibleEvents, setVisibleEvents] = useState(3);

  useEffect(() => {
    const fetchEvents = async () => {
      console.log("🔍 [Events] Starting to fetch events...");
      console.log("🔍 [Events] Database ID:", databaseId);
      console.log("🔍 [Events] Collection ID:", eventCollectionId);
      console.log(
        "🔍 [Events] Current URL:",
        typeof window !== "undefined" ? window.location.origin : "Server-side"
      );

      try {
        console.log("🔍 [Events] Making database query...");
        const response = await databases.listDocuments(
          databaseId,
          eventCollectionId,
          [Query.equal("showOnHomepage", true), Query.orderDesc("eventDate")]
        );

        console.log("✅ [Events] Query successful:", {
          total: response.total,
          documents: response.documents.length,
        });

        // Transform the data to match your component's expectations
        const formattedEvents = response.documents.map((event) => ({
          id: event.$id,
          name: event.eventName,
          description: event.eventDescription || "",
          date: event.eventDate,
          location: event.eventVenue,
          attendees: event.participants?.length || 0,
        }));

        console.log(
          "✅ [Events] Events formatted successfully:",
          formattedEvents.length
        );
        setEvents(formattedEvents);
      } catch (error) {
        console.error("❌ [Events] Error fetching events:", {
          message: error.message,
          code: error.code,
          type: error.type,
          response: error.response,
        });
      }
    };

    setMounted(true);
    fetchEvents();
  }, []);

  const loadMore = () => {
    setVisibleEvents((prevVisible) => prevVisible + 3);
  };

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-pulse space-y-8 w-full max-w-6xl">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-48 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const NoEventsDisplay = () => (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 rounded-2xl">
      <div className="relative w-24 h-24 mb-6"></div>
      <h3 className="text-2xl font-semibold text-gray-700 mb-2">
        No Events Currently
      </h3>
      <p className="text-gray-500 text-center max-w-md">
        Stay tuned! New events will be posted here soon. Check back later for
        upcoming activities and programs.
      </p>
    </div>
  );

  return (
    <section
      className="py-16 bg-gradient-to-br from-white via-violet-50/30 to-blue-50/30"
      id="events"
    >
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="w-8 h-8 text-violet-600" />
            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600">
              Recent Events
            </h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our latest activities and programs promoting gender
            equality and inclusive development.
          </p>
        </motion.div>

        {events.length === 0 ? (
          <NoEventsDisplay />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.slice(0, visibleEvents).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="group h-full hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 ring-1 ring-gray-200/50">
                    {event.imageUrl && (
                      <div className="relative h-48 overflow-hidden rounded-t-xl">
                        <Image
                          src={event.imageUrl}
                          alt={event.name}
                          fill
                          className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold line-clamp-2">
                        {event.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600 line-clamp-3">
                        {event.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center text-violet-600">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          <span className="text-sm">{event.date}</span>
                        </div>
                        <div className="flex items-center text-blue-600">
                          <MapPinIcon className="mr-2 h-4 w-4" />
                          <span className="text-sm">{event.location}</span>
                        </div>
                        <div className="flex items-center text-emerald-600">
                          <UsersIcon className="mr-2 h-4 w-4" />
                          <span className="text-sm">
                            {event.attendees} attendees
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full bg-gradient-to-r from-violet-50 to-blue-50 hover:from-violet-100 hover:to-blue-100 border-violet-200"
                          >
                            View Details
                          </Button>
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
                </motion.div>
              ))}
            </div>
            {visibleEvents < events.length && (
              <div className="mt-12 text-center">
                <Button
                  onClick={loadMore}
                  className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white px-8 py-2"
                >
                  Load More Events
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
