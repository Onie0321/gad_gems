"use client";

import React, { useState, useEffect } from "react";
import { databases, databaseId, participantCollectionId, eventCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";
import { LoadingAnimation } from "@/components/loading/loading-animation";
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
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdvancedSearch from "./search/page";
import { Trends } from "./trends/page";

const chartColors = {
  gender: {
    Male: "#2196F3", // Blue
    Female: "#E91E63", // Pink
    Intersex: "#9C27B0", // Purple
    Unknown: "#757575", // Grey
  },
  age: ["#FF9800", "#2196F3", "#4CAF50", "#9C27B0", "#F44336"], // Orange, Blue, Green, Purple, Red
  education: ["#3F51B5", "#009688", "#FF5722", "#795548", "#607D8B"], // Indigo, Teal, Deep Orange, Brown, Blue Grey
  ethnicity: ["#2196F3", "#4CAF50", "#FFC107", "#9C27B0", "#FF5722", "#795548"], // Blue, Green, Amber, Purple, Deep Orange, Brown
  school: ["#00BCD4", "#8BC34A", "#FF9800", "#E91E63", "#9E9E9E"], // Cyan, Light Green, Orange, Pink, Grey
  section: ["#673AB7", "#009688", "#FFC107", "#F44336", "#607D8B"], // Deep Purple, Teal, Amber, Red, Blue Grey
};

const DemographicAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [demographicData, setDemographicData] = useState({
    genderData: [],
    ageData: [],
    educationData: [],
    ethnicityData: [],
    schoolData: [],
    sectionData: [],
  });

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch events
        const eventsResponse = await databases.listDocuments(
          databaseId,
          eventCollectionId
        );
        
        // Fetch participants
        const participantsResponse = await databases.listDocuments(
          databaseId,
          participantCollectionId,
          [
            Query.limit(1000), // Adjust based on your needs
          ]
        );

        setEvents(eventsResponse.documents);
        setParticipants(participantsResponse.documents);

        // Process demographic data
        processData(participantsResponse.documents);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load demographic data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const processData = (participantsData) => {
    try {
      const processedData = {
        genderData: processGenderData(participantsData),
        ageData: processAgeData(participantsData),
        educationData: processEducationData(participantsData),
        ethnicityData: processEthnicityData(participantsData),
        schoolData: processSchoolData(participantsData),
        sectionData: processSectionData(participantsData),
      };

      setDemographicData(processedData);
    } catch (err) {
      console.error("Error processing data:", err);
      setError("Error processing demographic data");
    }
  };

  const processGenderData = (data) => {
    const genderCounts = data.reduce((acc, participant) => {
      const gender = participant.sex || "Unknown";
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(genderCounts).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const processAgeData = (data) => {
    const ageGroups = data.reduce((acc, participant) => {
      const age = parseInt(participant.age);
      const gender = participant.sex?.toLowerCase() || "unknown";
      let ageRange;

      if (age < 18) ageRange = "Under 18";
      else if (age <= 24) ageRange = "18-24";
      else if (age <= 34) ageRange = "25-34";
      else if (age <= 44) ageRange = "35-44";
      else if (age <= 54) ageRange = "45-54";
      else ageRange = "55+";

      if (!acc[ageRange]) {
        acc[ageRange] = { male: 0, female: 0, intersex: 0, total: 0 };
      }

      acc[ageRange][gender]++;
      acc[ageRange].total++;

      return acc;
    }, {});

    return Object.entries(ageGroups).map(([age, counts]) => ({
      age,
      ...counts
    }));
  };

  const processEducationData = (data) => {
    const educationCounts = data.reduce((acc, participant) => {
      const year = participant.year || "Unknown";
      const gender = participant.sex?.toLowerCase() || "unknown";

      if (!acc[year]) {
        acc[year] = { male: 0, female: 0, intersex: 0, total: 0 };
      }

      acc[year][gender]++;
      acc[year].total++;

      return acc;
    }, {});

    return Object.entries(educationCounts).map(([level, counts]) => ({
      level,
      ...counts
    }));
  };

  const processEthnicityData = (data) => {
    const ethnicityCounts = data.reduce((acc, participant) => {
      const ethnicity = participant.ethnicGroup || "Unknown";
      const gender = participant.sex?.toLowerCase() || "unknown";

      if (!acc[ethnicity]) {
        acc[ethnicity] = { male: 0, female: 0, intersex: 0, total: 0 };
      }

      acc[ethnicity][gender]++;
      acc[ethnicity].total++;

      return acc;
    }, {});

    return Object.entries(ethnicityCounts).map(([group, counts]) => ({
      group,
      ...counts
    }));
  };

  const processSchoolData = (data) => {
    const schoolCounts = data.reduce((acc, participant) => {
      const school = participant.school || "Unknown";
      const gender = participant.sex?.toLowerCase() || "unknown";

      if (!acc[school]) {
        acc[school] = { male: 0, female: 0, intersex: 0, total: 0 };
      }

      acc[school][gender]++;
      acc[school].total++;

      return acc;
    }, {});

    return Object.entries(schoolCounts).map(([name, counts]) => ({
      name,
      ...counts
    }));
  };

  const processSectionData = (data) => {
    const sectionCounts = data.reduce((acc, participant) => {
      const section = participant.section || "Unknown";
      const gender = participant.sex?.toLowerCase() || "unknown";

      if (!acc[section]) {
        acc[section] = { male: 0, female: 0, intersex: 0, total: 0 };
      }

      acc[section][gender]++;
      acc[section].total++;

      return acc;
    }, {});

    return Object.entries(sectionCounts).map(([name, counts]) => ({
      name,
      ...counts
    }));
  };

  if (loading) {
    return <LoadingAnimation message="Loading demographic data..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-100 rounded-md hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!participants.length) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-600 rounded-md">
        <p>No participant data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      <Tabs defaultValue="overview">
        <TabsList className="bg-white">
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-[#2D89EF] data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="trends"
            className="data-[state=active]:bg-[#2D89EF] data-[state=active]:text-white"
          >
            Trends
          </TabsTrigger>
          <TabsTrigger 
            value="advanced"
            className="data-[state=active]:bg-[#2D89EF] data-[state=active]:text-white"
          >
            Advanced Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Gender Breakdown</CardTitle>
              <CardDescription>
                Distribution of participants by gender
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  male: { label: "Male", color: chartColors.gender.Male },
                  female: { label: "Female", color: chartColors.gender.Female },
                  intersex: {
                    label: "Intersex",
                    color: chartColors.gender.Intersex,
                  },
                  unknown: { label: "Unknown", color: chartColors.gender.Unknown },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={demographicData.genderData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill={chartColors.gender.Male}
                    >
                      {demographicData.genderData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={chartColors.gender[entry.name]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gender</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demographicData.genderData.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Trends />
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedSearch 
            onFilterChange={(filteredData) => {
              // Process filtered data if needed
              processData(filteredData);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DemographicAnalysis;
