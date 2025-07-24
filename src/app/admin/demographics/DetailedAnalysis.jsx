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
import { Skeleton } from "@/components/ui/skeleton";
import {
  databases,
  databaseId,
  studentCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import { processEthnicityData } from "@/utils/participantUtils";

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

// Helper to compute grand total row for a table
function getGrandTotal(data, keys = ["male", "female", "total"]) {
  return keys.reduce(
    (acc, key) =>
      acc + data.reduce((sum, row) => sum + (parseInt(row[key]) || 0), 0),
    0
  );
}

function getGrandTotalRow(data, labelKey) {
  const male = data.reduce((sum, row) => sum + (parseInt(row.male) || 0), 0);
  const female = data.reduce(
    (sum, row) => sum + (parseInt(row.female) || 0),
    0
  );
  const total = data.reduce((sum, row) => sum + (parseInt(row.total) || 0), 0);
  return {
    [labelKey]: "Grand Total",
    male,
    female,
    total,
  };
}

// Skeleton Card Component for Detailed Analysis
const SkeletonAnalysisCard = ({ title, description }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle>
          <Skeleton className="h-6 w-40" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-56" />
        </CardDescription>
      </div>
      <Skeleton className="h-9 w-9 rounded-full" />
    </CardHeader>
    <CardContent>
      <div className="h-80">
        <Skeleton className="h-full w-full rounded-md" />
      </div>
      <div className="max-h-64 overflow-y-auto mt-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

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
  const [religionData, setReligionData] = useState([]);
  const [addressData, setAddressData] = useState([]);
  const [orientationData, setOrientationData] = useState([]);
  const [selectedChart, setSelectedChart] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [sortOptions, setSortOptions] = useState({
    age: { key: "label", direction: "asc" },
    education: { key: "label", direction: "asc" },
    ethnicity: { key: "label", direction: "asc" },
    year: { key: "label", direction: "asc" },
    section: { key: "label", direction: "asc" },
    religion: { key: "label", direction: "asc" },
    address: { key: "label", direction: "asc" },
    orientation: { key: "label", direction: "asc" },
  });

  useEffect(() => {
    const fetchData = async () => {
      // BYPASSING ACADEMIC PERIOD - Fetch all data regardless of selectedPeriod
      setLocalLoading(true);
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

        console.log(
          "Fetching all participants (BYPASSING ACADEMIC PERIOD, cursor-based)..."
        );
        const [allStudents, allStaff, allCommunity] = await Promise.all([
          fetchAllDocuments(studentCollectionId),
          fetchAllDocuments(staffFacultyCollectionId),
          fetchAllDocuments(communityCollectionId),
        ]);

        const allParticipants = [...allStudents, ...allStaff, ...allCommunity];

        console.log("Total participants fetched:", allParticipants.length);

        if (allParticipants.length === 0) {
          setHasParticipants(false);
          return;
        }

        setHasParticipants(true);
        // Normalize and process gender distribution
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

        // Normalize and process age + gender distribution
        const ageCounts = allParticipants.reduce((acc, participant) => {
          const ageGroup = getAgeGroup(participant.age);
          const sex = participant.sex?.toLowerCase() || "not specified";

          if (!acc[ageGroup]) {
            acc[ageGroup] = { male: 0, female: 0 };
          }

          // Count only if normalized value matches "male" or "female"
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
          const education = participant.program || "Not Specified";
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
        const ethnicityData = processEthnicityData(allParticipants);
        setEthnicityData(ethnicityData);

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

        // Process religion distribution
        const religionCounts = allParticipants.reduce((acc, participant) => {
          const religion = participant.religion || "Not Specified";
          const sex = participant.sex?.toLowerCase() || "not specified";
          if (!acc[religion]) {
            acc[religion] = { male: 0, female: 0 };
          }
          if (sex === "male" || sex === "female") {
            acc[religion][sex]++;
          }
          return acc;
        }, {});

        setReligionData(
          Object.entries(religionCounts)
            .map(([religion, counts]) => ({
              religion,
              male: counts.male || 0,
              female: counts.female || 0,
              total: (counts.male || 0) + (counts.female || 0),
            }))
            .sort((a, b) => {
              if (a.religion === "Not Specified") return 1;
              if (b.religion === "Not Specified") return -1;
              return a.religion.localeCompare(b.religion);
            })
        );

        // Process address distribution (Luzon only)
        const luzonKeywords = [
          "aurora",
          "benguet",
          "manila",
          "quezon",
          "makati",
          "pasig",
          "taguig",
          "pasay",
          "caloocan",
          "marikina",
          "paranaque",
          "las pinas",
          "muntinlupa",
          "malabon",
          "navotas",
          "san juan",
          "mandaluyong",
          "valenzuela",
          "pateros",
          "bulacan",
          "pampanga",
          "tarlac",
          "bataan",
          "zambales",
          "nueva ecija",
          "cavite",
          "laguna",
          "batangas",
          "rizal",
          "ilocos",
          "la union",
          "pangasinan",
          "ifugao",
          "isabela",
          "kalinga",
          "apayao",
          "mt. province",
          "batanes",
          "cagayan",
          "nueva vizcaya",
          "quirino",
        ];

        const addressCounts = allParticipants.reduce((acc, participant) => {
          const address = participant.address || "Not Specified";
          const sex = participant.sex?.toLowerCase() || "not specified";

          let city = "Not Specified";
          if (address && address !== "Not Specified") {
            const addressLower = address.toLowerCase();

            const matched = luzonKeywords.find((keyword) =>
              addressLower.includes(keyword)
            );
            city = matched
              ? matched.charAt(0).toUpperCase() + matched.slice(1)
              : "Other Cities";
          }

          if (!acc[city]) {
            acc[city] = { male: 0, female: 0 };
          }
          if (sex === "male" || sex === "female") {
            acc[city][sex]++;
          }
          return acc;
        }, {});

        setAddressData(
          Object.entries(addressCounts)
            .map(([city, counts]) => ({
              city,
              male: counts.male || 0,
              female: counts.female || 0,
              total: (counts.male || 0) + (counts.female || 0),
            }))
            .sort((a, b) => {
              if (a.city === "Not Specified") return 1;
              if (b.city === "Not Specified") return -1;
              if (a.city === "Other Cities") return 1;
              if (b.city === "Other Cities") return -1;
              return a.city.localeCompare(b.city);
            })
        );

        // Process sexual orientation distribution
        const orientationCounts = allParticipants.reduce((acc, participant) => {
          const orientation = participant.orientation || "Not Specified";
          const sex = participant.sex?.toLowerCase() || "not specified";
          if (!acc[orientation]) {
            acc[orientation] = { male: 0, female: 0 };
          }
          if (sex === "male" || sex === "female") {
            acc[orientation][sex]++;
          }
          return acc;
        }, {});

        setOrientationData(
          Object.entries(orientationCounts)
            .map(([orientation, counts]) => ({
              orientation,
              male: counts.male || 0,
              female: counts.female || 0,
              total: (counts.male || 0) + (counts.female || 0),
            }))
            .sort((a, b) => {
              if (a.orientation === "Not Specified") return 1;
              if (b.orientation === "Not Specified") return -1;
              return a.orientation.localeCompare(b.orientation);
            })
        );

        console.log("Data processing completed successfully");
      } catch (error) {
        console.error("Error fetching data:", error);
        // Set default values for all data
        setGenderData([]);
        setAgeData([]);
        setEducationData([]);
        setEthnicityData([]);
        setYearData([]);
        setSectionData([]);
        setReligionData([]);
        setAddressData([]);
        setOrientationData([]);
        setHasParticipants(false);
      } finally {
        setLocalLoading(false);
        setLoading(false);
      }
    };

    fetchData();
  }, [setHasParticipants, setLoading]); // Removed selectedPeriod dependency

  if (localLoading) {
    return (
      <div className="grid grid-cols-2 gap-8">
        <SkeletonAnalysisCard
          title="Gender Distribution"
          description="Distribution by gender (All Academic Periods)"
        />
        <SkeletonAnalysisCard
          title="Age Distribution"
          description="Distribution by age group (All Academic Periods)"
        />
        <SkeletonAnalysisCard
          title="Education Level Distribution"
          description="Distribution by education level (All Academic Periods)"
        />
        <SkeletonAnalysisCard
          title="Ethnicity Distribution"
          description="Distribution by ethnicity (All Academic Periods)"
        />
        <SkeletonAnalysisCard
          title="Year Level Distribution"
          description="Distribution by year level (All Academic Periods)"
        />
        <SkeletonAnalysisCard
          title="Section Distribution"
          description="Distribution by section (All Academic Periods)"
        />
        <SkeletonAnalysisCard
          title="Religion Distribution"
          description="Distribution by religion (All Academic Periods)"
        />
        <SkeletonAnalysisCard
          title="Address Distribution"
          description="Distribution by city/municipality (All Academic Periods)"
        />
        <SkeletonAnalysisCard
          title="Sexual Orientation Distribution"
          description="Distribution by sexual orientation (All Academic Periods)"
        />
      </div>
    );
  }

  // Helper to sort data
  function sortData(data, type) {
    const { key, direction } = sortOptions[type];
    if (!data || data.length === 0) return data;
    let labelKey =
      type === "age"
        ? "age"
        : type === "education"
        ? "level"
        : type === "ethnicity"
        ? "name"
        : type === "year"
        ? "year"
        : type === "section"
        ? "section"
        : type === "religion"
        ? "religion"
        : type === "address"
        ? "city"
        : type === "orientation"
        ? "orientation"
        : null;
    if (!labelKey) return data;
    let sorted = [...data];
    if (key === "label") {
      sorted.sort((a, b) => {
        if (a[labelKey] === "Grand Total") return 1;
        if (b[labelKey] === "Grand Total") return -1;
        if (direction === "asc") return a[labelKey].localeCompare(b[labelKey]);
        else return b[labelKey].localeCompare(a[labelKey]);
      });
    } else if (key === "total") {
      sorted.sort((a, b) => {
        if (a[labelKey] === "Grand Total") return 1;
        if (b[labelKey] === "Grand Total") return -1;
        if (direction === "asc") return (a.total || 0) - (b.total || 0);
        else return (b.total || 0) - (a.total || 0);
      });
    }
    return sorted;
  }

  // Helper to render sort controls
  function SortControls({ type }) {
    return (
      <div className="flex gap-2 items-center text-xs">
        <span>Sort by:</span>
        <select
          value={sortOptions[type].key}
          onChange={(e) =>
            setSortOptions((o) => ({
              ...o,
              [type]: { ...o[type], key: e.target.value },
            }))
          }
          className="border rounded px-1 py-0.5"
        >
          <option value="label">A-Z</option>
          <option value="total">Total</option>
        </select>
        <button
          onClick={() =>
            setSortOptions((o) => ({
              ...o,
              [type]: {
                ...o[type],
                direction: o[type].direction === "asc" ? "desc" : "asc",
              },
            }))
          }
          className="border rounded px-1 py-0.5"
          title={
            sortOptions[type].direction === "asc" ? "Ascending" : "Descending"
          }
        >
          {sortOptions[type].direction === "asc" ? "↑" : "↓"}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Gender Distribution Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gender Distribution</CardTitle>
            <CardDescription>
              Distribution by gender (All Academic Periods)
            </CardDescription>
          </div>
          <button
            onClick={() => {
              setSelectedChart({
                title: "Gender Distribution",
                data: genderData,
                type: "gender",
              });
              setIsDialogOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="count"
                  nameKey="gender"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ gender, percentage }) => `${gender} ${percentage}%`}
                >
                  {genderData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={genderColors[entry.gender.toLowerCase()]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="max-h-64 overflow-y-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gender</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {genderData.map((item) => (
                  <TableRow key={item.gender}>
                    <TableCell>{item.gender}</TableCell>
                    <TableCell>{item.count}</TableCell>
                    <TableCell>{item.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Age Distribution Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Age Distribution</CardTitle>
            <CardDescription>
              Distribution by age group (All Academic Periods)
            </CardDescription>
          </div>
          <SortControls type="age" />
          <button
            onClick={() => {
              setSelectedChart({
                title: "Age Distribution",
                data: ageData,
                type: "age",
              });
              setIsDialogOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortData(ageData, "age")}>
                <XAxis dataKey="age" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="male"
                  name="Male"
                  fill={genderColors.male}
                  stackId="a"
                />
                <Bar
                  dataKey="female"
                  name="Female"
                  fill={genderColors.female}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="max-h-64 overflow-y-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Male</TableHead>
                  <TableHead>Female</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortData(ageData, "age").map((item) => (
                  <TableRow key={item.age}>
                    <TableCell>{item.age}</TableCell>
                    <TableCell>{item.male}</TableCell>
                    <TableCell>{item.female}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>Grand Total</TableCell>
                  <TableCell>
                    {sortData(ageData, "age").reduce(
                      (sum, row) => sum + (parseInt(row.male) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(ageData, "age").reduce(
                      (sum, row) => sum + (parseInt(row.female) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(ageData, "age").reduce(
                      (sum, row) => sum + (parseInt(row.total) || 0),
                      0
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Education Distribution Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Education Level Distribution</CardTitle>
            <CardDescription>
              Distribution by education level (All Academic Periods)
            </CardDescription>
          </div>
          <SortControls type="education" />
          <button
            onClick={() => {
              setSelectedChart({
                title: "Education Level Distribution",
                data: educationData,
                type: "education",
              });
              setIsDialogOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortData(educationData, "education")}
                layout="vertical"
              >
                <XAxis type="number" />
                <YAxis dataKey="level" type="category" width={150} />
                <Tooltip />
                <Bar
                  dataKey="male"
                  name="Male"
                  fill={genderColors.male}
                  stackId="a"
                />
                <Bar
                  dataKey="female"
                  name="Female"
                  fill={genderColors.female}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="max-h-64 overflow-y-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Education Level</TableHead>
                  <TableHead>Male</TableHead>
                  <TableHead>Female</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortData(educationData, "education").map((item) => (
                  <TableRow key={item.level}>
                    <TableCell>{item.level}</TableCell>
                    <TableCell>{item.male}</TableCell>
                    <TableCell>{item.female}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>Grand Total</TableCell>
                  <TableCell>
                    {sortData(educationData, "education").reduce(
                      (sum, row) => sum + (parseInt(row.male) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(educationData, "education").reduce(
                      (sum, row) => sum + (parseInt(row.female) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(educationData, "education").reduce(
                      (sum, row) => sum + (parseInt(row.total) || 0),
                      0
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Ethnicity Distribution Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Ethnicity Distribution</CardTitle>
            <CardDescription>
              Distribution by ethnicity (All Academic Periods)
            </CardDescription>
          </div>
          <SortControls type="ethnicity" />
          <button
            onClick={() => {
              setSelectedChart({
                title: "Ethnicity Distribution",
                data: ethnicityData,
                type: "ethnicity",
              });
              setIsDialogOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortData(ethnicityData, "ethnicity")}>
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="male"
                  name="Male"
                  fill={genderColors.male}
                  stackId="a"
                />
                <Bar
                  dataKey="female"
                  name="Female"
                  fill={genderColors.female}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="max-h-64 overflow-y-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ethnicity</TableHead>
                  <TableHead>Male</TableHead>
                  <TableHead>Female</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortData(ethnicityData, "ethnicity").map((item) => (
                  <TableRow key={item.name}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.male}</TableCell>
                    <TableCell>{item.female}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>Grand Total</TableCell>
                  <TableCell>
                    {sortData(ethnicityData, "ethnicity").reduce(
                      (sum, row) => sum + (parseInt(row.male) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(ethnicityData, "ethnicity").reduce(
                      (sum, row) => sum + (parseInt(row.female) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(ethnicityData, "ethnicity").reduce(
                      (sum, row) => sum + (parseInt(row.total) || 0),
                      0
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Year Level Distribution Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Year Level Distribution</CardTitle>
            <CardDescription>
              Distribution by year level (All Academic Periods)
            </CardDescription>
          </div>
          <SortControls type="year" />
          <button
            onClick={() => {
              setSelectedChart({
                title: "Year Level Distribution",
                data: yearData,
                type: "year",
              });
              setIsDialogOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortData(yearData, "year")}>
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="male"
                  name="Male"
                  fill={genderColors.male}
                  stackId="a"
                />
                <Bar
                  dataKey="female"
                  name="Female"
                  fill={genderColors.female}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="max-h-64 overflow-y-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year Level</TableHead>
                  <TableHead>Male</TableHead>
                  <TableHead>Female</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortData(yearData, "year").map((item) => (
                  <TableRow key={item.year}>
                    <TableCell>{item.year}</TableCell>
                    <TableCell>{item.male}</TableCell>
                    <TableCell>{item.female}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>Grand Total</TableCell>
                  <TableCell>
                    {sortData(yearData, "year").reduce(
                      (sum, row) => sum + (parseInt(row.male) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(yearData, "year").reduce(
                      (sum, row) => sum + (parseInt(row.female) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(yearData, "year").reduce(
                      (sum, row) => sum + (parseInt(row.total) || 0),
                      0
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Section Distribution Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Section Distribution</CardTitle>
            <CardDescription>
              Distribution by section (All Academic Periods)
            </CardDescription>
          </div>
          <SortControls type="section" />
          <button
            onClick={() => {
              setSelectedChart({
                title: "Section Distribution",
                data: sectionData,
                type: "section",
              });
              setIsDialogOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortData(sectionData, "section")}
                layout="vertical"
              >
                <XAxis type="number" />
                <YAxis dataKey="section" type="category" width={150} />
                <Tooltip />
                <Bar
                  dataKey="male"
                  name="Male"
                  fill={genderColors.male}
                  stackId="a"
                />
                <Bar
                  dataKey="female"
                  name="Female"
                  fill={genderColors.female}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="max-h-64 overflow-y-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead>Male</TableHead>
                  <TableHead>Female</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortData(sectionData, "section").map((item) => (
                  <TableRow key={item.section}>
                    <TableCell>{item.section}</TableCell>
                    <TableCell>{item.male}</TableCell>
                    <TableCell>{item.female}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>Grand Total</TableCell>
                  <TableCell>
                    {sortData(sectionData, "section").reduce(
                      (sum, row) => sum + (parseInt(row.male) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(sectionData, "section").reduce(
                      (sum, row) => sum + (parseInt(row.female) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(sectionData, "section").reduce(
                      (sum, row) => sum + (parseInt(row.total) || 0),
                      0
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Religion Distribution Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Religion Distribution</CardTitle>
            <CardDescription>
              Distribution by religion (All Academic Periods)
            </CardDescription>
          </div>
          <SortControls type="religion" />
          <button
            onClick={() => {
              setSelectedChart({
                title: "Religion Distribution",
                data: religionData,
                type: "religion",
              });
              setIsDialogOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortData(religionData, "religion")}
                layout="vertical"
              >
                <XAxis type="number" />
                <YAxis dataKey="religion" type="category" width={150} />
                <Tooltip />
                <Bar
                  dataKey="male"
                  name="Male"
                  fill={genderColors.male}
                  stackId="a"
                />
                <Bar
                  dataKey="female"
                  name="Female"
                  fill={genderColors.female}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="max-h-64 overflow-y-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Religion</TableHead>
                  <TableHead>Male</TableHead>
                  <TableHead>Female</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortData(religionData, "religion").map((item) => (
                  <TableRow key={item.religion}>
                    <TableCell>{item.religion}</TableCell>
                    <TableCell>{item.male}</TableCell>
                    <TableCell>{item.female}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>Grand Total</TableCell>
                  <TableCell>
                    {sortData(religionData, "religion").reduce(
                      (sum, row) => sum + (parseInt(row.male) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(religionData, "religion").reduce(
                      (sum, row) => sum + (parseInt(row.female) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(religionData, "religion").reduce(
                      (sum, row) => sum + (parseInt(row.total) || 0),
                      0
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Address Distribution Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Address Distribution</CardTitle>
            <CardDescription>
              Distribution by city/municipality (All Academic Periods)
            </CardDescription>
          </div>
          <SortControls type="address" />
          <button
            onClick={() => {
              setSelectedChart({
                title: "Address Distribution",
                data: addressData,
                type: "address",
              });
              setIsDialogOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortData(addressData, "address")}
                layout="vertical"
              >
                <XAxis type="number" />
                <YAxis dataKey="city" type="category" width={150} />
                <Tooltip />
                <Bar
                  dataKey="male"
                  name="Male"
                  fill={genderColors.male}
                  stackId="a"
                />
                <Bar
                  dataKey="female"
                  name="Female"
                  fill={genderColors.female}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="max-h-64 overflow-y-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City/Municipality</TableHead>
                  <TableHead>Male</TableHead>
                  <TableHead>Female</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortData(addressData, "address").map((item) => (
                  <TableRow key={item.city}>
                    <TableCell>{item.city}</TableCell>
                    <TableCell>{item.male}</TableCell>
                    <TableCell>{item.female}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>Grand Total</TableCell>
                  <TableCell>
                    {sortData(addressData, "address").reduce(
                      (sum, row) => sum + (parseInt(row.male) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(addressData, "address").reduce(
                      (sum, row) => sum + (parseInt(row.female) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(addressData, "address").reduce(
                      (sum, row) => sum + (parseInt(row.total) || 0),
                      0
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Sexual Orientation Distribution Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sexual Orientation Distribution</CardTitle>
            <CardDescription>
              Distribution by sexual orientation (All Academic Periods)
            </CardDescription>
          </div>
          <SortControls type="orientation" />
          <button
            onClick={() => {
              setSelectedChart({
                title: "Sexual Orientation Distribution",
                data: orientationData,
                type: "orientation",
              });
              setIsDialogOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortData(orientationData, "orientation")}
                layout="vertical"
              >
                <XAxis type="number" />
                <YAxis dataKey="orientation" type="category" width={150} />
                <Tooltip />
                <Bar
                  dataKey="male"
                  name="Male"
                  fill={genderColors.male}
                  stackId="a"
                />
                <Bar
                  dataKey="female"
                  name="Female"
                  fill={genderColors.female}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="max-h-64 overflow-y-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sexual Orientation</TableHead>
                  <TableHead>Male</TableHead>
                  <TableHead>Female</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortData(orientationData, "orientation").map((item) => (
                  <TableRow key={item.orientation}>
                    <TableCell>{item.orientation}</TableCell>
                    <TableCell>{item.male}</TableCell>
                    <TableCell>{item.female}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>Grand Total</TableCell>
                  <TableCell>
                    {sortData(orientationData, "orientation").reduce(
                      (sum, row) => sum + (parseInt(row.male) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(orientationData, "orientation").reduce(
                      (sum, row) => sum + (parseInt(row.female) || 0),
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {sortData(orientationData, "orientation").reduce(
                      (sum, row) => sum + (parseInt(row.total) || 0),
                      0
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for enlarged view */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[90vw] h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedChart?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                {selectedChart?.type === "gender" && (
                  <PieChart>
                    <Pie
                      data={selectedChart.data}
                      dataKey="count"
                      nameKey="gender"
                      cx="50%"
                      cy="50%"
                      outerRadius={200}
                      label={({ gender, percentage }) =>
                        `${gender} ${percentage}%`
                      }
                    >
                      {selectedChart.data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={genderColors[entry.gender.toLowerCase()]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                )}
                {(selectedChart?.type === "age" ||
                  selectedChart?.type === "ethnicity" ||
                  selectedChart?.type === "year") && (
                  <BarChart data={selectedChart.data}>
                    <XAxis
                      dataKey={
                        selectedChart.type === "age"
                          ? "age"
                          : selectedChart.type === "ethnicity"
                          ? "name"
                          : "year"
                      }
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="male"
                      name="Male"
                      fill={genderColors.male}
                      stackId="a"
                    />
                    <Bar
                      dataKey="female"
                      name="Female"
                      fill={genderColors.female}
                      stackId="a"
                    />
                  </BarChart>
                )}
                {(selectedChart?.type === "education" ||
                  selectedChart?.type === "section" ||
                  selectedChart?.type === "religion" ||
                  selectedChart?.type === "address" ||
                  selectedChart?.type === "orientation") && (
                  <BarChart data={selectedChart.data} layout="vertical">
                    <XAxis type="number" />
                    <YAxis
                      dataKey={
                        selectedChart.type === "education"
                          ? "level"
                          : selectedChart.type === "section"
                          ? "section"
                          : selectedChart.type === "religion"
                          ? "religion"
                          : selectedChart.type === "address"
                          ? "city"
                          : selectedChart.type === "orientation"
                          ? "orientation"
                          : ""
                      }
                      type="category"
                      width={150}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="male"
                      name="Male"
                      fill={genderColors.male}
                      stackId="a"
                    />
                    <Bar
                      dataKey="female"
                      name="Female"
                      fill={genderColors.female}
                      stackId="a"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            <div className="max-h-[300px] overflow-y-auto mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectedChart?.type === "gender" ? (
                      <>
                        <TableHead>Gender</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Percentage</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>
                          {selectedChart?.type === "age"
                            ? "Age Group"
                            : selectedChart?.type === "education"
                            ? "Education Level"
                            : selectedChart?.type === "ethnicity"
                            ? "Ethnicity"
                            : selectedChart?.type === "year"
                            ? "Year Level"
                            : selectedChart?.type === "section"
                            ? "Section"
                            : selectedChart?.type === "religion"
                            ? "Religion"
                            : selectedChart?.type === "address"
                            ? "City/Municipality"
                            : selectedChart?.type === "orientation"
                            ? "Sexual Orientation"
                            : ""}
                        </TableHead>
                        <TableHead>Male</TableHead>
                        <TableHead>Female</TableHead>
                        <TableHead>Total</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedChart?.data.map((item) => (
                    <TableRow
                      key={
                        item.gender ||
                        item.age ||
                        item.level ||
                        item.name ||
                        item.year ||
                        item.section ||
                        item.religion ||
                        item.city ||
                        item.orientation
                      }
                    >
                      <TableCell>
                        {item.gender ||
                          item.age ||
                          item.level ||
                          item.name ||
                          item.year ||
                          item.section ||
                          item.religion ||
                          item.city ||
                          item.orientation}
                      </TableCell>
                      {selectedChart.type === "gender" ? (
                        <>
                          <TableCell>{item.count}</TableCell>
                          <TableCell>{item.percentage}%</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{item.male}</TableCell>
                          <TableCell>{item.female}</TableCell>
                          <TableCell>{item.total}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
