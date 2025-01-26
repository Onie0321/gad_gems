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
  participantCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";

const genderColors = {
  male: "#2196F3",
  female: "#E91E63",
  "not specified": "#9E9E9E",
};

const getAgeGroup = (age) => {
  if (!age || age === "Not Specified") return "Not Specified";
  age = parseInt(age);
  if (age < 18) return "Under 18";
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

  useEffect(() => {
    const fetchData = async () => {
      if (selectedPeriod) {
        setLocalLoading(true);
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
    <div className="grid grid-cols-2 gap-8">
      {/* Gender Distribution Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gender Distribution</CardTitle>
            <CardDescription>Distribution by gender</CardDescription>
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
            <CardDescription>Distribution by age group</CardDescription>
          </div>
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
              <BarChart data={ageData}>
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
                {ageData.map((item) => (
                  <TableRow key={item.age}>
                    <TableCell>{item.age}</TableCell>
                    <TableCell>{item.male}</TableCell>
                    <TableCell>{item.female}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
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
            <CardDescription>Distribution by education level</CardDescription>
          </div>
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
              <BarChart data={educationData} layout="vertical">
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
                {educationData.map((item) => (
                  <TableRow key={item.level}>
                    <TableCell>{item.level}</TableCell>
                    <TableCell>{item.male}</TableCell>
                    <TableCell>{item.female}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
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
            <CardDescription>Distribution by ethnicity</CardDescription>
          </div>
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
              <BarChart data={ethnicityData}>
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
                {ethnicityData.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.male}</TableCell>
                    <TableCell>{item.female}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
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
            <CardDescription>Distribution by year level</CardDescription>
          </div>
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
              <BarChart data={yearData}>
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
                {yearData.map((item) => (
                  <TableRow key={item.year}>
                    <TableCell>{item.year}</TableCell>
                    <TableCell>{item.male}</TableCell>
                    <TableCell>{item.female}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
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
            <CardDescription>Distribution by section</CardDescription>
          </div>
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
              <BarChart data={sectionData} layout="vertical">
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
                {sectionData.map((item) => (
                  <TableRow key={item.section}>
                    <TableCell>{item.section}</TableCell>
                    <TableCell>{item.male}</TableCell>
                    <TableCell>{item.female}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
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
                  selectedChart?.type === "section") && (
                  <BarChart data={selectedChart.data} layout="vertical">
                    <XAxis type="number" />
                    <YAxis
                      dataKey={
                        selectedChart.type === "education" ? "level" : "section"
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
                        item.section
                      }
                    >
                      <TableCell>
                        {item.gender ||
                          item.age ||
                          item.level ||
                          item.name ||
                          item.year ||
                          item.section}
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
