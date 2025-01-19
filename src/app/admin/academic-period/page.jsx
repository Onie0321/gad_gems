"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCurrentAcademicPeriod,
  PERIOD_TYPES,
  validateAcademicPeriod,
  createNewAcademicPeriod,
} from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";

export default function AcademicPeriodManagement() {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [schoolYear, setSchoolYear] = useState("");
  const [periodType, setPeriodType] = useState("");
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentPeriod();
  }, []);

  const loadCurrentPeriod = async () => {
    const period = await getCurrentAcademicPeriod();
    setCurrentPeriod(period);
  };

  const handleCreateNewPeriod = async () => {
    try {
      // Validate input
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

      // Show confirmation dialog
      const confirmed = window.confirm(
        `This will archive all current data and start a new ${periodType} for ${schoolYear}. Are you sure you want to continue?`
      );

      if (!confirmed) {
        return;
      }

      // Show processing toast
      toast({
        title: "Processing",
        description: "Creating new academic period and archiving data...",
        duration: 5000,
      });

      // Create new period and archive data
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

      // Reload current period
      loadCurrentPeriod();
    } catch (error) {
      console.error("Error creating new period:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create new academic period",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Academic Period Management</h2>
      </div>

      {currentPeriod && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold">Current Active Period</h3>
          <p>School Year: {currentPeriod.schoolYear}</p>
          <p>Period: {currentPeriod.periodType}</p>
          <p>
            Start Date: {new Date(currentPeriod.startDate).toLocaleDateString()}
          </p>
          <p>
            End Date: {new Date(currentPeriod.endDate).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="grid gap-4 max-w-xl">
        <div>
          <label className="block mb-2">School Year</label>
          <input
            type="text"
            placeholder="2023-2024"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Period Type</label>
          <Select onValueChange={setPeriodType} value={periodType}>
            <SelectTrigger>
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

        <div>
          <label className="block mb-2">Start Date</label>
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={setStartDate}
          />
        </div>

        <div>
          <label className="block mb-2">End Date</label>
          <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
        </div>

        <Button onClick={handleCreateNewPeriod}>
          Create New Academic Period
        </Button>
      </div>
    </div>
  );
}
