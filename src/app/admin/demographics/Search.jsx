"use client";
import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  X,
  ArrowUpDown,
  Filter,
  Users,
  Database,
  Clock,
} from "lucide-react";
import { schools, years, ethnicGroups } from "./search/constants";
import { truncateText, getEthnicGroupDisplay } from "./search/utils";
import { useParticipantSearch } from "./search/useParticipantSearch";
import { ParticipantDetails } from "./ParticipantList";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Sortable table header component
const SortableTableHead = ({ children, field, currentSort, onSort }) => (
  <TableHead
    onClick={() => onSort(field)}
    className="bg-gray-200 text-black font-bold cursor-pointer hover:bg-gray-300"
  >
    <div className="flex items-center gap-2">
      {children}
      <ArrowUpDown className="h-4 w-4" />
      {currentSort.field === field && (
        <span className="text-xs">
          {currentSort.direction === "asc" ? "↑" : "↓"}
        </span>
      )}
    </div>
  </TableHead>
);

// Skeleton components for loading states
const SearchSkeleton = () => (
  <div className="space-y-4">
    <div className="relative">
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
);

const TableSkeleton = ({ rows = 5, columns = 10 }) => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-32" />
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <div className="grid grid-cols-10 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid grid-cols-10 gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ResultsSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <TableSkeleton rows={8} columns={10} />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <TableSkeleton rows={5} columns={7} />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-6 w-36" />
      <TableSkeleton rows={3} columns={6} />
    </div>
  </div>
);

export function DemographicsSearch({ selectedPeriod }) {
  const { loading, results, handleSearch } =
    useParticipantSearch(selectedPeriod);
  const [filters, setFilters] = useState({
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
  const [showFilters, setShowFilters] = useState(false);
  const [searchStartTime, setSearchStartTime] = useState(0);
  const [sortBy, setSortBy] = useState({ field: "name", direction: "asc" });
  const [query, setQuery] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [sortedResults, setSortedResults] = useState({
    students: [],
    staffFaculty: [],
    community: [],
  });

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Clear all filters
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
  };

  // Handle search
  const onSearch = () => {
    setSearchStartTime(Date.now());
    handleSearch(filters);
  };

  // Handle sorting
  const handleSort = (field) => {
    const direction =
      sortBy.field === field && sortBy.direction === "asc" ? "desc" : "asc";
    setSortBy({ field, direction });
  };

  // Get search performance time
  const getSearchTime = () => {
    if (!searchStartTime) return 0;
    return Date.now() - searchStartTime;
  };

  // Apply sorting to results
  useEffect(() => {
    const sortArray = (array, field, direction) => {
      if (!array || array.length === 0) return array;

      return [...array].sort((a, b) => {
        const aValue = a[field] || "";
        const bValue = b[field] || "";

        if (direction === "asc") {
          return aValue.toString().localeCompare(bValue.toString());
        } else {
          return bValue.toString().localeCompare(aValue.toString());
        }
      });
    };

    setSortedResults({
      students: sortArray(
        results?.students || [],
        sortBy.field,
        sortBy.direction
      ),
      staffFaculty: sortArray(
        results?.staffFaculty || [],
        sortBy.field,
        sortBy.direction
      ),
      community: sortArray(
        results?.community || [],
        sortBy.field,
        sortBy.direction
      ),
    });
  }, [results, sortBy]);

  // Calculate total results
  const totalResults =
    (results?.students?.length || 0) +
    (results?.staffFaculty?.length || 0) +
    (results?.community?.length || 0);
  const hasResults = totalResults > 0;

  // Load all students on component mount
  useEffect(() => {
    const loadAllStudents = async () => {
      console.log("🚀 Loading all students on component mount...");
      setIsInitialLoading(true);
      setSearchStartTime(Date.now());
      try {
        await handleSearch({
          participantType: "students",
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
        setHasLoaded(true);
      } catch (error) {
        console.error("❌ Error loading initial students:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    // Only load if we haven't loaded yet
    if (!hasLoaded) {
      loadAllStudents();
    }
  }, [hasLoaded]); // Only depend on hasLoaded

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Advanced Search (All Data)
          </CardTitle>
          <CardDescription>
            Search all participants across all academic periods using Appwrite
            queries with advanced filtering and sorting capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          {isInitialLoading ? (
            <SearchSkeleton />
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search all students by name, ID, address, school, program..."
                  value={filters.name || filters.id || filters.address || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setQuery(value);
                    // Auto-detect what type of search this is
                    if (value.match(/^\d+$/)) {
                      handleFilterChange("id", value);
                      handleFilterChange("name", "");
                      handleFilterChange("address", "");
                    } else if (value.includes("@") || value.includes(".")) {
                      handleFilterChange("address", value);
                      handleFilterChange("name", "");
                      handleFilterChange("id", "");
                    } else {
                      handleFilterChange("name", value);
                      handleFilterChange("id", "");
                      handleFilterChange("address", "");
                    }
                  }}
                  className="pl-10 pr-10"
                />
                {(filters.name || filters.id || filters.address) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      handleFilterChange("name", "");
                      handleFilterChange("id", "");
                      handleFilterChange("address", "");
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Search Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {loading ? (
                      <span>Loading...</span>
                    ) : (
                      <span>{totalResults} participants found</span>
                    )}
                  </div>
                  {loading && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Searching...
                    </div>
                  )}
                  {!loading && searchStartTime > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {getSearchTime()}ms
                    </div>
                  )}
                </div>

                {/* Filter Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {showFilters ? "Hide" : "Show"} Filters
                  {Object.values(filters).some(
                    (v) => v !== "" && v !== "all" && v !== false
                  ) && (
                    <Badge variant="secondary" className="ml-2">
                      {
                        Object.values(filters).filter(
                          (v) => v !== "" && v !== "all" && v !== false
                        ).length
                      }
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Participant Type
                    </Label>
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
                        <SelectItem value="staffFaculty">
                          Staff/Faculty
                        </SelectItem>
                        <SelectItem value="community">Community</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sex</Label>
                    <Select
                      value={filters.sex}
                      onValueChange={(value) =>
                        handleFilterChange("sex", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Age</Label>
                    <Input
                      type="number"
                      placeholder="Enter age"
                      value={filters.age}
                      onChange={(e) =>
                        handleFilterChange("age", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ethnic Group</Label>
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
                            {getEthnicGroupDisplay(group)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {filters.participantType === "students" && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">School</Label>
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
                        <Label className="text-sm font-medium">
                          Year Level
                        </Label>
                        <Select
                          value={filters.year}
                          onValueChange={(value) =>
                            handleFilterChange("year", value)
                          }
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
                        <Label className="text-sm font-medium">Section</Label>
                        <Input
                          placeholder="Enter section"
                          value={filters.section}
                          onChange={(e) =>
                            handleFilterChange("section", e.target.value)
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}

              {/* Search Button */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchStartTime(Date.now());
                    handleSearch({
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
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4 mr-2" />
                  )}
                  Search All
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {isInitialLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>Loading all participants...</CardDescription>
          </CardHeader>
          <CardContent>
            <ResultsSkeleton />
          </CardContent>
        </Card>
      ) : hasResults ? (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {query
                ? `Found ${totalResults} participants matching "${query}"`
                : `Showing ${totalResults} participants from all academic periods`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative">
            {loading && !isInitialLoading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Searching...</span>
                </div>
              </div>
            )}
            {/* Students Results */}
            {sortedResults.students.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">
                  Students ({sortedResults.students.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        field="studentId"
                        currentSort={sortBy}
                        onSort={handleSort}
                      >
                        Student ID
                      </SortableTableHead>
                      <SortableTableHead
                        field="name"
                        currentSort={sortBy}
                        onSort={handleSort}
                      >
                        Name
                      </SortableTableHead>
                      <SortableTableHead
                        field="sex"
                        currentSort={sortBy}
                        onSort={handleSort}
                      >
                        Sex
                      </SortableTableHead>
                      <SortableTableHead
                        field="age"
                        currentSort={sortBy}
                        onSort={handleSort}
                      >
                        Age
                      </SortableTableHead>
                      <SortableTableHead
                        field="school"
                        currentSort={sortBy}
                        onSort={handleSort}
                      >
                        School
                      </SortableTableHead>
                      <SortableTableHead
                        field="year"
                        currentSort={sortBy}
                        onSort={handleSort}
                      >
                        Year
                      </SortableTableHead>
                      <SortableTableHead
                        field="section"
                        currentSort={sortBy}
                        onSort={handleSort}
                      >
                        Section
                      </SortableTableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Address
                      </TableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Ethnic Group
                      </TableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedResults.students.map((student) => (
                      <TableRow key={student.$id}>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono text-sm">
                                  {student.studentId}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Student ID</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{student.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              student.sex === "Male" ? "default" : "secondary"
                            }
                          >
                            {student.sex}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.age}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {truncateText(student.school, 20)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{student.school}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>{student.year}</TableCell>
                        <TableCell>{student.section}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {truncateText(student.address, 25)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{student.address}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>{getEthnicGroupDisplay(student)}</TableCell>
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
            {sortedResults.staffFaculty.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">
                  Staff/Faculty ({sortedResults.staffFaculty.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        field="staffFacultyId"
                        currentSort={sortBy}
                        onSort={handleSort}
                      >
                        Staff ID
                      </SortableTableHead>
                      <SortableTableHead
                        field="name"
                        currentSort={sortBy}
                        onSort={handleSort}
                      >
                        Name
                      </SortableTableHead>
                      <SortableTableHead
                        field="sex"
                        currentSort={sortBy}
                        onSort={handleSort}
                      >
                        Sex
                      </SortableTableHead>
                      <SortableTableHead
                        field="age"
                        currentSort={sortBy}
                        onSort={handleSort}
                      >
                        Age
                      </SortableTableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Address
                      </TableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Ethnic Group
                      </TableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedResults.staffFaculty.map((staff) => (
                      <TableRow key={staff.$id}>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono text-sm">
                                  {staff.staffFacultyId}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Staff/Faculty ID</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{staff.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              staff.sex === "Male" ? "default" : "secondary"
                            }
                          >
                            {staff.sex}
                          </Badge>
                        </TableCell>
                        <TableCell>{staff.age}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {truncateText(staff.address, 25)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{staff.address}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>{getEthnicGroupDisplay(staff)}</TableCell>
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
            {sortedResults.community.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">
                  Community ({sortedResults.community.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        field="name"
                        currentSort={sortBy}
                        onSort={handleSort}
                      >
                        Name
                      </SortableTableHead>
                      <SortableTableHead
                        field="sex"
                        currentSort={sortBy}
                        onSort={handleSort}
                      >
                        Sex
                      </SortableTableHead>
                      <SortableTableHead
                        field="age"
                        currentSort={sortBy}
                        onSort={handleSort}
                      >
                        Age
                      </SortableTableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Address
                      </TableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Ethnic Group
                      </TableHead>
                      <TableHead className="bg-gray-200 text-black font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedResults.community.map((member) => (
                      <TableRow key={member.$id}>
                        <TableCell>
                          <div className="font-medium">{member.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              member.sex === "Male" ? "default" : "secondary"
                            }
                          >
                            {member.sex}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.age}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {truncateText(member.address, 25)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{member.address}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>{getEthnicGroupDisplay(member)}</TableCell>
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
      ) : null}

      {/* No Results */}
      {!isInitialLoading &&
        !loading &&
        !hasResults &&
        (filters.name ||
          filters.id ||
          filters.address ||
          Object.values(filters).some(
            (v) => v !== "" && v !== "all" && v !== false
          )) && (
          <Card>
            <CardContent>
              <Alert>
                <AlertDescription>
                  No participants found matching your search criteria. Try:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Checking your spelling</li>
                    <li>Using fewer keywords</li>
                    <li>Clearing some filters</li>
                    <li>Searching by name, ID, or address</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
