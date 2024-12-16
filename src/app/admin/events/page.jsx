"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpcomingEvents } from "./upcoming-events/page";
import { PastEvents } from "./past-events/page";
import EventParticipantLog from "./event-participant-log copy/page";
import { EventCalendar } from "./calendar/page";

export default function EventManagementSystem() {
  return (
    <Tabs defaultValue="upcoming" className="w-full mt-4">
      <TabsList>
        <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="past">Past Events</TabsTrigger>
        <TabsTrigger value="log">Event & Participant Log</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming">
        <UpcomingEvents />
      </TabsContent>
      <TabsContent value="calendar">
        <EventCalendar />
      </TabsContent>
      <TabsContent value="past">
        <PastEvents />
      </TabsContent>

      <TabsContent value="log">
        <EventParticipantLog />
      </TabsContent>
    </Tabs>
  );
}
