"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventParticipantLog from "./event-participant-log copy/page";
import EventAnalysis from "./event-analysis/page";
import { SearchFilter } from "./search/page";
import { useState, useEffect } from "react";
import { getCurrentAcademicPeriod, databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Skeleton } from "@/components/ui/skeleton";

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

    const response = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [
        Query.equal("isArchived", false),
        Query.equal("academicPeriodId", currentPeriod.$id),
      ]
    );
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
