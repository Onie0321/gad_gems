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
} from "lucide-react";
import {
  databases,
  databaseId,
  studentsCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SortableTableHead = ({ children, onClick }) => (
  <TableHead
    onClick={onClick}
    className="bg-gray-200 text-black font-bold cursor-pointer hover:bg-gray-300"
  >
    <div className="flex items-center gap-2">
      {children}
      <ArrowUpDown className="h-4 w-4" />
    </div>
  </TableHead>
);

export const ParticipantDetails = ({ data, title }) => (
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
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div>
              <strong>Name:</strong> {data.name}
            </div>
            <div>
              <strong>Sex:</strong> {data.sex}
            </div>
            <div>
              <strong>Age:</strong> {data.age}
            </div>
            <div>
              <strong>School:</strong> {data.school}
            </div>
            <div>
              <strong>Year:</strong> {data.year}
            </div>
            <div>
              <strong>Section:</strong> {data.section}
            </div>

            <div>
              <strong>Address:</strong> {data.address}
            </div>
            <div>
              <strong>Ethnic Group:</strong>{" "}
              {data.ethnicGroup?.toLowerCase() === "other"
                ? data.otherEthnicGroup || "Other"
                : data.ethnicGroup}
            </div>
          </CardContent>
        </Card>
      </div>
    </DialogContent>
  </Dialog>
);

export function ParticipantList({ selectedPeriod }) {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState({
    students: [],
    staffFaculty: [],
    community: [],
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!selectedPeriod) return;

      try {
        const [students, staffFaculty, community] = await Promise.all([
          databases.listDocuments(databaseId, studentsCollectionId, [
            Query.equal("academicPeriodId", selectedPeriod),
          ]),
          databases.listDocuments(databaseId, staffFacultyCollectionId, [
            Query.equal("academicPeriodId", selectedPeriod),
          ]),
          databases.listDocuments(databaseId, communityCollectionId, [
            Query.equal("academicPeriodId", selectedPeriod),
          ]),
        ]);

        setParticipants({
          students: students.documents,
          staffFaculty: staffFaculty.documents,
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
    // Implement edit functionality
    console.log("Edit participant:", participant);
  };

  const truncateText = (text, maxLength = 20) => {
    if (!text) return ""; // Handle null/undefined values
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const getPaginatedData = (data) => {
    const sorted = getSortedData(data);
    const startIndex = (currentPage - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  };

  const getTotalPages = (dataLength) => {
    return Math.ceil(dataLength / pageSize);
  };

  const getEthnicGroupDisplay = (participant) => {
    if (participant.ethnicGroup?.toLowerCase() === "other") {
      return participant.otherEthnicGroup || "Other";
    }
    return participant.ethnicGroup;
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Students ({participants.students.length})
          </TabsTrigger>
          <TabsTrigger value="staffFaculty" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Staff/Faculty ({participants.staffFaculty.length})
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Community ({participants.community.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student List</CardTitle>
              <CardDescription>
                Manage and view all student participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm">Rows per page:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        onClick={() => handleSort("studentId")}
                      >
                        Student ID
                      </SortableTableHead>
                      <SortableTableHead onClick={() => handleSort("name")}>
                        Name
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
                      <SortableTableHead onClick={() => handleSort("address")}>
                        Address
                      </SortableTableHead>
                      <SortableTableHead
                        onClick={() => handleSort("ethnicGroup")}
                      >
                        Ethnic Group
                      </SortableTableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedData(participants.students).map((student) => (
                      <TableRow key={student.$id}>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell>{truncateText(student.name)}</TableCell>
                        <TableCell>{student.sex}</TableCell>
                        <TableCell>{student.age}</TableCell>
                        <TableCell>{truncateText(student.year)}</TableCell>
                        <TableCell>{truncateText(student.school)}</TableCell>
                        <TableCell className="text-center">
                          {student.section}
                        </TableCell>
                        <TableCell>{truncateText(student.address)}</TableCell>
                        <TableCell>
                          {truncateText(getEthnicGroupDisplay(student))}
                        </TableCell>
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

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(
                      currentPage * pageSize,
                      participants.students.length
                    )}{" "}
                    of {participants.students.length} entries
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(
                            getTotalPages(participants.students.length),
                            p + 1
                          )
                        )
                      }
                      disabled={
                        currentPage ===
                        getTotalPages(participants.students.length)
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staffFaculty">
          <Card>
            <CardHeader>
              <CardTitle>Staff and Faculty List</CardTitle>
              <CardDescription>
                Manage and view all staff and faculty participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm">Rows per page:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        onClick={() => handleSort("staffFacultyId")}
                      >
                        Staff/Faculty ID
                      </SortableTableHead>
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
                      <SortableTableHead
                        onClick={() => handleSort("ethnicGroup")}
                      >
                        Ethnic Group
                      </SortableTableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedData(participants.staffFaculty).map(
                      (staff) => (
                        <TableRow key={staff.$id}>
                          <TableCell>{staff.staffFacultyId}</TableCell>
                          <TableCell>{truncateText(staff.name)}</TableCell>
                          <TableCell>{staff.sex}</TableCell>
                          <TableCell>{staff.age}</TableCell>
                          <TableCell>{truncateText(staff.address)}</TableCell>
                          <TableCell>
                            {truncateText(getEthnicGroupDisplay(staff))}
                          </TableCell>{" "}
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
                      )
                    )}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(
                      currentPage * pageSize,
                      participants.staffFaculty.length
                    )}{" "}
                    of {participants.staffFaculty.length} entries
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(
                            getTotalPages(participants.staffFaculty.length),
                            p + 1
                          )
                        )
                      }
                      disabled={
                        currentPage ===
                        getTotalPages(participants.staffFaculty.length)
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community">
          <Card>
            <CardHeader>
              <CardTitle>Community Members List</CardTitle>
              <CardDescription>
                Manage and view all community participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm">Rows per page:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                      <SortableTableHead
                        onClick={() => handleSort("ethnicGroup")}
                      >
                        Ethnic Group
                      </SortableTableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedData(participants.community).map((member) => (
                      <TableRow key={member.$id}>
                        <TableCell>{truncateText(member.name)}</TableCell>
                        <TableCell>{member.sex}</TableCell>
                        <TableCell>{member.age}</TableCell>
                        <TableCell>{truncateText(member.address)}</TableCell>
                        <TableCell>
                          {truncateText(getEthnicGroupDisplay(member))}
                        </TableCell>
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

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(
                      currentPage * pageSize,
                      participants.community.length
                    )}{" "}
                    of {participants.community.length} entries
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(
                            getTotalPages(participants.community.length),
                            p + 1
                          )
                        )
                      }
                      disabled={
                        currentPage ===
                        getTotalPages(participants.community.length)
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
