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
  Zap,
  Clock,
} from "lucide-react";
import { schools, ethnicGroups } from "./search/constants";
import { truncateText, getEthnicGroupDisplay } from "./search/utils";
import { useFuseSearch } from "./search/useFuseSearch";
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
import { databases, databaseId, studentCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";

// Helper to fetch all students from Appwrite
async function fetchAllStudents() {
  const limit = 100;
  let allStudents = [];
  let cursor = undefined;
  let hasMore = true;
  let batch = 0;

  console.log("🔄 Fetching students from Appwrite...");

  while (hasMore) {
    try {
      const queries = [Query.limit(limit)];
      if (cursor) queries.push(Query.cursorAfter(cursor));

      const response = await databases.listDocuments(
        databaseId,
        studentCollectionId,
        queries
      );

      console.log(
        `📦 Fetched batch ${batch + 1}: ${response.documents.length} students`
      );

      allStudents = allStudents.concat(response.documents);

      if (response.documents.length < limit) {
        hasMore = false;
      } else {
        cursor = response.documents[response.documents.length - 1].$id;
        batch++;
      }
    } catch (error) {
      console.error(`❌ Error fetching batch ${batch + 1}:`, error);
      throw error;
    }
  }

  console.log(`✅ Total students fetched: ${allStudents.length}`);
  return allStudents;
}

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

export function FuseSearch() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchStartTime, setSearchStartTime] = useState(0);

  const {
    query,
    filters,
    sortBy,
    results,
    search,
    updateFilters,
    updateSorting,
    clearSearch,
    getUniqueValues,
    updateResultLimit,
    hasResults,
    totalResults,
    totalStudents,
    isSearching,
    resultLimit,
    hasMoreResults,
  } = useFuseSearch(students);

  // Fetch students on component mount
  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        const allStudents = await fetchAllStudents();
        setStudents(allStudents);
      } catch (error) {
        console.error("Failed to load students:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchStartTime(Date.now());
    search(value);
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value });
  };

  // Handle sorting
  const handleSort = (field) => {
    const direction =
      sortBy.field === field && sortBy.direction === "asc" ? "desc" : "asc";
    updateSorting(field, direction);
  };

  // Clear all filters
  const clearFilters = () => {
    updateFilters({
      program: "",
      participantType: "",
      sex: "",
      year: "",
      school: "",
    });
  };

  // Get search performance time
  const getSearchTime = () => {
    if (!searchStartTime) return 0;
    return Date.now() - searchStartTime;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading students...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Fuzzy Search (Fuse.js)
          </CardTitle>
          <CardDescription>
            Google-like fuzzy search with typo tolerance. Search across all
            student fields with instant results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search students by name, ID, school, program, address..."
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
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
                  {totalResults} of {totalStudents} students
                  {hasMoreResults && ` (showing first ${resultLimit})`}
                </div>
                {isSearching && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {getSearchTime()}ms
                  </div>
                )}
              </div>

              {/* Result Limit Control */}
              <div className="flex items-center gap-2">
                <Label className="text-sm">Results:</Label>
                <Select
                  value={resultLimit.toString()}
                  onValueChange={(value) => updateResultLimit(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
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
                {Object.values(filters).some((v) => v !== "") && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.values(filters).filter((v) => v !== "").length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Program</Label>
                  <Select
                    value={filters.program}
                    onValueChange={(value) =>
                      handleFilterChange("program", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Programs</SelectItem>
                      {getUniqueValues("program").map((program) => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">School</Label>
                  <Select
                    value={filters.school}
                    onValueChange={(value) =>
                      handleFilterChange("school", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Schools" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Schools</SelectItem>
                      {schools.map((school) => (
                        <SelectItem key={school} value={school}>
                          {school}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Year Level</Label>
                  <Select
                    value={filters.year}
                    onValueChange={(value) => handleFilterChange("year", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Years</SelectItem>
                      {getUniqueValues("year").map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sex</Label>
                  <Select
                    value={filters.sex}
                    onValueChange={(value) => handleFilterChange("sex", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      {getUniqueValues("participantType").map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <CardDescription>
            {query
              ? `Found ${totalResults} students matching "${query}"`
              : `Showing ${totalResults} students`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasResults ? (
            <Alert>
              <AlertDescription>
                {query ? (
                  <>
                    No students found matching "{query}". Try:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Checking your spelling</li>
                      <li>Using fewer keywords</li>
                      <li>Clearing some filters</li>
                      <li>Searching by student ID, name, or school</li>
                    </ul>
                  </>
                ) : (
                  "No students available."
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
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
                      field="lastName"
                      currentSort={sortBy}
                      onSort={handleSort}
                    >
                      Last Name
                    </SortableTableHead>
                    <SortableTableHead
                      field="firstName"
                      currentSort={sortBy}
                      onSort={handleSort}
                    >
                      First Name
                    </SortableTableHead>
                    <SortableTableHead
                      field="program"
                      currentSort={sortBy}
                      onSort={handleSort}
                    >
                      Program
                    </SortableTableHead>
                    <SortableTableHead
                      field="year"
                      currentSort={sortBy}
                      onSort={handleSort}
                    >
                      Year
                    </SortableTableHead>
                    <SortableTableHead
                      field="school"
                      currentSort={sortBy}
                      onSort={handleSort}
                    >
                      School
                    </SortableTableHead>
                    <TableHead className="bg-gray-200 text-black font-bold">
                      Sex
                    </TableHead>
                    <TableHead className="bg-gray-200 text-black font-bold">
                      Age
                    </TableHead>
                    <TableHead className="bg-gray-200 text-black font-bold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => {
                    const student = result.item;
                    return (
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
                          <div className="font-medium">
                            {student.lastName || student.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{student.firstName}</div>
                        </TableCell>
                        <TableCell>
                          <div>{student.program}</div>
                        </TableCell>
                        <TableCell>
                          <div>{student.year}</div>
                        </TableCell>
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
                        <TableCell>
                          <Badge
                            variant={
                              student.sex === "Male" ? "default" : "secondary"
                            }
                          >
                            {student.sex}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>{student.age}</div>
                        </TableCell>
                        <TableCell>
                          <ParticipantDetails
                            data={student}
                            title="Student Details"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination info */}
              {hasMoreResults && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">
                    Showing first {resultLimit} of {totalResults} results
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => updateResultLimit(resultLimit + 50)}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
