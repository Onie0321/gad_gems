"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getEvents, getParticipants } from "@/lib/appwrite"; // Import Appwrite functions

const COLORS = ["#257180", "#F2E5BF", "#FD8B51", "#CB6040"];

export default function ReportsAnalytics() {
  const [selectedMetric, setSelectedMetric] = useState("genderBalance");
  const [selectedTimeframe, setSelectedTimeframe] = useState("5-years");
  const [selectedKPI, setSelectedKPI] = useState("Gender Parity");
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventMetrics, setEventMetrics] = useState(null);
  const [longitudinalData, setLongitudinalData] = useState([]);
  const [kpiData, setKpiData] = useState([]);

  useEffect(() => {
    fetchEvents();
    fetchLongitudinalData();
    fetchKPIData();
  }, []);

  const fetchEvents = async () => {
    try {
      const fetchedEvents = await getEvents();
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchEventMetrics = async (eventId) => {
    try {
      const participants = await getParticipants(eventId);
      const metrics = calculateEventMetrics(participants);
      setEventMetrics(metrics);
    } catch (error) {
      console.error("Error fetching event metrics:", error);
    }
  };

  const calculateEventMetrics = (participants) => {
    const totalParticipants = participants.length;
    const genderCounts = participants.reduce((acc, p) => {
      acc[p.sex] = (acc[p.sex] || 0) + 1;
      return acc;
    }, {});
    const ageCounts = participants.reduce((acc, p) => {
      const ageGroup = getAgeGroup(p.age);
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {});

    return {
      totalParticipants,
      genderBalance: `${Math.round(
        ((genderCounts["Male"] || 0) / totalParticipants) * 100
      )}% Male, ${Math.round(
        ((genderCounts["Female"] || 0) / totalParticipants) * 100
      )}% Female`,
      ageDistribution: Object.entries(ageCounts)
        .map(
          ([group, count]) =>
            `${group}: ${Math.round((count / totalParticipants) * 100)}%`
        )
        .join(", "),
    };
  };

  const getAgeGroup = (age) => {
    if (age <= 25) return "18-25";
    if (age <= 35) return "26-35";
    return "36+";
  };

  const fetchLongitudinalData = async () => {
    // This would typically involve fetching historical data from Appwrite
    // For now, we'll use mock data
    setLongitudinalData([
      {
        year: 2019,
        genderBalance: 0.8,
        ageDistribution: 0.6,
        ethnicDiversity: 0.4,
      },
      {
        year: 2020,
        genderBalance: 0.85,
        ageDistribution: 0.65,
        ethnicDiversity: 0.45,
      },
      {
        year: 2021,
        genderBalance: 0.9,
        ageDistribution: 0.7,
        ethnicDiversity: 0.5,
      },
      {
        year: 2022,
        genderBalance: 0.95,
        ageDistribution: 0.75,
        ethnicDiversity: 0.55,
      },
      {
        year: 2023,
        genderBalance: 1,
        ageDistribution: 0.8,
        ethnicDiversity: 0.6,
      },
    ]);
  };

  const fetchKPIData = async () => {
    // This would typically involve fetching KPI data from Appwrite
    // For now, we'll use mock data
    setKpiData([
      { kpi: "Gender Parity", current: 0.9, target: 1 },
      { kpi: "Minority Representation", current: 0.6, target: 0.8 },
      { kpi: "Youth Engagement", current: 0.7, target: 0.9 },
    ]);
  };

  const handleEventChange = (eventId) => {
    setSelectedEvent(eventId);
    fetchEventMetrics(eventId);
  };

  return (
    <Tabs defaultValue="event-reports" className="space-y-4">
      <TabsList>
        <TabsTrigger value="event-reports">Event Reports</TabsTrigger>
        <TabsTrigger value="longitudinal">Longitudinal Analysis</TabsTrigger>
        <TabsTrigger value="kpis">Goals & KPIs</TabsTrigger>
      </TabsList>
      <TabsContent value="event-reports" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Event Reports</CardTitle>
            <CardDescription>
              Generate detailed reports for each event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select onValueChange={handleEventChange}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.$id} value={event.$id}>
                      {event.eventName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {eventMetrics && (
                <Table>
                  <TableCaption>Event metrics summary</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Participants</TableCell>
                      <TableCell>{eventMetrics.totalParticipants}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Gender Balance</TableCell>
                      <TableCell>{eventMetrics.genderBalance}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Age Distribution</TableCell>
                      <TableCell>{eventMetrics.ageDistribution}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
              <div className="flex space-x-2">
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate PDF Report
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="longitudinal" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Longitudinal Analysis</CardTitle>
            <CardDescription>
              Track demographic changes over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Select onValueChange={(value) => setSelectedMetric(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="genderBalance">
                      Gender Balance
                    </SelectItem>
                    <SelectItem value="ageDistribution">
                      Age Distribution
                    </SelectItem>
                    <SelectItem value="ethnicDiversity">
                      Ethnic Diversity
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={(value) => setSelectedTimeframe(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-year">1 Year</SelectItem>
                    <SelectItem value="3-years">3 Years</SelectItem>
                    <SelectItem value="5-years">5 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={longitudinalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={COLORS[0]}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="kpis" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Goals & KPIs</CardTitle>
            <CardDescription>
              Track progress towards Gender and Development goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select onValueChange={(value) => setSelectedKPI(value)}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select KPI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gender Parity">Gender Parity</SelectItem>
                  <SelectItem value="Minority Representation">
                    Minority Representation
                  </SelectItem>
                  <SelectItem value="Youth Engagement">
                    Youth Engagement
                  </SelectItem>
                </SelectContent>
              </Select>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={kpiData.filter((item) => item.kpi === selectedKPI)}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="kpi" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill={COLORS[0]} name="Current" />
                  <Bar dataKey="target" fill={COLORS[2]} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
