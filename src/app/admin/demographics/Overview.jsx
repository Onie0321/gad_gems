"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  databases,
  databaseId,
  studentCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";
import { countTopEthnicities } from "@/utils/participantUtils";
import { Query } from "appwrite";

// Helper to get top value from a field, with optional filter
function getTopField(participants, field, isValidFn = null) {
  const counts = {};
  for (const p of participants) {
    const value = p[field];
    if (!value) continue;
    if (isValidFn && !isValidFn(value)) continue;
    const key = value.trim();
    counts[key] = (counts[key] || 0) + 1;
  }
  return (
    Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    "Not Available"
  );
}

// Religion filter (exclude N/A, none, etc. similar to ethnicity)
function isValidReligion(religion) {
  if (!religion) return false;
  const value = religion.trim().toLowerCase();
  const notApplicable = [
    "na",
    "n/a",
    "none",
    "n.a",
    "no",
    "not applicable",
    "notapplicable",
    "not-applicable",
    "-",
    "*",
    "unknown",
  ];
  if (notApplicable.includes(value.replace(/[-\s]/g, ""))) return false;
  if (/^[\*\-]+$/.test(value)) return false;
  if (/^\d+$/.test(value)) return false;
  return true;
}

// Helper to normalize gender
function normalizeGender(value) {
  if (!value) return "notSpecified";
  const v = value.trim().toLowerCase();
  if (v === "male") return "male";
  if (v === "female") return "female";
  return "notSpecified";
}

// Helper to fetch all documents from a collection (cursor-based pagination for >5000 records)
async function fetchAllDocuments(collectionId) {
  const limit = 100;
  let allDocs = [];
  let cursor = undefined;
  let hasMore = true;

  while (hasMore) {
    const queries = [Query.limit(limit)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const response = await databases.listDocuments(
      databaseId,
      collectionId,
      queries
    );
    allDocs = allDocs.concat(response.documents);
    if (response.documents.length < limit) {
      hasMore = false;
    } else {
      cursor = response.documents[response.documents.length - 1].$id;
    }
  }
  return allDocs;
}

// Skeleton Card Component
const SkeletonCard = ({ title, description }) => (
  <Card>
    <CardHeader>
      <CardTitle>
        <Skeleton className="h-6 w-32" />
      </CardTitle>
      <CardDescription>
        <Skeleton className="h-4 w-48" />
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16" />
    </CardContent>
  </Card>
);

// Skeleton Card for Gender Distribution
const SkeletonGenderCard = () => (
  <Card>
    <CardHeader>
      <CardTitle>
        <Skeleton className="h-6 w-32" />
      </CardTitle>
      <CardDescription>
        <Skeleton className="h-4 w-48" />
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </CardContent>
  </Card>
);

export function DemographicsOverview({ selectedPeriod }) {
  const [keyMetrics, setKeyMetrics] = useState({
    totalParticipants: 0,
    genderDistribution: { male: 0, female: 0, notSpecified: 0 },
    averageAge: 0,
    topEthnicity: "",
    topReligion: "",
    topEducationLevel: "",
    topYearLevel: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // BYPASSING ACADEMIC PERIOD - Fetch all data regardless of selectedPeriod
    fetchDemographicData();
  }, []); // Removed selectedPeriod dependency

  const fetchDemographicData = async () => {
    setLoading(true);
    try {
      // Debug collection IDs
      console.log("Collection IDs:", {
        databaseId,
        studentCollectionId,
        staffFacultyCollectionId,
        communityCollectionId,
      });

      if (
        !studentCollectionId ||
        !staffFacultyCollectionId ||
        !communityCollectionId
      ) {
        throw new Error("One or more collection IDs are not defined");
      }

      const [allStudents, allStaff, allCommunity] = await Promise.all([
        fetchAllDocuments(studentCollectionId),
        fetchAllDocuments(staffFacultyCollectionId),
        fetchAllDocuments(communityCollectionId),
      ]);

      console.log("All students count:", allStudents.length);
      console.log("All staff count:", allStaff.length);
      console.log("All community count:", allCommunity.length);

      const allParticipants = [...allStudents, ...allStaff, ...allCommunity];
      console.log("Total participants combined:", allParticipants.length);

      calculateKeyMetrics(allParticipants);
    } catch (error) {
      console.error("Error fetching demographic data:", error);
      // Set default values when there's an error
      setKeyMetrics({
        totalParticipants: 0,
        genderDistribution: { male: 0, female: 0, notSpecified: 0 },
        averageAge: 0,
        topEthnicity: "Not Available",
        topReligion: "Not Available",
        topEducationLevel: "Not Available",
        topYearLevel: "Not Available",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateKeyMetrics = (allParticipants) => {
    // Total Participants
    const total = allParticipants.length;

    // Gender Distribution
    const genderCounts = allParticipants.reduce(
      (acc, participant) => {
        const gender = normalizeGender(participant.sex);
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      },
      { male: 0, female: 0, notSpecified: 0 }
    );

    // Average Age
    const validAges = allParticipants
      .map((p) => parseInt(p.age))
      .filter((age) => !isNaN(age));
    const avgAge =
      validAges.length > 0
        ? Math.round(validAges.reduce((a, b) => a + b) / validAges.length)
        : 0;

    // Top Ethnicity
    const topEthnicity =
      countTopEthnicities(allParticipants, 1)[0]?.ethnicity || "Not Available";

    // Top Religion
    const topReligion = getTopField(
      allParticipants,
      "religion",
      isValidReligion
    );

    // Top Education Level
    const educationCount = {};
    allParticipants.forEach((p) => {
      if (p.program) {
        educationCount[p.program] = (educationCount[p.program] || 0) + 1;
      }
    });
    const topEducation =
      Object.entries(educationCount).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "Not Available";

    // Top Year Level
    const yearCount = {};
    allParticipants.forEach((p) => {
      if (p.year) {
        yearCount[p.year] = (yearCount[p.year] || 0) + 1;
      }
    });
    const topYear =
      Object.entries(yearCount).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "Not Available";

    setKeyMetrics({
      totalParticipants: total,
      genderDistribution: genderCounts,
      averageAge: avgAge,
      topEthnicity,
      topReligion,
      topEducationLevel: topEducation,
      topYearLevel: topYear,
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard
          title="Total Participants"
          description="Overall participant count (All Academic Periods)"
        />
        <SkeletonGenderCard />
        <SkeletonCard
          title="Average Age"
          description="Mean age of participants (All Academic Periods)"
        />
        <SkeletonCard
          title="Top Ethnicity"
          description="Most common ethnic group (All Academic Periods)"
        />
        <SkeletonCard
          title="Top Religion"
          description="Most common religion (All Academic Periods)"
        />
        <SkeletonCard
          title="Top Education Level"
          description="Most common education level (All Academic Periods)"
        />
        <SkeletonCard
          title="Top Year Level"
          description="Most common year level (All Academic Periods)"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Participants</CardTitle>
          <CardDescription>
            Overall participant count (All Academic Periods)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{keyMetrics.totalParticipants}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gender Distribution</CardTitle>
          <CardDescription>
            Breakdown by gender (All Academic Periods)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Male: {keyMetrics.genderDistribution.male}</p>
            <p>Female: {keyMetrics.genderDistribution.female}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Age</CardTitle>
          <CardDescription>
            Mean age of participants (All Academic Periods)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{keyMetrics.averageAge}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Ethnicity</CardTitle>
          <CardDescription>
            Most common ethnic group (All Academic Periods)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold">{keyMetrics.topEthnicity}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Religion</CardTitle>
          <CardDescription>
            Most common religion (All Academic Periods)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold">{keyMetrics.topReligion}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Education Level</CardTitle>
          <CardDescription>
            Most common education level (All Academic Periods)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold">
            {keyMetrics.topEducationLevel}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Year Level</CardTitle>
          <CardDescription>
            Most common year level (All Academic Periods)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold">{keyMetrics.topYearLevel}</p>
        </CardContent>
      </Card>
    </div>
  );
}
