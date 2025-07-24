"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import * as importUtils from "@/utils/importUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCurrentAcademicPeriod } from "@/lib/appwrite";
import { createNotification } from "@/lib/appwrite";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import * as XLSX from "xlsx";

export default function ImportEventData({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState(null);

  useEffect(() => {
    const loadCurrentPeriod = async () => {
      try {
        const period = await getCurrentAcademicPeriod();
        setCurrentPeriod(period);
      } catch (error) {
        console.error("Error loading academic period:", error);
        toast.error("Failed to load academic period");
      }
    };
    loadCurrentPeriod();
  }, []);

  const validateExcelFormat = async (file) => {
    try {
      const data = await importUtils.readFile(file);

      // Check if the file has the minimum required rows
      if (!Array.isArray(data) || data.length < 5) {
        throw new Error(
          "The file format is incorrect. It must have at least 5 rows of data."
        );
      }

      // Check required cells in Column B (index 1)
      const requiredCellsB = [
        { row: 0, value: "School Year" },
        { row: 1, value: "Period Type" },
        { row: 2, value: "Event Name" },
        { row: 3, value: "Event Venue" },
        { row: 4, value: "Event Category" },
      ];

      // Check required cells in Column F (index 5)
      const requiredCellsF = [
        { row: 0, value: "Event Type" },
        { row: 1, value: "Event Time Range" },
        { row: 2, value: "Event Date" },
      ];

      // Validate Column B cells
      for (const cell of requiredCellsB) {
        if (!data[cell.row] || !data[cell.row][1]) {
          throw new Error(
            `Missing required information in Column B, Row ${
              cell.row + 1
            }. Please check the file format.`
          );
        }
      }

      // Validate Column F cells
      for (const cell of requiredCellsF) {
        if (!data[cell.row] || !data[cell.row][5]) {
          throw new Error(
            `Missing required information in Column F, Row ${
              cell.row + 1
            }. Please check the file format.`
          );
        }
      }

      // Check time format in Column F, Row 2
      const timeRange = data[1][5];
      if (!timeRange || !timeRange.includes("-")) {
        throw new Error(
          "Invalid time range format in Column F, Row 2. Expected format: HH:MM AM/PM - HH:MM AM/PM"
        );
      }

      // Check date format in Column F, Row 3
      const date = data[2][5];
      if (!date || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
        throw new Error(
          "Invalid date format in Column F, Row 3. Expected format: MM/DD/YYYY"
        );
      }

      return true;
    } catch (error) {
      console.error("Validation error:", error);
      throw new Error(`Invalid file format: ${error.message}`);
    }
  };

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);
    setPreviewData(null);

    try {
      // First validate the file type
      validateFileType(selectedFile);

      // Then validate the Excel format
      await validateExcelFormat(selectedFile);

      // If validation passes, proceed with data extraction
      const data = await importUtils.handleFileChange(selectedFile);
      const formattedData = importUtils.formatEventPreview(data);
      setPreviewData(formattedData);
    } catch (error) {
      console.error("File validation error:", error);
      setError(error.message);
      toast.error(error.message);
      setFile(null);
      setPreviewData(null);
      // Reset the file input
      e.target.value = "";
    }
  };

  const validateFileType = (file) => {
    const validExtensions = ["xlsx", "xls", "csv"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      throw new Error("Invalid file type. Please upload an Excel or CSV file.");
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("No file selected. Please choose a file to import.");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const currentPeriod = await getCurrentAcademicPeriod();
      if (!currentPeriod) {
        throw new Error(
          "No active academic period found. Please set up an academic period first."
        );
      }

      validateFileType(file);

      const data = await importUtils.handleFileChange(file);
      const eventMetadata = data.eventMetadata;

      const duplicateCheck = await importUtils.checkForDuplicateEvent({
        eventName: eventMetadata.eventName,
        eventDate: eventMetadata.eventDate,
        eventVenue: eventMetadata.eventVenue,
      });

      if (duplicateCheck.isDuplicate) {
        throw new Error(
          "An event with the same name, date, and venue already exists."
        );
      }

      const result = await importUtils.importEventAndParticipants(
        file,
        currentPeriod.$id
      );

      if (result && result.success) {
        toast.success(result.message || "Event imported successfully!");
        setFile(null);
        setPreviewData(null);
        setIsDialogOpen(false);

        try {
          await createNotification({
            userId: "admin",
            type: "event",
            title: "New Event Imported",
            message: `Event "${result.event.eventName}" has been imported with ${result.participantCounts.total} participants`,
            actionType: "event_import",
            eventId: result.event.$id,
            status: "info",
            read: false,
          });
        } catch (notifError) {
          console.error("Error creating notification:", notifError);
        }

        if (onSuccess) {
          onSuccess(result.event);
        }
      } else {
        throw new Error(
          result.message || "Import failed: No response from server"
        );
      }
    } catch (error) {
      const errorMessage =
        error?.message || "Failed to import data. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const resetPreview = () => {
    setFile(null);
    setPreviewData(null);
    setError(null);
  };

  const handleDialogClose = () => {
    resetPreview();
    setIsDialogOpen(false);
  };

  return (
    <div>
      <Button
        className="w-full sm:w-auto whitespace-nowrap"
        onClick={() => setIsDialogOpen(true)}
      >
        <span className="hidden sm:inline">Import Event</span>
        <span className="sm:hidden">Import</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Event Data</DialogTitle>
            <DialogDescription>
              Upload an Excel file containing event and participant information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="format-guide">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Required Excel Format Guide
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm space-y-2 text-muted-foreground">
                    <p>Your Excel file must follow this format:</p>
                    <div className="pl-4 space-y-2">
                      <p>
                        <strong>Row 1:</strong> School Year (Column B)
                      </p>
                      <p>
                        <strong>Row 2:</strong> Period Type (Column B)
                      </p>
                      <p>
                        <strong>Row 3:</strong> Event Name (Column B)
                      </p>
                      <p>
                        <strong>Row 4:</strong> Event Venue (Column B)
                      </p>
                      <p>
                        <strong>Row 5:</strong> Event Category (Column B)
                      </p>
                      <p>
                        <strong>Row 1:</strong> Event Type (Column F)
                      </p>
                      <p>
                        <strong>Row 2:</strong> Event Time Range (Column F) -
                        Format: HH:MM AM/PM - HH:MM AM/PM
                      </p>
                      <p>
                        <strong>Row 3:</strong> Event Date (Column F) - Format:
                        MM/DD/YYYY
                      </p>
                    </div>
                    <p className="mt-2">Participant Information:</p>
                    <div className="pl-4 space-y-2">
                      <p>
                        <strong>Required Fields:</strong>
                      </p>
                      <ul className="list-disc pl-4">
                        <li>Name</li>
                        <li>Student ID (for students)</li>
                        <li>Sex (Male/Female)</li>
                        <li>Age</li>
                        <li>Address</li>
                      </ul>
                    </div>
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Important</AlertTitle>
                      <AlertDescription>
                        All required fields must be filled. Missing or invalid
                        data will prevent the import.
                      </AlertDescription>
                    </Alert>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {previewData && previewData.participantDetails ? (
              <div className="overflow-y-auto max-h-[50vh]">
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <p>
                          <strong>School Year:</strong>{" "}
                          {previewData.schoolYear || "N/A"}
                        </p>
                        <p>
                          <strong>Period Type:</strong>{" "}
                          {previewData.periodType || "N/A"}
                        </p>
                        <p>
                          <strong>Event Name:</strong>{" "}
                          {previewData.eventName || "N/A"}
                        </p>
                        <p>
                          <strong>Event Date:</strong>{" "}
                          {previewData.eventDate || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p>
                          <strong>Event Time:</strong>{" "}
                          {previewData.eventTime || "N/A"}
                        </p>
                        <p>
                          <strong>Duration:</strong>{" "}
                          {previewData.duration || "N/A"}
                        </p>
                        <p>
                          <strong>Event Venue:</strong>{" "}
                          {previewData.eventVenue || "N/A"}
                        </p>
                        <p>
                          <strong>Event Type:</strong>{" "}
                          {previewData.eventType || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p>
                        <strong>Event Category:</strong>{" "}
                        {previewData.eventCategory || "N/A"}
                      </p>
                    </div>

                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold text-lg text-center mb-3">
                        Participant Summary
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p>
                            <strong>Total Participants:</strong>{" "}
                            {previewData.totalParticipants || 0}
                          </p>
                          <div className="flex gap-4 mt-2">
                            <p>
                              <strong>Male:</strong>{" "}
                              {previewData.participantDetails?.male || 0}
                            </p>

                            <p>
                              <strong>Female:</strong>{" "}
                              {previewData.participantDetails?.female || 0}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p>
                            <strong>Students:</strong>{" "}
                            {previewData.participantDetails?.students || 0}
                          </p>
                          <p>
                            <strong>Staff/Faculty:</strong>{" "}
                            {previewData.participantDetails?.staffFaculty || 0}
                          </p>
                          <p>
                            <strong>Community:</strong>{" "}
                            {previewData.participantDetails?.community || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No file chosen. Upload a file to see the preview.
              </p>
            )}
            <div className="flex justify-end">
              <Button onClick={handleImport} disabled={isImporting || !file}>
                {isImporting ? "Importing..." : "Confirm Import"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
