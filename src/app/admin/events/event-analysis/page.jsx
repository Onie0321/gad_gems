"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { listEvents } from "@/lib/appwrite";
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
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function EventAnalysis() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    averageParticipants: 0,
    totalEvents: 0,
    genderStats: {
      male: 0,
      female: 0,
      intersex: 0
    },
    eventTypes: [],
    participantsByEvent: [],
    participantsByGender: [],
    participantsBySchool: [],
  });

  const GENDER_COLORS = {
    Male: '#2196F3',
    Female: '#E91E63',
    Intersex: '#FFC107'
  };

  // Extended color palette for schools
  const SCHOOL_COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD",
    "#D4A5A5", "#9B59B6", "#3498DB", "#F1C40F", "#E74C3C"
  ];

  useEffect(() => {
    const fetchEventStats = async () => {
      try {
        setLoading(true);
        const events = await listEvents();

        // Calculate gender counts across all events
        const genderStats = events.reduce((acc, event) => {
          event.participants?.forEach(participant => {
            const gender = participant.sex.toLowerCase();
            acc[gender] = (acc[gender] || 0) + 1;
          });
          return acc;
        }, { male: 0, female: 0, intersex: 0 });

        // Calculate basic stats
        const totalEvents = events.length;
        const totalParticipants = events.reduce((sum, event) => 
          sum + (event.participants?.length || 0), 0);
        const averageParticipants = totalEvents > 0
          ? (totalParticipants / totalEvents).toFixed(1)
          : 0;

        // Process participants by event with gender breakdown
        const participantsByEvent = events.map(event => {
          const genderCounts = event.participants?.reduce((acc, participant) => {
            const gender = participant.sex.toLowerCase();
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
          }, { male: 0, female: 0, intersex: 0 }) || { male: 0, female: 0, intersex: 0 };

          return {
            name: event.eventName,
            male: genderCounts.male,
            female: genderCounts.female,
            intersex: genderCounts.intersex,
            total: event.participants?.length || 0
          };
        });

        // Process participants by school with gender breakdown
        const schoolData = events.reduce((acc, event) => {
          event.participants?.forEach(participant => {
            const school = participant.school;
            const gender = participant.sex.toLowerCase();

            if (!acc[school]) {
              acc[school] = { male: 0, female: 0, intersex: 0, total: 0 };
            }
            acc[school][gender]++;
            acc[school].total++;
          });
          return acc;
        }, {});

        const participantsBySchool = Object.entries(schoolData).map(([name, counts]) => ({
          name,
          male: counts.male,
          female: counts.female,
          intersex: counts.intersex,
          total: counts.total
        })).sort((a, b) => b.total - a.total); // Sort by total participants

        // Process event types
        const eventTypeCount = events.reduce((acc, event) => {
          acc[event.eventType] = (acc[event.eventType] || 0) + 1;
          return acc;
        }, {});

        const eventTypes = Object.entries(eventTypeCount).map(([name, value]) => ({
          name,
          value
        }));

        setStats({
          totalParticipants,
          averageParticipants,
          totalEvents,
          genderStats,
          eventTypes,
          participantsByEvent,
          participantsBySchool,
        });
      } catch (error) {
        console.error("Error fetching event statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventStats();
  }, []);

  return (
    <div className="space-y-8 p-6 bg-gray-50">
      {/* Stats Cards with Enhanced Design */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
            <CardTitle className="text-lg font-bold text-blue-800">Total Events</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.totalEvents}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS.Male }}></div>
                  <span>Male: {stats.genderStats.male}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS.Female }}></div>
                  <span>Female: {stats.genderStats.female}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS.Intersex }}></div>
                  <span>Intersex: {stats.genderStats.intersex}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.totalParticipants}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS.Male }}></div>
                  <span>Male: {stats.genderStats.male}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS.Female }}></div>
                  <span>Female: {stats.genderStats.female}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS.Intersex }}></div>
                  <span>Intersex: {stats.genderStats.intersex}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Participants/Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.averageParticipants}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS.Male }}></div>
                  <span>Male: {stats.genderStats.male}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS.Female }}></div>
                  <span>Female: {stats.genderStats.female}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS.Intersex }}></div>
                  <span>Intersex: {stats.genderStats.intersex}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Single Column Layout for Charts */}
      <div className="space-y-6">
        {/* Participants by Event - Interactive Bar Chart */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
            <CardTitle className="text-lg font-bold text-purple-800">
              Participants by Event
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.participantsByEvent}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                    }}
                  />
                  <Legend />
                  <Bar dataKey="male" name="Male" fill={GENDER_COLORS.Male} stackId="a" />
                  <Bar dataKey="female" name="Female" fill={GENDER_COLORS.Female} stackId="a" />
                  <Bar dataKey="intersex" name="Intersex" fill={GENDER_COLORS.Intersex} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* School Distribution Overview - Now with Two Pie Charts */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-lg">
            <CardTitle className="text-lg font-bold text-green-800">
              School Distribution Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-8">
              {/* Total Participants by School Pie Chart */}
              <div className="h-[400px]">
                <h3 className="text-center font-semibold text-gray-700 mb-4">
                  Total Participants by School
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.participantsBySchool}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={140}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="total"
                      label={({ name, value, percent }) => 
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {stats.participantsBySchool.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SCHOOL_COLORS[index % SCHOOL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`Total: ${value}`, name]}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                      }}
                    />
                    <Legend 
                      layout="vertical" 
                      align="right" 
                      verticalAlign="middle"
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Gender Distribution by School Pie Chart */}
              <div className="h-[400px]">
                <h3 className="text-center font-semibold text-gray-700 mb-4">
                  Gender Distribution by School
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.participantsBySchool.map(school => [
                        { name: `${school.name} (Male)`, value: school.male, color: GENDER_COLORS.Male },
                        { name: `${school.name} (Female)`, value: school.female, color: GENDER_COLORS.Female },
                        { name: `${school.name} (Intersex)`, value: school.intersex, color: GENDER_COLORS.Intersex }
                      ]).flat()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={140}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value, percent }) => 
                        value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : ''
                      }
                    >
                      {stats.participantsBySchool.map(school => [
                        <Cell key={`${school.name}-male`} fill={GENDER_COLORS.Male} />,
                        <Cell key={`${school.name}-female`} fill={GENDER_COLORS.Female} />,
                        <Cell key={`${school.name}-intersex`} fill={GENDER_COLORS.Intersex} />
                      ]).flat()}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`Count: ${value}`, name]}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                      }}
                    />
                    <Legend 
                      layout="vertical" 
                      align="right" 
                      verticalAlign="middle"
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed School Distribution Table */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-t-lg">
            <CardTitle className="text-lg font-bold text-indigo-800">
              Detailed School Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">School</TableHead>
                    <TableHead className="text-right font-bold" style={{ color: GENDER_COLORS.Male }}>Male</TableHead>
                    <TableHead className="text-right font-bold" style={{ color: GENDER_COLORS.Female }}>Female</TableHead>
                    <TableHead className="text-right font-bold" style={{ color: GENDER_COLORS.Intersex }}>Intersex</TableHead>
                    <TableHead className="text-right font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.participantsBySchool.map((school, index) => (
                    <TableRow 
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-medium">{school.name || 'Not Specified'}</TableCell>
                      <TableCell className="text-right">{school.male || 0}</TableCell>
                      <TableCell className="text-right">{school.female || 0}</TableCell>
                      <TableCell className="text-right">{school.intersex || 0}</TableCell>
                      <TableCell className="text-right font-bold">{school.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
