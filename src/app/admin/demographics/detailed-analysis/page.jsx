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
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Maximize2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  databases,
  databaseId,
  studentsCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import GenderBreakdown from "../../officer/demographic-analysis/gender-breakdown/page";
import AgeDistribution from "../../officer/demographic-analysis/age-distribution/page";
import EducationLevel from "../../officer/demographic-analysis/educational-level/page";
import EthnicGroupAnalysis from "../../officer/demographic-analysis/ethnic-group-analysis/page";
import SchoolDistribution from "../../officer/demographic-analysis/school-distribution/page";
import SectionDistribution from "../../officer/demographic-analysis/section-distribution/page";

const genderColors = {
  male: "#2196F3",
  female: "#E91E63",
  "not specified": "#9E9E9E",
};

const getAgeGroup = (age) => {
  if (!age || age === "Not Specified") return "Not Specified";
  age = parseInt(age);
  if (age < 18) return "18 and below";
  if (age >= 18 && age <= 24) return "18-24";
  if (age >= 25 && age <= 34) return "25-34";
  if (age >= 35 && age <= 44) return "35-44";
  if (age >= 45 && age <= 54) return "45-54";
  if (age >= 55) return "55 and above";
  return "Not Specified";
};

export function DetailedAnalysis({
  selectedPeriod,
  setLoading,
  setHasParticipants,
}) {
  const [genderData, setGenderData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [educationData, setEducationData] = useState([]);
  const [ethnicityData, setEthnicityData] = useState([]);
  const [yearData, setYearData] = useState([]);
  const [sectionData, setSectionData] = useState([]);
  const [selectedChart, setSelectedChart] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("demographic");

  useEffect(() => {
    const fetchData = async () => {
      if (selectedPeriod) {
        setLocalLoading(true);
        try {
          const [participantsResponse, staffResponse, communityResponse] =
            await Promise.all([
              databases.listDocuments(databaseId, studentsCollectionId),
              databases.listDocuments(databaseId, staffFacultyCollectionId),
              databases.listDocuments(databaseId, communityCollectionId),
            ]);

          const allParticipants = [
            ...participantsResponse.documents,
            ...staffResponse.documents,
            ...communityResponse.documents,
          ];

          if (allParticipants.length === 0) {
            setHasParticipants(false);
            return;
          }

          setHasParticipants(true);

          // Process gender distribution
          const genderCounts = allParticipants.reduce((acc, participant) => {
            const gender = participant.sex?.toLowerCase() || "not specified";
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
          }, {});

          setGenderData(
            Object.entries(genderCounts).map(([gender, count]) => ({
              gender: gender.charAt(0).toUpperCase() + gender.slice(1),
              count,
              percentage: ((count / allParticipants.length) * 100).toFixed(1),
            }))
          );

          // Process age distribution
          const ageCounts = allParticipants.reduce((acc, participant) => {
            const ageGroup = getAgeGroup(participant.age);
            const sex = participant.sex?.toLowerCase() || "not specified";
            if (!acc[ageGroup]) {
              acc[ageGroup] = { male: 0, female: 0 };
            }
            if (sex === "male" || sex === "female") {
              acc[ageGroup][sex]++;
            }
            return acc;
          }, {});

          setAgeData(
            Object.entries(ageCounts)
              .map(([age, counts]) => ({
                age,
                male: counts.male || 0,
                female: counts.female || 0,
                total: (counts.male || 0) + (counts.female || 0),
              }))
              .sort((a, b) => {
                if (a.age === "Not Specified") return 1;
                if (b.age === "Not Specified") return -1;
                return 0;
              })
          );

          // Process education level distribution
          const educationCounts = allParticipants.reduce((acc, participant) => {
            const education = participant.school || "Not Specified";
            const sex = participant.sex?.toLowerCase() || "not specified";
            if (!acc[education]) {
              acc[education] = { male: 0, female: 0 };
            }
            if (sex === "male" || sex === "female") {
              acc[education][sex]++;
            }
            return acc;
          }, {});

          setEducationData(
            Object.entries(educationCounts).map(([level, counts]) => ({
              level,
              male: counts.male || 0,
              female: counts.female || 0,
              total: (counts.male || 0) + (counts.female || 0),
            }))
          );

          // Process ethnicity distribution
          const ethnicityCounts = allParticipants.reduce((acc, participant) => {
            const ethnicity = participant.ethnicGroup || "Not Specified";
            const sex = participant.sex?.toLowerCase() || "not specified";
            if (!acc[ethnicity]) {
              acc[ethnicity] = { male: 0, female: 0 };
            }
            if (sex === "male" || sex === "female") {
              acc[ethnicity][sex]++;
            }
            return acc;
          }, {});

          setEthnicityData(
            Object.entries(ethnicityCounts).map(([name, counts]) => ({
              name,
              male: counts.male || 0,
              female: counts.female || 0,
              total: (counts.male || 0) + (counts.female || 0),
            }))
          );

          // Process year level distribution
          const yearCounts = allParticipants.reduce((acc, participant) => {
            const year = participant.year || "Not Specified";
            const sex = participant.sex?.toLowerCase() || "not specified";
            if (!acc[year]) {
              acc[year] = { male: 0, female: 0 };
            }
            if (sex === "male" || sex === "female") {
              acc[year][sex]++;
            }
            return acc;
          }, {});

          setYearData(
            Object.entries(yearCounts)
              .map(([year, counts]) => ({
                year,
                male: counts.male || 0,
                female: counts.female || 0,
                total: (counts.male || 0) + (counts.female || 0),
              }))
              .sort((a, b) => {
                if (a.year === "Not Specified") return 1;
                if (b.year === "Not Specified") return -1;
                return a.year.localeCompare(b.year);
              })
          );

          // Process section distribution
          const sectionCounts = allParticipants.reduce((acc, participant) => {
            const section = participant.section || "Not Specified";
            const sex = participant.sex?.toLowerCase() || "not specified";
            if (!acc[section]) {
              acc[section] = { male: 0, female: 0 };
            }
            if (sex === "male" || sex === "female") {
              acc[section][sex]++;
            }
            return acc;
          }, {});

          setSectionData(
            Object.entries(sectionCounts)
              .map(([section, counts]) => ({
                section,
                male: counts.male || 0,
                female: counts.female || 0,
                total: (counts.male || 0) + (counts.female || 0),
              }))
              .sort((a, b) => {
                if (a.section === "Not Specified") return 1;
                if (b.section === "Not Specified") return -1;
                return a.section.localeCompare(b.section);
              })
          );
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLocalLoading(false);
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [selectedPeriod]);

  if (localLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-[#F5F5F5]">
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="bg-white">
          <TabsTrigger
            value="demographic"
            className="data-[state=active]:bg-[#2D89EF] data-[state=active]:text-white"
          >
            Demographic Overview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="demographic">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {genderData.length > 0 ? (
              <>
                <GenderBreakdown data={genderData} colors={genderColors} />
                <AgeDistribution data={ageData} colors={genderColors} />
                <EducationLevel data={educationData} colors={genderColors} />
                <EthnicGroupAnalysis
                  data={ethnicityData}
                  colors={genderColors}
                />
                <SchoolDistribution data={sectionData} colors={genderColors} />
              </>
            ) : (
              <div className="col-span-2 text-center py-4">
                <p>No data available for the selected period.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
