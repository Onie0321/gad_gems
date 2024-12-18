"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { databases, databaseId, eventCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Loader2 } from "lucide-react";

export default function DemographicAnalysis() {
  const [loading, setLoading] = useState(true);
  const [genderData, setGenderData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [educationData, setEducationData] = useState([]);
  const [ethnicityData, setEthnicityData] = useState([]);
  const [schoolData, setSchoolData] = useState([]);
  const [sectionData, setSectionData] = useState([]);

  useEffect(() => {
    fetchDemographicData();
  }, []);

  const fetchDemographicData = async () => {
    try {
      setLoading(true);
      console.log("Fetching demographic data...");

      // Fetch all events
      const response = await databases.listDocuments(
        databaseId,
        eventCollectionId
      );

      console.log("Events response:", response);

      // Filter events with participants
      const eventsWithParticipants = response.documents.filter(
        event => event.participants && event.participants.length > 0
      );

      // Process all participants from filtered events
      const allParticipants = eventsWithParticipants.flatMap((event) => {
        console.log("Event participants:", event.participants);
        return event.participants || [];
      });

      console.log("All participants:", allParticipants);

      if (allParticipants.length === 0) {
        console.log("No participants found in any events");
        setLoading(false);
        return;
      }

      // Process gender data
      const genderCounts = allParticipants.reduce((acc, participant) => {
        const gender = participant.sex || "Unspecified";
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {});

      console.log("Gender counts:", genderCounts);
      setGenderData(
        Object.entries(genderCounts).map(([name, value]) => ({ name, value }))
      );

      // Process age data
      const ageRanges = {
        "18-24": 0,
        "25-34": 0,
        "35-44": 0,
        "45-54": 0,
        "55+": 0,
      };

      allParticipants.forEach((participant) => {
        const age = parseInt(participant.age);
        if (!isNaN(age)) {
          if (age <= 24) ageRanges["18-24"]++;
          else if (age <= 34) ageRanges["25-34"]++;
          else if (age <= 44) ageRanges["35-44"]++;
          else if (age <= 54) ageRanges["45-54"]++;
          else ageRanges["55+"]++;
        }
      });

      console.log("Age ranges:", ageRanges);
      setAgeData(
        Object.entries(ageRanges).map(([age, count]) => ({ age, count }))
      );

      // Process education data
      const educationCounts = allParticipants.reduce((acc, participant) => {
        const education = participant.educationLevel || "Unspecified";
        acc[education] = (acc[education] || 0) + 1;
        return acc;
      }, {});

      console.log("Education counts:", educationCounts);
      setEducationData(
        Object.entries(educationCounts).map(([level, count]) => ({
          level,
          count,
        }))
      );

      // Process ethnicity data
      const ethnicityCounts = allParticipants.reduce((acc, participant) => {
        const ethnicity = participant.ethnicity || "Unspecified";
        acc[ethnicity] = (acc[ethnicity] || 0) + 1;
        return acc;
      }, {});

      console.log("Ethnicity counts:", ethnicityCounts);
      setEthnicityData(
        Object.entries(ethnicityCounts).map(([group, count]) => ({
          group,
          count,
        }))
      );

      // Process school data
      const schoolCounts = allParticipants.reduce((acc, participant) => {
        const school = participant.school || "Unspecified";
        acc[school] = (acc[school] || 0) + 1;
        return acc;
      }, {});

      console.log("School counts:", schoolCounts);
      setSchoolData(
        Object.entries(schoolCounts).map(([name, count]) => ({ name, count }))
      );

      // Process section data
      const sectionCounts = allParticipants.reduce((acc, participant) => {
        const section = participant.section || "Unspecified";
        acc[section] = (acc[section] || 0) + 1;
        return acc;
      }, {});

      console.log("Section counts:", sectionCounts);
      setSectionData(
        Object.entries(sectionCounts).map(([name, count]) => ({ name, count }))
      );
    } catch (error) {
      console.error("Error fetching demographic data:", error);
      console.log("Error details:", {
        message: error.message,
        code: error.code,
        response: error.response,
      });
    } finally {
      setLoading(false);
    }
  };

  // Add this useEffect to monitor the data states
  useEffect(() => {
    if (genderData.length > 0) {
      console.log("Updated Gender Data:", genderData);
    }
    if (ageData.length > 0) {
      console.log("Updated Age Data:", ageData);
    }
    if (educationData.length > 0) {
      console.log("Updated Education Data:", educationData);
    }
  }, [genderData, ageData, educationData]);

  // Define color schemes
  const genderColors = {
    Male: "#2196F3", // Blue
    Female: "#E91E63", // Pink
    Intersex: "#FFC107", // Yellow
  };

  const ageColors = [
    "#FF6B6B", // Coral
    "#4ECDC4", // Turquoise
    "#45B7D1", // Sky Blue
    "#96CEB4", // Sage
    "#FFEEAD", // Light Yellow
  ];

  const educationColors = [
    "#FF9F1C", // Orange
    "#2EC4B6", // Teal
    "#E71D36", // Red
    "#011627", // Navy
    "#FDFFFC", // White
    "#7209B7", // Purple
  ];

  const ethnicityColors = [
    "#588157", // Forest Green
    "#3A86FF", // Blue
    "#8338EC", // Purple
    "#FF006E", // Pink
    "#FB5607", // Orange
    "#FFBE0B", // Yellow
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading demographic data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Gender Breakdown Card */}
      <Card>
        <CardHeader>
          <CardTitle>Gender Distribution</CardTitle>
          <CardDescription>
            Distribution of participants by gender
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {genderData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={genderColors[entry.name] || "#999999"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gender</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {genderData.map((item) => {
                const total = genderData.reduce(
                  (sum, curr) => sum + curr.value,
                  0
                );
                const percentage = ((item.value / total) * 100).toFixed(1);
                return (
                  <TableRow key={item.name}>
                    <TableCell className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: genderColors[item.name] || "#999999",
                        }}
                      />
                      {item.name}
                    </TableCell>
                    <TableCell>{item.value}</TableCell>
                    <TableCell>{percentage}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Age Distribution Card */}
      <Card>
        <CardHeader>
          <CardTitle>Age Distribution</CardTitle>
          <CardDescription>Age groups of participants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData}>
                <XAxis dataKey="age" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count">
                  {ageData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={ageColors[index % ageColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Age Group</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ageData.map((item, index) => {
                const total = ageData.reduce(
                  (sum, curr) => sum + curr.count,
                  0
                );
                const percentage = ((item.count / total) * 100).toFixed(1);
                return (
                  <TableRow key={item.age}>
                    <TableCell className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: ageColors[index % ageColors.length],
                        }}
                      />
                      {item.age}
                    </TableCell>
                    <TableCell>{item.count}</TableCell>
                    <TableCell>{percentage}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Education Level Card */}
      <Card>
        <CardHeader>
          <CardTitle>Education Level Distribution</CardTitle>
          <CardDescription>Education levels of participants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={educationData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="level" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="count">
                  {educationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={educationColors[index % educationColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Education Level</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {educationData.map((item, index) => {
                const total = educationData.reduce(
                  (sum, curr) => sum + curr.count,
                  0
                );
                const percentage = ((item.count / total) * 100).toFixed(1);
                return (
                  <TableRow key={item.level}>
                    <TableCell className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            educationColors[index % educationColors.length],
                        }}
                      />
                      {item.level}
                    </TableCell>
                    <TableCell>{item.count}</TableCell>
                    <TableCell>{percentage}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add similar cards for Ethnicity, School, and Section with their respective color schemes */}
    </div>
  );
}
