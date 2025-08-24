"use auth";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import EventAnalysis from "./events/Event-Analysis";
import { SearchFilter } from "./events/Search";
import { useState, useEffect } from "react";
import { getCurrentAcademicPeriod, db, COLLECTIONS, query, collection, where, getDocs } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import EventParticipantLog from "./events/EventParticipantLog";

export default function EventManagementSystem() {
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrentPeriod = async () => {
      try {
        const period = await getCurrentAcademicPeriod();
        setCurrentPeriod(period);
      } catch (error) {
        console.error("Error loading current period:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCurrentPeriod();
  }, []);

  const fetchEvents = async () => {
    if (!currentPeriod) return;

    const eventsQuery = query(
      collection(db, COLLECTIONS.EVENTS),
      where("isArchived", "==", false),
      where("academicPeriodId", "==", currentPeriod.id)
    );
    const querySnapshot = await getDocs(eventsQuery);
    const eventsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Rest of your code...
  };

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-10 w-[200px]" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[80%]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="log" className="w-full mt-4">
      <TabsList>
        <TabsTrigger value="log">Event & Participant Log</TabsTrigger>
        <TabsTrigger value="analysis">Event Analysis</TabsTrigger>
        <TabsTrigger value="choices">Search</TabsTrigger>
      </TabsList>
      <TabsContent value="log">
        <EventParticipantLog />
      </TabsContent>
      <TabsContent value="analysis">
        <EventAnalysis />
      </TabsContent>
      <TabsContent value="choices">
        <SearchFilter />
      </TabsContent>
    </Tabs>
  );
}
