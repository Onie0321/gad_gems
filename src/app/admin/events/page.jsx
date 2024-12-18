"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventParticipantLog from "./event-participant-log copy/page";
import EventAnalysis from "./event-analysis/page";

export default function EventManagementSystem() {
  return (
    <Tabs defaultValue="log" className="w-full mt-4">
      <TabsList>
        <TabsTrigger value="log">Event & Participant Log</TabsTrigger>
        <TabsTrigger value="analysis">Event Analysis</TabsTrigger>
      </TabsList>
      <TabsContent value="log">
        <EventParticipantLog />
      </TabsContent>
      <TabsContent value="analysis">
        <EventAnalysis />
      </TabsContent>
    </Tabs>
  );
}
