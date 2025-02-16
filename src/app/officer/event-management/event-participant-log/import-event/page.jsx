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

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);

    try {
      validateFileType(selectedFile);
      const data = await importUtils.handleFileChange(selectedFile);
      const formattedData = importUtils.formatEventPreview(data);
      setPreviewData(formattedData);
    } catch (error) {
      setError(error.message);
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

      // Extract event metadata from file
      const data = await importUtils.handleFileChange(file);
      const eventMetadata = data.eventMetadata;

      // Check for duplicate event
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

      // Continue with import if no duplicate found
      const result = await importUtils.importEventAndParticipants(
        file,
        currentPeriod.$id
      );

      if (result && result.success) {
        toast.success(result.message || "Event imported successfully!");
        setFile(null);
        setPreviewData(null);
        setIsDialogOpen(false);

        // Create notification (only if notifications collection exists)
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
          // Continue even if notification fails
        }

        // Call onSuccess callback if provided
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
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
            {previewData && previewData.participantDetails ? (
              <div className="overflow-y-auto max-h-[50vh]">
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Event Details Section */}
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

                    {/* Participant Summary Section */}
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
            {error && (
              <div className="text-red-500 mt-2" role="alert">
                Error: {error}
              </div>
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
