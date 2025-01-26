import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  databases,
  databaseId,
  participantCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";

export function DemographicsOverview({ selectedPeriod }) {
  const [keyMetrics, setKeyMetrics] = useState({
    totalParticipants: 0,
    genderDistribution: { male: 0, female: 0, notSpecified: 0 },
    averageAge: 0,
    topEthnicity: "",
    topEducationLevel: "",
    topYearLevel: "",
  });

  useEffect(() => {
    if (selectedPeriod) {
      fetchDemographicData();
    }
  }, [selectedPeriod]);

  const fetchDemographicData = async () => {
    try {
      const [participantsResponse, staffResponse, communityResponse] =
        await Promise.all([
          databases.listDocuments(databaseId, participantCollectionId),
          databases.listDocuments(databaseId, staffFacultyCollectionId),
          databases.listDocuments(databaseId, communityCollectionId),
        ]);

      const allParticipants = [
        ...participantsResponse.documents,
        ...staffResponse.documents,
        ...communityResponse.documents,
      ];

      calculateKeyMetrics(allParticipants);
    } catch (error) {
      console.error("Error fetching demographic data:", error);
    }
  };

  const calculateKeyMetrics = (allParticipants) => {
    // Total Participants
    const total = allParticipants.length;

    // Gender Distribution
    const genderCounts = allParticipants.reduce((acc, participant) => {
      const gender = participant.sex?.toLowerCase() || "not specified";
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, { male: 0, female: 0, notSpecified: 0 });

    // Average Age
    const validAges = allParticipants
      .map(p => parseInt(p.age))
      .filter(age => !isNaN(age));
    const avgAge = validAges.length > 0
      ? Math.round(validAges.reduce((a, b) => a + b) / validAges.length)
      : 0;

    // Top Ethnicity
    const ethnicityCount = {};
    allParticipants.forEach(p => {
      if (p.ethnicGroup) {
        ethnicityCount[p.ethnicGroup] = (ethnicityCount[p.ethnicGroup] || 0) + 1;
      }
    });
    const topEthnicity = Object.entries(ethnicityCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "Not Available";

    // Top Education Level
    const educationCount = {};
    allParticipants.forEach(p => {
      if (p.school) {
        educationCount[p.school] = (educationCount[p.school] || 0) + 1;
      }
    });
    const topEducation = Object.entries(educationCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "Not Available";

    // Top Year Level
    const yearCount = {};
    allParticipants.forEach(p => {
      if (p.year) {
        yearCount[p.year] = (yearCount[p.year] || 0) + 1;
      }
    });
    const topYear = Object.entries(yearCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "Not Available";

    setKeyMetrics({
      totalParticipants: total,
      genderDistribution: genderCounts,
      averageAge: avgAge,
      topEthnicity,
      topEducationLevel: topEducation,
      topYearLevel: topYear,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Participants</CardTitle>
          <CardDescription>Overall participant count</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{keyMetrics.totalParticipants}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gender Distribution</CardTitle>
          <CardDescription>Breakdown by gender</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Male: {keyMetrics.genderDistribution.male}</p>
            <p>Female: {keyMetrics.genderDistribution.female}</p>
            <p>Not Specified: {keyMetrics.genderDistribution.notSpecified}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Age</CardTitle>
          <CardDescription>Mean age of participants</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{keyMetrics.averageAge}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Ethnicity</CardTitle>
          <CardDescription>Most common ethnic group</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold">{keyMetrics.topEthnicity}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Education Level</CardTitle>
          <CardDescription>Most common education level</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold">{keyMetrics.topEducationLevel}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Year Level</CardTitle>
          <CardDescription>Most common year level</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold">{keyMetrics.topYearLevel}</p>
        </CardContent>
      </Card>
    </div>
  );
} 