"use client";

import React, { useState, useEffect } from "react";
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
  Users,
  GraduationCap,
  Briefcase,
  Home,
  ArrowUpDown,
  Eye,
  Edit2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pagination, PaginationInfo } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Query } from "appwrite";
import {
  databases,
  databaseId,
  studentCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";
import EthnicitySelect from "@/components/shared/EthnicitySelect";

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
            <div>
              <strong>Program:</strong> {data.program}
            </div>
            <div>
              <strong>Orientation:</strong> {data.orientation}
            </div>
            <div>
              <strong>Religion:</strong> {data.religion}
            </div>
            <div>
              <strong>First Gen:</strong> {data.firstGen}
            </div>
            <div>
              <strong>Participant Type:</strong> {data.participantType}
            </div>
            <div>
              <strong>Source:</strong> {data.source}
            </div>
            <div>
              <strong>Created By:</strong> {data.createdBy}
            </div>
            <div>
              <strong>Archived At:</strong> {data.archivedAt}
            </div>
          </CardContent>
        </Card>
      </div>
    </DialogContent>
  </Dialog>
);

const TruncatedText = ({ text, maxLength = 20 }) => {
  if (!text) return "";
  const isTruncated = text.length > maxLength;
  const displayText = isTruncated ? `${text.substring(0, maxLength)}...` : text;

  if (!isTruncated) return <span>{displayText}</span>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{displayText}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Skeleton Table Row Component
const SkeletonTableRow = ({ columns = 16 }) => (
  <TableRow>
    {Array.from({ length: columns }).map((_, index) => (
      <TableCell key={index}>
        <Skeleton className="h-4 w-20" />
      </TableCell>
    ))}
  </TableRow>
);

// Skeleton Card Component for Participant List
const SkeletonParticipantCard = ({ title, description, columns = 16 }) => (
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
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-[100px]" />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <SkeletonTableRow key={rowIndex} columns={columns} />
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Helper to fetch all documents from a collection (cursor-based pagination for >5000 records)
async function fetchAllDocuments(collectionId) {
  const limit = 100;
  let allDocs = [];
  let cursor = undefined;
  let hasMore = true;
  let batch = 0;

  while (hasMore) {
    console.log(
      `Fetching batch ${batch} from collection ${collectionId} (cursor: ${
        cursor || "start"
      })`
    );
    const queries = [Query.limit(limit)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const response = await databases.listDocuments(
      databaseId,
      collectionId,
      queries
    );
    console.log(
      `Fetched ${response.documents.length} documents in batch ${batch}`
    );
    allDocs = allDocs.concat(response.documents);
    if (response.documents.length < limit) {
      hasMore = false;
    } else {
      cursor = response.documents[response.documents.length - 1].$id;
      batch++;
    }
  }
  console.log(`Total fetched from ${collectionId}:`, allDocs.length);
  return allDocs;
}

export function ParticipantList({ selectedPeriod }) {
  const [activeTab, setActiveTab] = useState("students");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [students, setStudents] = useState([]);
  const [staffFaculty, setStaffFaculty] = useState([]);
  const [community, setCommunity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [allStudents, allStaff, allCommunity] = await Promise.all([
        fetchAllDocuments(studentCollectionId),
        fetchAllDocuments(staffFacultyCollectionId),
        fetchAllDocuments(communityCollectionId),
      ]);
      console.log("All students count:", allStudents.length);
      console.log("All staff count:", allStaff.length);
      console.log("All community count:", allCommunity.length);
      setStudents(allStudents);
      setStaffFaculty(allStaff);
      setCommunity(allCommunity);
      setLoading(false);
    }
    fetchAll();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleEdit = (participant) => {
    console.log("Edit participant:", participant);
  };

  const getEthnicGroupDisplay = (participant) => {
    if (participant.ethnicGroup?.toLowerCase() === "other") {
      return participant.otherEthnicGroup || "Other";
    }
    return participant.ethnicGroup;
  };

  // Pagination logic (client-side)
  const getDataForTab = () => {
    if (activeTab === "students") return students;
    if (activeTab === "staffFaculty") return staffFaculty;
    return community;
  };
  const data = getDataForTab();
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const startIndex =
    totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex =
    totalItems === 0 ? 0 : Math.min(currentPage * itemsPerPage, totalItems);

  if (loading) {
    return (
      <div className="space-y-6">
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </TabsTrigger>
            <TabsTrigger
              value="staffFaculty"
              className="flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <SkeletonParticipantCard
              title="Student List"
              description="Manage and view all student participants"
              columns={16}
            />
          </TabsContent>

          <TabsContent value="staffFaculty">
            <SkeletonParticipantCard
              title="Staff and Faculty List"
              description="Manage and view all staff and faculty participants"
              columns={10}
            />
          </TabsContent>

          <TabsContent value="community">
            <SkeletonParticipantCard
              title="Community Members List"
              description="Manage and view all community participants"
              columns={9}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue="students"
        className="space-y-4"
        onValueChange={handleTabChange}
      >
        <TabsList>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Students ({students.length})
          </TabsTrigger>
          <TabsTrigger value="staffFaculty" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Staff/Faculty ({staffFaculty.length})
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Community ({community.length})
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
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
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
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead>Student ID</SortableTableHead>
                      <SortableTableHead>Name</SortableTableHead>
                      <SortableTableHead>Sex</SortableTableHead>
                      <SortableTableHead>Age</SortableTableHead>
                      <SortableTableHead>School</SortableTableHead>
                      <SortableTableHead>Year</SortableTableHead>
                      <SortableTableHead>Section</SortableTableHead>
                      <SortableTableHead>Address</SortableTableHead>
                      <SortableTableHead>Ethnic Group</SortableTableHead>
                      <SortableTableHead>Program</SortableTableHead>
                      <SortableTableHead>Orientation</SortableTableHead>
                      <SortableTableHead>Religion</SortableTableHead>
                      <SortableTableHead>First Gen</SortableTableHead>
                      <SortableTableHead>Participant Type</SortableTableHead>
                      <SortableTableHead>Source</SortableTableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={16}
                          className="text-center text-gray-500"
                        >
                          No student data available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((student) => (
                        <TableRow key={student.$id}>
                          <TableCell>{student.studentId}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.sex}</TableCell>
                          <TableCell>{student.age}</TableCell>
                          <TableCell>{student.school}</TableCell>
                          <TableCell>{student.year}</TableCell>
                          <TableCell>{student.section}</TableCell>
                          <TableCell>
                            <TruncatedText text={student.address} />
                          </TableCell>
                          <TableCell>
                            <TruncatedText
                              text={
                                student.ethnicGroup === "Other"
                                  ? student.otherEthnicGroup
                                  : student.ethnicGroup
                              }
                            />
                          </TableCell>
                          <TableCell>{student.program}</TableCell>
                          <TableCell>{student.orientation}</TableCell>
                          <TableCell>{student.religion}</TableCell>
                          <TableCell>{student.firstGen}</TableCell>
                          <TableCell>{student.participantType}</TableCell>
                          <TableCell>{student.source}</TableCell>
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
                      ))
                    )}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between">
                  <PaginationInfo
                    pagination={{
                      currentPage,
                      totalPages,
                      totalItems,
                      startIndex,
                      endIndex,
                    }}
                    loading={loading}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    loading={loading}
                  />
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
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
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
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead>Staff/Faculty ID</SortableTableHead>
                      <SortableTableHead>Name</SortableTableHead>
                      <SortableTableHead>Sex</SortableTableHead>
                      <SortableTableHead>Age</SortableTableHead>
                      <SortableTableHead>Address</SortableTableHead>
                      <SortableTableHead>Ethnic Group</SortableTableHead>
                      <SortableTableHead>Sexual Orientation</SortableTableHead>
                      <SortableTableHead>Religion</SortableTableHead>
                      <SortableTableHead>First Generation</SortableTableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffFaculty
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      )
                      .map((staff) => (
                        <TableRow key={staff.$id}>
                          <TableCell>{staff.staffFacultyId}</TableCell>
                          <TableCell>
                            <TruncatedText text={staff.name} />
                          </TableCell>
                          <TableCell>{staff.sex}</TableCell>
                          <TableCell>{staff.age}</TableCell>
                          <TableCell>
                            <TruncatedText text={staff.address} />
                          </TableCell>
                          <TableCell>
                            <TruncatedText
                              text={getEthnicGroupDisplay(staff)}
                            />
                          </TableCell>
                          <TableCell>{staff.orientation}</TableCell>
                          <TableCell>{staff.religion}</TableCell>
                          <TableCell>{staff.firstGen}</TableCell>
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

                <div className="flex items-center justify-between">
                  <PaginationInfo
                    pagination={{
                      currentPage,
                      totalPages: Math.ceil(staffFaculty.length / itemsPerPage),
                      totalItems: staffFaculty.length,
                      startIndex:
                        staffFaculty.length === 0
                          ? 0
                          : (currentPage - 1) * itemsPerPage + 1,
                      endIndex:
                        staffFaculty.length === 0
                          ? 0
                          : Math.min(
                              currentPage * itemsPerPage,
                              staffFaculty.length
                            ),
                    }}
                    loading={loading}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(staffFaculty.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    loading={loading}
                  />
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
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
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
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead>Name</SortableTableHead>
                      <SortableTableHead>Sex</SortableTableHead>
                      <SortableTableHead>Age</SortableTableHead>
                      <SortableTableHead>Address</SortableTableHead>
                      <SortableTableHead>Ethnic Group</SortableTableHead>
                      <SortableTableHead>Sexual Orientation</SortableTableHead>
                      <SortableTableHead>Religion</SortableTableHead>
                      <SortableTableHead>First Generation</SortableTableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {community
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      )
                      .map((member) => (
                        <TableRow key={member.$id}>
                          <TableCell>
                            <TruncatedText text={member.name} />
                          </TableCell>
                          <TableCell>{member.sex}</TableCell>
                          <TableCell>{member.age}</TableCell>
                          <TableCell>
                            <TruncatedText text={member.address} />
                          </TableCell>
                          <TableCell>
                            <TruncatedText
                              text={getEthnicGroupDisplay(member)}
                            />
                          </TableCell>
                          <TableCell>{member.orientation}</TableCell>
                          <TableCell>{member.religion}</TableCell>
                          <TableCell>{member.firstGen}</TableCell>
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
                  <PaginationInfo
                    pagination={{
                      currentPage,
                      totalPages: Math.ceil(community.length / itemsPerPage),
                      totalItems: community.length,
                      startIndex:
                        community.length === 0
                          ? 0
                          : (currentPage - 1) * itemsPerPage + 1,
                      endIndex:
                        community.length === 0
                          ? 0
                          : Math.min(
                              currentPage * itemsPerPage,
                              community.length
                            ),
                    }}
                    loading={loading}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(community.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    loading={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
