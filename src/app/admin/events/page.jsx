"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventParticipantLog from "./event-participant-log copy/page";
import EventAnalysis from "./event-analysis/page";
import { SearchFilter } from "./search/page";
import { useState, useEffect } from "react";
import { getCurrentAcademicPeriod, databases } from "@/lib/appwrite";
import { Query } from "appwrite";

export default function EventManagementSystem() {
  const [currentPeriod, setCurrentPeriod] = useState(null);

  useEffect(() => {
    const loadCurrentPeriod = async () => {
      const period = await getCurrentAcademicPeriod();
      setCurrentPeriod(period);
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
