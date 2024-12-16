"use client";

import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from 'lucide-react';
import { getEvents, getParticipants, databases, databaseId, eventCollectionId, participantCollectionId } from "@/lib/appwrite";
import { Query } from 'appwrite';

const schools = [
  { name: "School of Accountancy and Business Management", logo: "/logos/sabm.png", color: "#4299E1", code: "SABM" },
  { name: "School of Agricultural Science", logo: "/logos/sas.png", color: "#48BB78", code: "SAS" },
  { name: "School of Arts and Sciences", logo: "/logos/sarts.png", color: "#ED8936", code: "SARTS" },
  { name: "School of Education", logo: "/logos/sed.png", color: "#9F7AEA", code: "SED" },
  { name: "School of Engineering", logo: "/logos/se.png", color: "#F56565", code: "SE" },
  { name: "School of Fisheries and Oceanic Science", logo: "/logos/sfos.png", color: "#38B2AC", code: "SFOS" },
  { name: "School of Forestry and Environmental Sciences", logo: "/logos/sfes.png", color: "#68D391", code: "SFES" },
  { name: "School of Industrial Technology", logo: "/logos/sit.png", color: "#F6AD55", code: "SIT" },
  { name: "School of Information Technology", logo: "/logos/sict.png", color: "#4FD1C5", code: "SICT" },
];

export function SchoolsSection() {
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [participantStats, setParticipantStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSchool) {
      fetchSchoolData(selectedSchool.code);
    }
  }, [selectedSchool]);

  const fetchSchoolData = async (schoolCode) => {
    setLoading(true);
    try {
      // Fetch events for the selected school
      const eventsResponse = await databases.listDocuments(
        databaseId,
        eventCollectionId, // your events collection ID
      );

      // Fetch participants for the selected school
      const participantsResponse = await databases.listDocuments(
        databaseId,
        participantCollectionId, // your participants collection ID
        [Query.equal('school', schoolCode)]
      );

      setEvents(eventsResponse.documents);
      setParticipants(participantsResponse.documents);

      // Calculate statistics
      const stats = calculateParticipantStats(participantsResponse.documents);
      setParticipantStats(stats);

    } catch (error) {
      console.error('Error fetching school data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateParticipantStats = (participants) => {
    const totalParticipants = participants.length;
    const totalMales = participants.filter(p => p.gender === 'Male').length;
    const totalFemales = participants.filter(p => p.gender === 'Female').length;

    return {
      totalParticipants,
      totalMales,
      totalFemales,
    };
  };

  const filteredEvents = events.filter(event =>
    event.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.eventVenue?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Schools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schools.map((school) => (
          <motion.div
            key={school.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedSchool(school)}
          >
            <Card 
              className={`cursor-pointer overflow-hidden rounded-lg ${
                selectedSchool?.code === school.code ? 'ring-2 ring-blue-500' : ''
              }`} 
              style={{ backgroundColor: school.color }}
            >
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <img src={school.logo} alt={school.name} className="w-12 h-12 object-contain" />
                <CardTitle className="text-white text-lg">{school.name}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>

      {selectedSchool && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{selectedSchool.name} Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Participant Statistics */}
              {participantStats && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Total Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{participantStats.totalParticipants}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Male</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{participantStats.totalMales}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Female</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{participantStats.totalFemales}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Events Section */}
              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-xl font-semibold">Events</h3>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead>Participants</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                        </TableRow>
                      ) : filteredEvents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">No events found</TableCell>
                        </TableRow>
                      ) : (
                        filteredEvents.map((event) => (
                          <TableRow key={event.$id}>
                            <TableCell>{event.eventName}</TableCell>
                            <TableCell>{new Date(event.eventDate).toLocaleDateString()}</TableCell>
                            <TableCell>{event.eventVenue}</TableCell>
                            <TableCell>{event.participantCount || 0}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

