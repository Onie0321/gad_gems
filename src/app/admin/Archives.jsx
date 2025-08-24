"use auth";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  db,
  COLLECTIONS,
  getDocs,
  query,
  collection,
  where,
  orderBy,
} from "@/lib/firebase";

export default function Archives() {
  const [loading, setLoading] = useState(true);
  const [academicPeriods, setAcademicPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [archivedEvents, setArchivedEvents] = useState([]);

  useEffect(() => {
    fetchAcademicPeriods();
  }, []);

  useEffect(() => {
          if (selectedPeriod) {
        fetchArchivedEvents(selectedPeriod.id);
      }
  }, [selectedPeriod]);

  const fetchAcademicPeriods = async () => {
    try {
      const response = await getDocs(
        query(
          collection(db, COLLECTIONS.ACADEMIC_PERIODS),
          where("isActive", "==", false),
          orderBy("createdAt", "desc")
        )
      );
      const periods = response.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setAcademicPeriods(periods);
      if (periods.length > 0) {
        setSelectedPeriod(periods[0]);
      }
    } catch (error) {
      console.error("Error fetching academic periods:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedEvents = async (periodId) => {
    try {
      setLoading(true);
      const eventsResponse = await getDocs(
        query(
          collection(db, COLLECTIONS.EVENTS),
          where("academicPeriodId", "==", periodId),
          where("isArchived", "==", true),
          orderBy("eventDate", "desc")
        )
      );

      const events = eventsResponse.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      // Fetch participants for each event
      const eventsWithParticipants = await Promise.all(
        events.map(async (event) => {
          const participantsResponse = await getDocs(
            query(
              collection(db, COLLECTIONS.STUDENTS),
              where("eventId", "==", event.id),
              where("isArchived", "==", true),
              where("academicPeriodId", "==", periodId)
            )
          );

          const participants = participantsResponse.docs.map(doc => ({ ...doc.data(), id: doc.id }));

          return {
            ...event,
            participants: participants,
          };
        })
      );

      setArchivedEvents(eventsWithParticipants);
    } catch (error) {
      console.error("Error fetching archived events:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Archives</CardTitle>
          <CardDescription>
            View past academic periods and their events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Select
              value={selectedPeriod?.id}
              onValueChange={(value) => {
                const period = academicPeriods.find((p) => p.id === value);
                setSelectedPeriod(period);
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select academic period" />
              </SelectTrigger>
              <SelectContent>
                {academicPeriods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.schoolYear} - {period.periodType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPeriod && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Events for {selectedPeriod.schoolYear} -{" "}
                {selectedPeriod.periodType}
              </h3>

              {archivedEvents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">
                        Participants
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {archivedEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.eventName}</TableCell>
                        <TableCell>
                          {format(new Date(event.eventDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>{event.eventVenue}</TableCell>
                        <TableCell>{event.eventType}</TableCell>
                        <TableCell className="text-center">
                          {event.participants.length}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-gray-500">
                  No archived events found for this period
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
