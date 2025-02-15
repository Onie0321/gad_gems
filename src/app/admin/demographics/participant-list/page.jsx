"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Users,
  GraduationCap,
  Briefcase,
  Home,
  ArrowUpDown,
  Eye,
  Edit2,
  Male,
  Female,
} from "lucide-react";
import {
  databases,
  databaseId,
  studentsCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";
import { Query } from "appwrite";

const SortableTableHead = ({ children, onClick }) => (
  <TableHead
    onClick={onClick}
    className="bg-gray-100 text-black font-bold cursor-pointer hover:bg-gray-200"
  >
    <div className="flex items-center gap-2">
      {children}
      <ArrowUpDown className="h-4 w-4" />
    </div>
  </TableHead>
);

const ParticipantDetails = ({ data, title }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="ghost" size="icon">
        <Eye className="h-4 w-4" />
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {Object.entries(data).map(([key, value]) =>
          key !== "$id" ? (
            <div key={key} className="grid grid-cols-2 gap-4">
              <span className="font-semibold">{key}</span>
              <span>{value?.toString() || ""}</span>
            </div>
          ) : null
        )}
      </div>
    </DialogContent>
  </Dialog>
);

export default function ParticipantList({ selectedPeriod }) {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState({
    students: [],
    staffFaculty: [],
    community: [],
  });
  const [activeParticipantTab, setActiveParticipantTab] = useState("students");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!selectedPeriod) return;

      try {
        const [students, staff, community] = await Promise.all([
          databases.listDocuments(databaseId, studentsCollectionId, [
            Query.equal("academicPeriodId", selectedPeriod),
            Query.equal("isArchived", false),
          ]),
          databases.listDocuments(databaseId, staffFacultyCollectionId, [
            Query.equal("academicPeriodId", selectedPeriod),
            Query.equal("isArchived", false),
          ]),
          databases.listDocuments(databaseId, communityCollectionId, [
            Query.equal("academicPeriodId", selectedPeriod),
            Query.equal("isArchived", false),
          ]),
        ]);

        setParticipants({
          students: students.documents,
          staffFaculty: staff.documents,
          community: community.documents,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching participants:", error);
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [selectedPeriod]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  const handleEdit = (participant) => {
    setSelectedParticipant(participant);
    // Add your edit logic here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const participantCounts = {
    students: participants.students.length,
    staffFaculty: participants.staffFaculty.length,
    community: participants.community.length,
    total:
      participants.students.length +
      participants.staffFaculty.length +
      participants.community.length,
    maleCounts: {
      students: participants.students.filter(
        (p) => p.sex?.toLowerCase() === "male"
      ).length,
      staffFaculty: participants.staffFaculty.filter(
        (p) => p.sex?.toLowerCase() === "male"
      ).length,
      community: participants.community.filter(
        (p) => p.sex?.toLowerCase() === "male"
      ).length,
    },
    femaleCounts: {
      students: participants.students.filter(
        (p) => p.sex?.toLowerCase() === "female"
      ).length,
      staffFaculty: participants.staffFaculty.filter(
        (p) => p.sex?.toLowerCase() === "female"
      ).length,
      community: participants.community.filter(
        (p) => p.sex?.toLowerCase() === "female"
      ).length,
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total Participants</h3>
              <p className="text-2xl font-bold">{participantCounts.total}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <Male className="h-4 w-4" />
                  {participantCounts.maleCounts.students +
                    participantCounts.maleCounts.staffFaculty +
                    participantCounts.maleCounts.community}
                </span>
                <span className="flex items-center gap-1">
                  <Female className="h-4 w-4" />
                  {participantCounts.femaleCounts.students +
                    participantCounts.femaleCounts.staffFaculty +
                    participantCounts.femaleCounts.community}
                </span>
              </div>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Students</h3>
              <p className="text-2xl font-bold">{participantCounts.students}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <Male className="h-4 w-4" />
                  {participantCounts.maleCounts.students}
                </span>
                <span className="flex items-center gap-1">
                  <Female className="h-4 w-4" />
                  {participantCounts.femaleCounts.students}
                </span>
              </div>
            </div>
            <GraduationCap className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Staff/Faculty</h3>
              <p className="text-2xl font-bold">
                {participantCounts.staffFaculty}
              </p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <Male className="h-4 w-4" />
                  {participantCounts.maleCounts.staffFaculty}
                </span>
                <span className="flex items-center gap-1">
                  <Female className="h-4 w-4" />
                  {participantCounts.femaleCounts.staffFaculty}
                </span>
              </div>
            </div>
            <Briefcase className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Community</h3>
              <p className="text-2xl font-bold">
                {participantCounts.community}
              </p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <Male className="h-4 w-4" />
                  {participantCounts.maleCounts.community}
                </span>
                <span className="flex items-center gap-1">
                  <Female className="h-4 w-4" />
                  {participantCounts.femaleCounts.community}
                </span>
              </div>
            </div>
            <Home className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Participant Tables */}
      <Tabs
        value={activeParticipantTab}
        onValueChange={setActiveParticipantTab}
      >
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="staffFaculty">Staff/Faculty</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead onClick={() => handleSort("name")}>
                  Name
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("studentId")}>
                  Student ID
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("sex")}>
                  Sex
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("age")}>
                  Age
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("school")}>
                  School
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("year")}>
                  Year
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("section")}>
                  Section
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("ethnicGroup")}>
                  Ethnic Group
                </SortableTableHead>
                <TableHead className="bg-gray-100 text-black font-bold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSortedData(participants.students).map((student) => (
                <TableRow key={student.$id}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.studentId}</TableCell>
                  <TableCell>{student.sex}</TableCell>
                  <TableCell>{student.age}</TableCell>
                  <TableCell>{student.school}</TableCell>
                  <TableCell>{student.year}</TableCell>
                  <TableCell>{student.section}</TableCell>
                  <TableCell>{student.ethnicGroup}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <ParticipantDetails
                        data={student}
                        title="Student Details"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(student)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="staffFaculty">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead onClick={() => handleSort("name")}>
                  Name
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("staffFacultyId")}>
                  Staff/Faculty ID
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("sex")}>
                  Sex
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("age")}>
                  Age
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("address")}>
                  Address
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("ethnicGroup")}>
                  Ethnic Group
                </SortableTableHead>
                <TableHead className="bg-gray-100 text-black font-bold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSortedData(participants.staffFaculty).map((staff) => (
                <TableRow key={staff.$id}>
                  <TableCell>{staff.name}</TableCell>
                  <TableCell>{staff.staffFacultyId}</TableCell>
                  <TableCell>{staff.sex}</TableCell>
                  <TableCell>{staff.age}</TableCell>
                  <TableCell>{staff.address}</TableCell>
                  <TableCell>{staff.ethnicGroup}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <ParticipantDetails
                        data={staff}
                        title="Staff/Faculty Details"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(staff)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="community">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead onClick={() => handleSort("name")}>
                  Name
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("sex")}>
                  Sex
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("age")}>
                  Age
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("address")}>
                  Address
                </SortableTableHead>
                <SortableTableHead onClick={() => handleSort("ethnicGroup")}>
                  Ethnic Group
                </SortableTableHead>
                <TableHead className="bg-gray-100 text-black font-bold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSortedData(participants.community).map((member) => (
                <TableRow key={member.$id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.sex}</TableCell>
                  <TableCell>{member.age}</TableCell>
                  <TableCell>{member.address}</TableCell>
                  <TableCell>{member.ethnicGroup}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <ParticipantDetails
                        data={member}
                        title="Community Member Details"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(member)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
