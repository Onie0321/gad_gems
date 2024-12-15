"use client";

import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from 'lucide-react';
import { getEvents, getParticipants } from "@/lib/appwrite";

const schools = [
  { name: "School of Accountancy and Business Management", logo: "/logos/sabm.png", color: "#4299E1" },
  { name: "School of Agricultural Science", logo: "/logos/sas.png", color: "#48BB78" },
  { name: "School of Arts and Sciences", logo: "/logos/sarts.png", color: "#ED8936" },
  { name: "School of Education", logo: "/logos/sed.png", color: "#9F7AEA" },
  { name: "School of Engineering", logo: "/logos/se.png", color: "#F56565" },
  { name: "School of Fisheries and Oceanic Science", logo: "/logos/sfos.png", color: "#38B2AC" },
  { name: "School of Forestry and Environmental Sciences", logo: "/logos/sfes.png", color: "#68D391" },
  { name: "School of Industrial Technology", logo: "/logos/sit.png", color: "#F6AD55" },
  { name: "School of Information Technology", logo: "/logos/sict.png", color: "#4FD1C5" },
];

export function SchoolsSection() {
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [events, setEvents] = useState([]);
  const [participantStats, setParticipantStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (selectedSchool) {
      getEvents(selectedSchool.name).then(setEvents);
      getParticipants(selectedSchool.name).then(setParticipantStats);
    }
  }, [selectedSchool]);

  const filteredEvents = events.filter(event =>
    event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.eventVenue.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Card className="cursor-pointer overflow-hidden rounded-lg" style={{ backgroundColor: school.color }}>
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
              <div className="flex justify-between">
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event, index) => (
                      <TableRow key={index}>
                        <TableCell>{event.eventName}</TableCell>
                        <TableCell>{event.eventDate}</TableCell>
                        <TableCell>{event.eventVenue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              {participantStats && (
                <div className="mt-4">
                  <h3 className="text-xl font-semibold mb-2">Participants</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Total</CardTitle>
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
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

