"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  databases,
  databaseId,
  studentsCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import debounce from "lodash/debounce";
import GADConnectSimpleLoader from "@/components/loading/simpleLoading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X } from "lucide-react";
import { schools, years, ethnicGroups } from "./constants";
import { truncateText, getEthnicGroupDisplay } from "./utils";
import { useParticipantSearch } from "./useParticipantSearch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import { ParticipantDetails } from "../ParticipantList";

export function DemographicsSearch({ selectedPeriod }) {
  const { loading, results, handleSearch, setResults } =
    useParticipantSearch(selectedPeriod);
  const [filters, setFilters] = useState({
    participantType: "",
    name: "",
    sex: "",
    age: "",
    school: "",
    year: "",
    section: "",
    ethnicGroup: "",
    address: "",
    id: "", // For student/staff ID
    isArchived: false,
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      participantType: "all",
      name: "",
      sex: "all",
      age: "",
      school: "all",
      year: "all",
      section: "",
      ethnicGroup: "all",
      address: "",
      id: "",
      isArchived: false,
    });
    setResults({
      students: [],
      staffFaculty: [],
      community: [],
    });
  };

  const onSearch = () => {
    handleSearch(filters);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Participants</CardTitle>
          <CardDescription>
            Filter participants using various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Participant Type</label>
              <Select
                value={filters.participantType}
                onValueChange={(value) =>
                  handleFilterChange("participantType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="staffFaculty">Staff/Faculty</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Search by name"
                value={filters.name}
                onChange={(e) => handleFilterChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sex</label>
              <Select
                value={filters.sex}
                onValueChange={(value) => handleFilterChange("sex", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show school and year filters only when students are selected */}
            {(!filters.participantType ||
              filters.participantType === "students") && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">School</label>
                  <Select
                    value={filters.school}
                    onValueChange={(value) =>
                      handleFilterChange("school", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {schools.map((school) => (
                        <SelectItem key={school} value={school}>
                          {school}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Select
                    value={filters.year}
                    onValueChange={(value) => handleFilterChange("year", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Section</label>
                  <Input
                    placeholder="Search by section"
                    value={filters.section}
                    onChange={(e) =>
                      handleFilterChange("section", e.target.value)
                    }
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Ethnic Group</label>
              <Select
                value={filters.ethnicGroup}
                onValueChange={(value) =>
                  handleFilterChange("ethnicGroup", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ethnic group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {ethnicGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Age</label>
              <Input
                type="number"
                placeholder="Search by age"
                value={filters.age}
                onChange={(e) => handleFilterChange("age", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input
                placeholder="Search by address"
                value={filters.address}
                onChange={(e) => handleFilterChange("address", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ID</label>
              <Input
                placeholder="Search by ID"
                value={filters.id}
                onChange={(e) => handleFilterChange("id", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={clearFilters} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
            <Button onClick={onSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Display Results */}
      {(results.students.length > 0 ||
        results.staffFaculty.length > 0 ||
        results.community.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found{" "}
              {results.students.length +
                results.staffFaculty.length +
                results.community.length}{" "}
              participants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Students Results */}
            {results.students.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">
                  Students ({results.students.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-gray-200">Student ID</TableHead>
                      <TableHead className="bg-gray-200">Name</TableHead>
                      <TableHead className="bg-gray-200">Sex</TableHead>
                      <TableHead className="bg-gray-200">Age</TableHead>
                      <TableHead className="bg-gray-200">School</TableHead>
                      <TableHead className="bg-gray-200">Year</TableHead>
                      <TableHead className="bg-gray-200">Section</TableHead>
                      <TableHead className="bg-gray-200">Address</TableHead>
                      <TableHead className="bg-gray-200">
                        Ethnic Group
                      </TableHead>
                      <TableHead className="bg-gray-200">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.students.map((student) => (
                      <TableRow key={student.$id}>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell>{truncateText(student.name)}</TableCell>
                        <TableCell>{student.sex}</TableCell>
                        <TableCell>{student.age}</TableCell>
                        <TableCell>{truncateText(student.school)}</TableCell>
                        <TableCell>{student.year}</TableCell>
                        <TableCell>{student.section}</TableCell>
                        <TableCell>{truncateText(student.address)}</TableCell>
                        <TableCell>
                          {truncateText(getEthnicGroupDisplay(student))}
                        </TableCell>
                        <TableCell>
                          <ParticipantDetails
                            data={student}
                            title="Student Details"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Staff/Faculty Results */}
            {results.staffFaculty.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">
                  Staff/Faculty ({results.staffFaculty.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-gray-200">
                        Staff/Faculty ID
                      </TableHead>
                      <TableHead className="bg-gray-200">Name</TableHead>
                      <TableHead className="bg-gray-200">Sex</TableHead>
                      <TableHead className="bg-gray-200">Age</TableHead>
                      <TableHead className="bg-gray-200">Address</TableHead>
                      <TableHead className="bg-gray-200">
                        Ethnic Group
                      </TableHead>
                      <TableHead className="bg-gray-200">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.staffFaculty.map((staff) => (
                      <TableRow key={staff.$id}>
                        <TableCell>{staff.staffFacultyId}</TableCell>
                        <TableCell>{truncateText(staff.name)}</TableCell>
                        <TableCell>{staff.sex}</TableCell>
                        <TableCell>{staff.age}</TableCell>
                        <TableCell>{truncateText(staff.address)}</TableCell>
                        <TableCell>
                          {truncateText(getEthnicGroupDisplay(staff))}
                        </TableCell>
                        <TableCell>
                          <ParticipantDetails
                            data={staff}
                            title="Staff/Faculty Details"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Community Results */}
            {results.community.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">
                  Community Members ({results.community.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-gray-200">Name</TableHead>
                      <TableHead className="bg-gray-200">Sex</TableHead>
                      <TableHead className="bg-gray-200">Age</TableHead>
                      <TableHead className="bg-gray-200">Address</TableHead>
                      <TableHead className="bg-gray-200">
                        Ethnic Group
                      </TableHead>
                      <TableHead className="bg-gray-200">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.community.map((member) => (
                      <TableRow key={member.$id}>
                        <TableCell>{truncateText(member.name)}</TableCell>
                        <TableCell>{member.sex}</TableCell>
                        <TableCell>{member.age}</TableCell>
                        <TableCell>{truncateText(member.address)}</TableCell>
                        <TableCell>
                          {truncateText(getEthnicGroupDisplay(member))}
                        </TableCell>
                        <TableCell>
                          <ParticipantDetails
                            data={member}
                            title="Community Member Details"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
