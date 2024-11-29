"use client";

import { useState, useEffect } from "react";
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
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getEvents, getParticipants } from "@/lib/appwrite"; // Adjust the import path as needed

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function DemographicAnalysis() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("all-time");
  const [demographicData, setDemographicData] = useState({
    ageData: [],
    genderData: [],
    educationData: [],
    genderOverTimeData: [],
    ethnicData: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      fetchDemographicData(selectedEvent, selectedTimeframe);
    }
  }, [selectedEvent, selectedTimeframe, events]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const fetchedEvents = await getEvents();
      setEvents(fetchedEvents);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching events:", error);
      setIsLoading(false);
    }
  };

  const fetchDemographicData = async (eventId, timeframe) => {
    try {
      setIsLoading(true);
      let participants;
      if (eventId === "all") {
        participants = await Promise.all(
          events.map((event) => getParticipants(event.$id))
        );
        participants = participants.flat();
      } else {
        participants = await getParticipants(eventId);
      }

      const ageData = processAgeData(participants);
      const genderData = processGenderData(participants);
      const educationData = processEducationData(participants);
      const genderOverTimeData = processGenderOverTimeData(
        participants,
        timeframe
      );
      const ethnicData = processEthnicData(participants);

      setDemographicData({
        ageData,
        genderData,
        educationData,
        genderOverTimeData,
        ethnicData,
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching demographic data:", error);
      setIsLoading(false);
    }
  };

  const processAgeData = (participants) => {
    const ageGroups = {
      "18-24": 0,
      "25-34": 0,
      "35-44": 0,
      "45-54": 0,
      "55+": 0,
    };

    participants.forEach((participant) => {
      const age = parseInt(participant.age);
      if (age >= 18 && age <= 24) ageGroups["18-24"]++;
      else if (age >= 25 && age <= 34) ageGroups["25-34"]++;
      else if (age >= 35 && age <= 44) ageGroups["35-44"]++;
      else if (age >= 45 && age <= 54) ageGroups["45-54"]++;
      else if (age >= 55) ageGroups["55+"]++;
    });

    return Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
  };

  const processGenderData = (participants) => {
    const genderCount = participants.reduce((acc, participant) => {
      acc[participant.sex] = (acc[participant.sex] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(genderCount).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const processEducationData = (participants) => {
    const educationCount = participants.reduce((acc, participant) => {
      acc[participant.year] = (acc[participant.year] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(educationCount).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const processGenderOverTimeData = (participants, timeframe) => {
    const currentYear = new Date().getFullYear();
    const startYear =
      timeframe === "this-year"
        ? currentYear
        : timeframe === "last-year"
        ? currentYear - 1
        : Math.min(
            ...participants.map((p) => new Date(p.createdAt).getFullYear())
          );

    const years = Array.from(
      { length: currentYear - startYear + 1 },
      (_, i) => startYear + i
    );

    return years.map((year) => {
      const yearParticipants = participants.filter(
        (p) => new Date(p.createdAt).getFullYear() === year
      );
      return {
        year: year.toString(),
        male: yearParticipants.filter((p) => p.sex === "Male").length,
        female: yearParticipants.filter((p) => p.sex === "Female").length,
      };
    });
  };

  const processEthnicData = (participants) => {
    const ethnicCount = participants.reduce((acc, participant) => {
      const group =
        participant.ethnicGroup === "Other"
          ? participant.otherEthnicGroup
          : participant.ethnicGroup;
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(ethnicCount).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    index,
    name,
  }) => {
    const RADIAN = Math.PI / 180;
    const x = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
    const y = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
    const percentage = `${(percent * 100).toFixed(0)}%`;

    if (percent === 0) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#000"
        fontSize="10px"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${
          demographicData.genderData[index]?.name ||
          demographicData.ageData[index]?.name
        } (${percentage})`}
      </text>
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="gender">Gender Representation</TabsTrigger>
        <TabsTrigger value="ethnic">Ethnic Group Analysis</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
      <Select onValueChange={setSelectedEvent} value={selectedEvent}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.$id} value={event.$id}>
                      {event.eventName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              
              <ChartContainer
                config={{
                  name: { label: "Age Group" },
                  value: { label: "Count" },
                }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={demographicData.ageData}
                      cx="50%"
                      cy="50%"
                      labelLine
                      label={renderCustomizedLabel}
                      outerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {demographicData.ageData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gender Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  name: { label: "Gender" },
                  value: { label: "Count" },
                }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={demographicData.genderData}
                      cx="50%"
                      cy="50%"
                      labelLine
                      label={renderCustomizedLabel}
                      outerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {demographicData.genderData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Education Level</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  name: { label: "Education Level" },
                  value: { label: "Count" },
                }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={demographicData.educationData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="value" fill="hsl(var(--chart-1))">
                      {demographicData.educationData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      <TabsContent value="gender" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Gender Representation Insights</CardTitle>
            <CardDescription>
              Track gender-based metrics across events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Select onValueChange={setSelectedEvent} value={selectedEvent}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.$id} value={event.$id}>
                        {event.eventName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={setSelectedTimeframe}
                  value={selectedTimeframe}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-time">All Time</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="last-year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ChartContainer
                config={{
                  male: { label: "Male" },
                  female: { label: "Female" },
                }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={demographicData.genderOverTimeData}>
                    <XAxis dataKey="year" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="male" stroke={COLORS[0]} />
                    <Line type="monotone" dataKey="female" stroke={COLORS[1]} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="ethnic" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Ethnic Group Representation Analysis</CardTitle>
            <CardDescription>
              Analyze ethnic diversity across events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select onValueChange={setSelectedEvent} value={selectedEvent}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.$id} value={event.$id}>
                      {event.eventName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ChartContainer
                config={{
                  name: { label: "Ethnic Group" },
                  value: { label: "Count" },
                }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={demographicData.ethnicData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="value">
                      {demographicData.ethnicData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
