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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  Archive,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  getCurrentAcademicPeriod,
  PERIOD_TYPES,
  validateAcademicPeriod,
  createNewAcademicPeriod,
  checkDuplicateAcademicPeriod,
  getAcademicPeriodsBySchoolYear,
  getArchivedAcademicPeriods,
  getCurrentUser,
} from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";

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
  const [validationErrors, setValidationErrors] = useState([]);
  const [duplicateCheckLoading, setDuplicateCheckLoading] = useState(false);
  const [existingPeriods, setExistingPeriods] = useState([]);
  const [loadingExistingPeriods, setLoadingExistingPeriods] = useState(false);
  const [archivedPeriods, setArchivedPeriods] = useState([]);
  const [loadingArchivedPeriods, setLoadingArchivedPeriods] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const { toast } = useToast();

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

  const loadArchivedPeriods = useCallback(async () => {
    setLoadingArchivedPeriods(true);
    try {
      const periods = await getArchivedAcademicPeriods();
      setArchivedPeriods(periods);
    } catch (error) {
      console.error("Error loading archived periods:", error);
      toast({
        title: "Error",
        description: "Failed to load archived academic periods",
        variant: "destructive",
      });
    } finally {
      setLoadingArchivedPeriods(false);
    }
  }, [toast]);

  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  }, []);

  useEffect(() => {
    loadCurrentPeriod();
    loadCurrentUser();
  }, [loadCurrentPeriod, loadCurrentUser]);

  useEffect(() => {
    if (activeTab === "archived") {
      loadArchivedPeriods();
    }
  }, [activeTab, loadArchivedPeriods]);

  const resetForm = () => {
    setSchoolYear("");
    setPeriodType("");
    setStartDate(new Date());
    setEndDate(new Date());
    setValidationErrors([]);
    setExistingPeriods([]);
  };

  // Load existing periods when school year changes
  const loadExistingPeriods = useCallback(async (year) => {
    if (!year || year.trim() === "") {
      setExistingPeriods([]);
      return;
    }

    setLoadingExistingPeriods(true);
    try {
      const periods = await getAcademicPeriodsBySchoolYear(year);
      setExistingPeriods(periods);
    } catch (error) {
      console.error("Error loading existing periods:", error);
      setExistingPeriods([]);
    } finally {
      setLoadingExistingPeriods(false);
    }
  }, []);

  const validateForm = () => {
    const errors = validateAcademicPeriod(
      schoolYear,
      periodType,
      startDate,
      endDate
    );
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleCreateNewPeriod = async () => {
    try {
      // Clear previous errors
      setValidationErrors([]);

      // Validate form
      if (!validateForm()) {
        return;
      }

      // Check for duplicates
      setDuplicateCheckLoading(true);
      try {
        const duplicateCheck = await checkDuplicateAcademicPeriod(
          schoolYear,
          periodType,
          startDate.toISOString(),
          endDate.toISOString()
        );

        if (duplicateCheck.isDuplicate) {
          toast({
            title: "Duplicate Academic Period",
            description: duplicateCheck.message,
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error("Error checking for duplicates:", error);
        toast({
          title: "Error",
          description:
            "Failed to check for duplicate academic periods. Please try again.",
          variant: "destructive",
        });
        return;
      } finally {
        setDuplicateCheckLoading(false);
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

      const newPeriod = await createNewAcademicPeriod(
        schoolYear,
        periodType,
        startDate.toISOString(),
        endDate.toISOString(),
        currentPeriod?.$id
      );

      toast({
        title: "Success",
        description:
          "New academic period created successfully! Data archival completed.",
        variant: "success",
      });

      resetForm();
      loadCurrentPeriod();
    } catch (error) {
      console.error("Error creating new period:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to create new academic period";
      if (error.message) {
        if (error.message.includes("duplicate")) {
          errorMessage = error.message;
        } else if (error.message.includes("archive")) {
          errorMessage =
            "Period created but failed to archive some data. Please check the logs.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date();

  // Check if user is admin
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
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
              <span className="text-muted-foreground">Academic Year:</span>
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
            {currentPeriod.createdBy && (
              <div>
                <span className="text-muted-foreground">Created By:</span>
                <p className="font-medium">{currentPeriod.createdBy}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <span>Active Periods</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger
              value="archived"
              className="flex items-center space-x-2"
            >
              <Archive className="h-4 w-4" />
              <span>Archived Periods</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="space-y-6">
            {/* Existing Periods for Selected School Year */}
            {schoolYear && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <h4 className="font-medium text-blue-800">
                    Existing Periods for {schoolYear}
                  </h4>
                  {loadingExistingPeriods && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                </div>

                {existingPeriods.length === 0 && !loadingExistingPeriods ? (
                  <p className="text-blue-700 text-sm">
                    No existing periods found for this school year.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {existingPeriods.map((period) => (
                      <div
                        key={period.$id}
                        className="flex items-center justify-between p-2 bg-white rounded border"
                      >
                        <div className="flex items-center space-x-4">
                          <span className="font-medium text-blue-900">
                            {period.periodType}
                          </span>
                          <span className="text-sm text-blue-700">
                            {period.startDateFormatted} -{" "}
                            {period.endDateFormatted}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            period.isActive === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {period.isActive}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <h4 className="font-medium text-red-800">
                    Validation Errors
                  </h4>
                </div>
                <ul className="list-disc list-inside space-y-1 text-red-700">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <label className="block mb-2  text-sm font-medium">
                        School Year
                      </label>
                      <input
                        type="text"
                        placeholder="Input School Year"
                        value={schoolYear}
                        onChange={(e) => {
                          setSchoolYear(e.target.value);
                          loadExistingPeriods(e.target.value);
                        }}
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
              disabled={isLoading || duplicateCheckLoading}
            >
              {(isLoading || duplicateCheckLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {duplicateCheckLoading
                ? "Checking for duplicates..."
                : "Create New Academic Period"}
            </Button>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="archived" className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Archive className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-lg text-gray-800">
                  Archived Academic Periods
                </h3>
                {loadingArchivedPeriods && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                )}
              </div>

              {archivedPeriods.length === 0 && !loadingArchivedPeriods ? (
                <div className="text-center py-8">
                  <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No archived periods found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>School Year</TableHead>
                        <TableHead>Period Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Archived At</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedPeriods.map((period) => (
                        <TableRow key={period.$id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {period.schoolYear}
                          </TableCell>
                          <TableCell>{period.periodType}</TableCell>
                          <TableCell>{period.startDateFormatted}</TableCell>
                          <TableCell>{period.endDateFormatted}</TableCell>
                          <TableCell>{period.createdByFormatted}</TableCell>
                          <TableCell>{period.archivedAtFormatted}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="bg-gray-100 text-gray-700"
                            >
                              <Archive className="h-3 w-3 mr-1" />
                              Archived
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        )}
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
