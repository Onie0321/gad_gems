"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Loader2, ArrowUpDown } from "lucide-react";
import {
  getCurrentAcademicPeriod,
  PERIOD_TYPES,
  validateAcademicPeriod,
  createNewAcademicPeriod,
  getAllAcademicPeriods,
  databases,
  databaseId,
  academicPeriodCollectionId,
  eventCollectionId,
  studentsCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Query } from "appwrite";
import { Skeleton } from "@/components/ui/skeleton";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AcademicPeriodManagement() {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [schoolYear, setSchoolYear] = useState("");
  const [periodType, setPeriodType] = useState("");
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const [allPeriods, setAllPeriods] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalSchoolYears: 0,
    totalFirstSem: 0,
    totalSecondSem: 0,
    totalSummer: 0,
    totalArchived: 0,
  });
  const ITEMS_PER_PAGE = 10;
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [academicPeriods, setAcademicPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [archivedEvents, setArchivedEvents] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(true);
  const [isLoadingArchives, setIsLoadingArchives] = useState(true);

  const loadCurrentPeriod = useCallback(async () => {
    try {
      const period = await getCurrentAcademicPeriod();
      setCurrentPeriod(period);
    } catch (error) {
      console.error("Error loading current period:", error);
      toast({
        title: "Error",
        description: "Failed to load current academic period",
        variant: "destructive",
      });
    }
  }, [toast]);

  const calculateStats = useCallback((periods) => {
    const uniqueYears = new Set(periods.map((p) => p.schoolYear));
    const stats = {
      totalSchoolYears: uniqueYears.size,
      totalFirstSem: periods.filter(
        (p) => p.periodType === PERIOD_TYPES.FIRST_SEMESTER
      ).length,
      totalSecondSem: periods.filter(
        (p) => p.periodType === PERIOD_TYPES.SECOND_SEMESTER
      ).length,
      totalSummer: periods.filter((p) => p.periodType === PERIOD_TYPES.SUMMER)
        .length,
      totalArchived: periods.filter((p) => !p.isActive).length,
    };
    setStats(stats);
    setIsLoadingStats(false);
  }, []);

  const loadAllPeriods = useCallback(async () => {
    try {
      setIsLoadingPeriods(true);
      const periods = await getAllAcademicPeriods();
      setAllPeriods(periods);
      setTotalPages(Math.ceil(periods.length / ITEMS_PER_PAGE));
      calculateStats(periods);
    } catch (error) {
      console.error("Error loading periods:", error);
      toast({
        title: "Error",
        description: "Failed to load academic periods",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPeriods(false);
    }
  }, [toast, calculateStats, ITEMS_PER_PAGE]);

  const fetchAcademicPeriods = async () => {
    try {
      setIsLoadingArchives(true);
      const response = await databases.listDocuments(
        databaseId,
        academicPeriodCollectionId,
        [Query.equal("isActive", false), Query.orderDesc("createdAt")]
      );

      setAcademicPeriods(response.documents);
      if (response.documents.length > 0) {
        setSelectedPeriod(response.documents[0]);
      }
    } catch (error) {
      console.error("Error fetching academic periods:", error);
      toast({
        title: "Error",
        description: "Failed to load archived periods",
        variant: "destructive",
      });
    } finally {
      setIsLoadingArchives(false);
    }
  };

  const fetchArchivedEvents = async (periodId) => {
    try {
      setIsLoadingArchives(true);

      const periodResponse = await databases.getDocument(
        databaseId,
        academicPeriodCollectionId,
        periodId
      );

      const eventsResponse = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [
          Query.equal("academicPeriodId", periodId),
          Query.equal("isArchived", true),
          Query.orderDesc("eventDate"),
        ]
      );

      const eventsWithParticipants = await Promise.all(
        eventsResponse.documents.map(async (event) => {
          const [
            studentParticipants,
            staffParticipants,
            communityParticipants,
          ] = await Promise.all([
            databases.listDocuments(databaseId, studentsCollectionId, [
              Query.equal("eventId", event.$id),
              Query.equal("academicPeriodId", periodId),
              Query.equal("isArchived", true),
            ]),
            databases.listDocuments(databaseId, staffFacultyCollectionId, [
              Query.equal("eventId", event.$id),
              Query.equal("academicPeriodId", periodId),
              Query.equal("isArchived", true),
            ]),
            databases.listDocuments(databaseId, communityCollectionId, [
              Query.equal("eventId", event.$id),
              Query.equal("academicPeriodId", periodId),
              Query.equal("isArchived", true),
            ]),
          ]);

          const allParticipants = [
            ...studentParticipants.documents,
            ...staffParticipants.documents,
            ...communityParticipants.documents,
          ];

          return {
            ...event,
            participants: allParticipants,
            participantStats: {
              students: studentParticipants.documents.length,
              staffFaculty: staffParticipants.documents.length,
              community: communityParticipants.documents.length,
              total: allParticipants.length,
            },
          };
        })
      );

      setArchivedEvents(eventsWithParticipants);
    } catch (error) {
      console.error("Error fetching archived events:", error);
      toast({
        title: "Error",
        description: "Failed to load archived events",
        variant: "destructive",
      });
    } finally {
      setIsLoadingArchives(false);
    }
  };

  useEffect(() => {
    if (selectedPeriod) {
      fetchArchivedEvents(selectedPeriod.$id);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadCurrentPeriod();
    loadAllPeriods();
    fetchAcademicPeriods();
  }, [loadCurrentPeriod, loadAllPeriods]);

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getCurrentPageItems = useCallback(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    const sortedPeriods = [...allPeriods].sort((a, b) => {
      const key = sortConfig.key || "createdAt";

      if (key === "startDate" || key === "endDate" || key === "createdAt") {
        const dateA = new Date(a[key]);
        const dateB = new Date(b[key]);
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (a[key] < b[key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return sortedPeriods.slice(startIndex, endIndex);
  }, [page, allPeriods, sortConfig, ITEMS_PER_PAGE]);

  const resetForm = () => {
    setSchoolYear("");
    setPeriodType("");
    setStartDate(new Date());
    setEndDate(new Date());
  };

  const handleCreateNewPeriod = async () => {
    try {
      const validationErrors = validateAcademicPeriod(
        schoolYear,
        periodType,
        startDate,
        endDate
      );

      if (validationErrors.length > 0) {
        toast({
          title: "Validation Error",
          description: validationErrors.join("\n"),
          variant: "destructive",
        });
        return;
      }

      setShowConfirmDialog(true);
    } catch (error) {
      console.error("Error validating:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleConfirmedCreate = async () => {
    setIsLoading(true);
    setShowConfirmDialog(false);

    try {
      toast({
        title: "Processing",
        description: "Creating new academic period and archiving data...",
        duration: 5000,
      });

      await createNewAcademicPeriod(
        schoolYear,
        periodType,
        startDate.toISOString(),
        endDate.toISOString(),
        currentPeriod?.$id
      );

      toast({
        title: "Success",
        description:
          "New academic period created and data archived successfully",
        variant: "success",
      });

      resetForm();
      loadCurrentPeriod();
    } catch (error) {
      console.error("Error creating new period:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create new academic period",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date();

  const StatsSkeleton = () => (
    <div className="grid grid-cols-5 gap-4 mb-6">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="py-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const TableSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Academic Period Management
        </h2>
      </div>

      {currentPeriod && (
        <div className="bg-white p-6 rounded-lg border border-black-100">
          <h3 className="font-semibold text-lg mb-4">Current Active Period</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">School Year:</span>
              <p className="font-medium">{currentPeriod.schoolYear}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Period:</span>
              <p className="font-medium">{currentPeriod.periodType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Start Date:</span>
              <p className="font-medium">
                {new Date(currentPeriod.startDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">End Date:</span>
              <p className="font-medium">
                {new Date(currentPeriod.endDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoadingStats ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">
                School Years
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalSchoolYears}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">
                First Semester
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalFirstSem}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">
                Second Semester
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalSecondSem}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">Summer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalSummer}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">Archived</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalArchived}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manage">Manage Period</TabsTrigger>
          <TabsTrigger value="list">View All Periods</TabsTrigger>
          <TabsTrigger value="archives">Archives</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <label className="block mb-2  text-sm">School Year</label>
                      <input
                        type="text"
                        placeholder="Input School Year"
                        value={schoolYear}
                        onChange={(e) => setSchoolYear(e.target.value)}
                        className="w-full p-2 border border-black rounded-md bg-white"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the school year in format YYYY-YYYY</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <label className="block mb-2 text-sm border-black font-medium">
                        Period Type
                      </label>
                      <Select onValueChange={setPeriodType} value={periodType}>
                        <SelectTrigger className="bg-white border border-black">
                          <SelectValue placeholder="Select period type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(PERIOD_TYPES).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select the type of academic period</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Start Date
                      </label>
                      <div className="border rounded-lg p-3 bg-white">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          className="rounded-md"
                          classNames={{
                            head_cell: cn(
                              "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                              "[&:nth-child(1)]:text-orange-500",
                              "[&:nth-child(7)]:text-orange-500"
                            ),
                            day: cn(
                              "h-9 w-9 p-0 font-bold rounded-md",
                              "hover:bg-blue-50 focus:bg-blue-50",
                              "aria-selected:opacity-100"
                            ),
                            day_selected: cn(
                              "bg-blue-900 text-white hover:bg-blue-600 hover:text-white",
                              "focus:bg-blue-600 focus:text-white"
                            ),
                          }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select the start date of the academic period</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        End Date
                      </label>
                      <div className="border rounded-lg p-3 bg-white">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          className="rounded-md"
                          classNames={{
                            head_cell: cn(
                              "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                              "[&:nth-child(1)]:text-orange-500",
                              "[&:nth-child(7)]:text-orange-500"
                            ),
                            day: cn(
                              "h-9 w-9 p-0 font-bold rounded-md",
                              "hover:bg-blue-50 focus:bg-blue-50",
                              "aria-selected:opacity-100"
                            ),
                            day_selected: cn(
                              "bg-blue-900 text-white hover:bg-blue-600 hover:text-white",
                              "focus:bg-blue-600 focus:text-white"
                            ),
                          }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select the end date of the academic period</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Button
              onClick={handleCreateNewPeriod}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create New Academic Period
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="list">
          {isLoadingPeriods ? (
            <TableSkeleton />
          ) : (
            <div className="bg-white p-6 rounded-lg border border-black-100">
              <Table>
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="font-bold text-black">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("schoolYear")}
                        className="hover:bg-gray-200"
                      >
                        School Year
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-black">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("periodType")}
                        className="hover:bg-gray-200"
                      >
                        Period Type
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-black">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("startDate")}
                        className="hover:bg-gray-200"
                      >
                        Start Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-black">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("endDate")}
                        className="hover:bg-gray-200"
                      >
                        End Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-black">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCurrentPageItems().map((period) => (
                    <TableRow key={period.$id}>
                      <TableCell>{period.schoolYear}</TableCell>
                      <TableCell>{period.periodType}</TableCell>
                      <TableCell>
                        {new Date(period.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(period.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {period.$id === currentPeriod?.$id ? (
                          <span className="text-green-600 font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="text-gray-500">Archived</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      />
                    </PaginationItem>

                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i + 1}>
                        <PaginationLink
                          onClick={() => setPage(i + 1)}
                          isActive={page === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="archives">
          <Card>
            <CardHeader>
              <CardTitle>Archives</CardTitle>
              <CardDescription>
                View past academic periods and their events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Select
                  value={selectedPeriod?.$id}
                  onValueChange={(value) => {
                    const period = academicPeriods.find((p) => p.$id === value);
                    setSelectedPeriod(period);
                  }}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select academic period" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicPeriods.map((period) => (
                      <SelectItem key={period.$id} value={period.$id}>
                        {period.schoolYear} - {period.periodType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoadingArchives ? (
                <TableSkeleton />
              ) : selectedPeriod ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Events for {selectedPeriod.schoolYear} -{" "}
                    {selectedPeriod.periodType}
                  </h3>

                  {archivedEvents.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Name</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Venue</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-center">
                            Students
                          </TableHead>
                          <TableHead className="text-center">
                            Staff/Faculty
                          </TableHead>
                          <TableHead className="text-center">
                            Community
                          </TableHead>
                          <TableHead className="text-center">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archivedEvents.map((event) => (
                          <TableRow key={event.$id}>
                            <TableCell>{event.eventName}</TableCell>
                            <TableCell>
                              {format(
                                new Date(event.eventDate),
                                "MMM dd, yyyy"
                              )}
                            </TableCell>
                            <TableCell>{event.eventVenue}</TableCell>
                            <TableCell>{event.eventType}</TableCell>
                            <TableCell className="text-center">
                              {event.participantStats.students}
                            </TableCell>
                            <TableCell className="text-center">
                              {event.participantStats.staffFaculty}
                            </TableCell>
                            <TableCell className="text-center">
                              {event.participantStats.community}
                            </TableCell>
                            <TableCell className="text-center">
                              {event.participantStats.total}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-gray-500">
                      No archived events found for this period
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  Please select an academic period to view its events
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Academic Period</DialogTitle>
            <DialogDescription>
              This will archive all current data and start a new {periodType}{" "}
              for {schoolYear}. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmedCreate}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
