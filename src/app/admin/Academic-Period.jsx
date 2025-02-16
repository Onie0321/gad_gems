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
import { Loader2 } from "lucide-react";
import {
  getCurrentAcademicPeriod,
  PERIOD_TYPES,
  validateAcademicPeriod,
  createNewAcademicPeriod,
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

  useEffect(() => {
    loadCurrentPeriod();
  }, [loadCurrentPeriod]);

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

      <div className="space-y-6">
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
