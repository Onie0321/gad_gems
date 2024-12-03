"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { getEvents, getParticipants } from "@/lib/appwrite";
import { UserIcon as Male, UserIcon as Female } from 'lucide-react';

const COLORS = {
  male: "#4299E1", // blue
  female: "#ED64A6", // pink
};

const RADIAN = Math.PI / 180;

export default function DemographicAnalysis() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedEventName, setSelectedEventName] = useState("All Events");
  const [demographicData, setDemographicData] = useState({
    genderData: [],
    ageData: [],
    educationData: [],
    ethnicData: [],
    schoolData: [],
    sectionData: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      fetchDemographicData(selectedEvent);
    }
  }, [selectedEvent, events]);

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

  const fetchDemographicData = async (eventId) => {
    try {
      setIsLoading(true);
      let participants;
      if (eventId === "all") {
        participants = await Promise.all(
          events.map((event) => getParticipants(event.$id))
        );
        participants = participants.flat();
        setSelectedEventName("All Events");
      } else {
        participants = await getParticipants(eventId);
        const selectedEventObj = events.find(event => event.$id === eventId);
        setSelectedEventName(selectedEventObj ? selectedEventObj.eventName : "Unknown Event");
      }

      setDemographicData({
        genderData: processGenderData(participants),
        ageData: processAgeData(participants),
        educationData: processEducationData(participants),
        ethnicData: processEthnicData(participants),
        schoolData: processSchoolData(participants),
        sectionData: processSectionData(participants),
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching demographic data:", error);
      setIsLoading(false);
    }
  };

  const processGenderData = (participants) => {
    const genderCount = participants.reduce((acc, p) => {
      acc[p.sex.toLowerCase()]++;
      return acc;
    }, { male: 0, female: 0 });

    return Object.entries(genderCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  };

  const processAgeData = (participants) => {
    const ageGroups = {
      "18-24": { male: 0, female: 0 },
      "25-34": { male: 0, female: 0 },
      "35-44": { male: 0, female: 0 },
      "45-54": { male: 0, female: 0 },
      "55+": { male: 0, female: 0 },
    };

    participants.forEach((p) => {
      const age = parseInt(p.age);
      const sex = p.sex.toLowerCase();
      if (age >= 18 && age <= 24) ageGroups["18-24"][sex]++;
      else if (age >= 25 && age <= 34) ageGroups["25-34"][sex]++;
      else if (age >= 35 && age <= 44) ageGroups["35-44"][sex]++;
      else if (age >= 45 && age <= 54) ageGroups["45-54"][sex]++;
      else if (age >= 55) ageGroups["55+"][sex]++;
    });

    return Object.entries(ageGroups).map(([name, value]) => ({
      name,
      male: value.male,
      female: value.female,
      total: value.male + value.female,
    }));
  };

  const processEducationData = (participants) => {
    const educationCount = participants.reduce((acc, p) => {
      const sex = p.sex.toLowerCase();
      if (!acc[p.year]) {
        acc[p.year] = { male: 0, female: 0 };
      }
      acc[p.year][sex]++;
      return acc;
    }, {});

    return Object.entries(educationCount).map(([name, value]) => ({
      name,
      male: value.male,
      female: value.female,
      total: value.male + value.female,
    }));
  };

  const processEthnicData = (participants) => {
    const ethnicCount = participants.reduce((acc, p) => {
      const group = p.ethnicGroup === "Other" ? p.otherEthnicGroup : p.ethnicGroup;
      const sex = p.sex.toLowerCase();
      if (!acc[group]) {
        acc[group] = { male: 0, female: 0 };
      }
      acc[group][sex]++;
      return acc;
    }, {});

    return Object.entries(ethnicCount).map(([name, value]) => ({
      name,
      male: value.male,
      female: value.female,
      total: value.male + value.female,
    }));
  };

  const processSchoolData = (participants) => {
    const schoolCount = participants.reduce((acc, p) => {
      const sex = p.sex.toLowerCase();
      if (!acc[p.school]) {
        acc[p.school] = { male: 0, female: 0 };
      }
      acc[p.school][sex]++;
      return acc;
    }, {});

    return Object.entries(schoolCount).map(([name, value]) => ({
      name,
      male: value.male,
      female: value.female,
      total: value.male + value.female,
    }));
  };

  const processSectionData = (participants) => {
    const sectionCount = participants.reduce((acc, p) => {
      const sex = p.sex.toLowerCase();
      if (!acc[p.section]) {
        acc[p.section] = { male: 0, female: 0 };
      }
      acc[p.section][sex]++;
      return acc;
    }, {});

    return Object.entries(sectionCount).map(([name, value]) => ({
      name,
      male: value.male,
      female: value.female,
      total: value.male + value.female,
    }));
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, index, name }) => {
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const percentage = `${(percent * 100).toFixed(0)}%`;

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#000"
        fontSize="10px"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${name.length > 10 ? name.substring(0, 10) + '...' : name} (${percentage})`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const male = payload.find(p => p.dataKey === "male")?.value || 0;
      const female = payload.find(p => p.dataKey === "female")?.value || 0;
      const total = male + female;
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-bold">{label}</p>
          <p>Male: {male}</p>
          <p>Female: {female}</p>
          <p className="font-bold">Total: {total}</p>
        </div>
      );
    }
    return null;
  };

  const DataTable = ({ data }) => (
    <div className="max-h-60 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Male</TableHead>
            <TableHead>Female</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.male}</TableCell>
              <TableCell>{item.female}</TableCell>
              <TableCell>{item.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{selectedEventName}</h2>
        <Select onValueChange={setSelectedEvent} value={selectedEvent}>
          <SelectTrigger className="w-[200px]">
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Gender Breakdown</CardTitle>
            <CardDescription>Distribution of male and female participants</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={demographicData.genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {demographicData.genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(value, entry) => (
                    <span className="flex items-center">
                      {value === "Male" ? <Male size={16} className="mr-2" /> : <Female size={16} className="mr-2" />}
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <DataTable data={demographicData.genderData} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
            <CardDescription>Distribution of participants by age range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demographicData.ageData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(value, entry) => (
                    <span className="flex items-center">
                      {value === "male" ? <Male size={16} className="mr-2" /> : <Female size={16} className="mr-2" />}
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                  )}
                />
                <Bar dataKey="male"  fill={COLORS.male} />
                <Bar dataKey="female"  fill={COLORS.female} />
              </BarChart>
            </ResponsiveContainer>
            <DataTable data={demographicData.ageData} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Educational Level</CardTitle>
            <CardDescription>Distribution of participants' educational levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demographicData.educationData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(value, entry) => (
                    <span className="flex items-center">
                      {value === "male" ? <Male size={16} className="mr-2" /> : <Female size={16} className="mr-2" />}
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                  )}
                />
                <Bar dataKey="male"  fill={COLORS.male} />
                <Bar dataKey="female"  fill={COLORS.female} />
              </BarChart>
            </ResponsiveContainer>
            <DataTable data={demographicData.educationData} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Ethnic Group Analysis</CardTitle>
            <CardDescription>Distribution of participants' ethnic groups</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demographicData.ethnicData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(value, entry) => (
                    <span className="flex items-center">
                      {value === "male" ? <Male size={16} className="mr-2" /> : <Female size={16} className="mr-2" />}
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                  )}
                />
                <Bar dataKey="male"  fill={COLORS.male} />
                <Bar dataKey="female"  fill={COLORS.female} />
              </BarChart>
            </ResponsiveContainer>
            <DataTable data={demographicData.ethnicData} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>School Distribution</CardTitle>
            <CardDescription>Distribution of participants by school</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demographicData.schoolData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(value, entry) => (
                    <span className="flex items-center">
                      {value === "male" ? <Male size={16} className="mr-2" /> : <Female size={16} className="mr-2" />}
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                  )}
                />
                <Bar dataKey="male"  fill={COLORS.male} />
                <Bar dataKey="female"  fill={COLORS.female} />
              </BarChart>
            </ResponsiveContainer>
            <DataTable data={demographicData.schoolData} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Section Distribution</CardTitle>
            <CardDescription>Distribution of participants by section</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demographicData.sectionData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(value, entry) => (
                    <span className="flex items-center">
                      {value === "male" ? <Male size={16} className="mr-2" /> : <Female size={16} className="mr-2" />}
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                  )}
                />
                <Bar dataKey="male"  fill={COLORS.male} />
                <Bar dataKey="female"  fill={COLORS.female} />
              </BarChart>
            </ResponsiveContainer>
            <DataTable data={demographicData.sectionData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

