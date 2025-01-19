"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import {
  importEventAndParticipants,
  extractEventMetadata,
  extractParticipants,
  readFile,
  formatDateForDisplay,
  formatDurationForDisplay,
  calculateDuration,
} from "@/utils/importUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCurrentAcademicPeriod } from "@/lib/appwrite";

export default function ImportEventData() {
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

  const handleFileChange = async (event) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setError(null);
      try {
        if (!currentPeriod) {
          throw new Error(
            "No active academic period found. Please set up an academic period first."
          );
        }

        const data = await readFile(selectedFile);
        console.log("File data:", data);
        const eventMetadata = extractEventMetadata(data);
        console.log("Extracted event metadata:", eventMetadata);
        const participants = extractParticipants(data);
        console.log("Extracted participants:", participants);
        setPreviewData({
          eventMetadata: {
            ...eventMetadata,
            academicPeriodId: currentPeriod.$id,
            isArchived: false,
          },
          participants: participants.map((participant) => ({
            ...participant,
            academicPeriodId: currentPeriod.$id,
            isArchived: false,
          })),
        });
      } catch (error) {
        console.error("Error parsing file:", error);
        setError(`Error parsing file: ${error.message || String(error)}`);
        setPreviewData(null);
      }
    } else {
      setFile(null);
      setPreviewData(null);
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

    if (!currentPeriod) {
      toast.error(
        "No active academic period. Please set up an academic period first."
      );
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      validateFileType(file);
      const result = await importEventAndParticipants(file, currentPeriod.$id);
      toast.success(result.message);
      setFile(null);
      setPreviewData(null);
      setIsDialogOpen(false);
    } catch (error) {
      let errorMessage = "Failed to import data.";
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes("Invalid document structure")) {
          errorMessage =
            "Invalid data format. Please check the file contents and try again.";
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const EventPreview = ({ data }) => {
    // Format the date
    const formatEventDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    // Format the time range
    const formatTimeRange = (timeFrom, timeTo) => {
      const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date
          .toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
          .toUpperCase();
      };

      const fromTime = formatTime(timeFrom);
      const toTime = formatTime(timeTo);
      return `${fromTime} - ${toTime}`;
    };

    // Calculate and format duration
    const formatDuration = (timeFrom, timeTo) => {
      const start = new Date(timeFrom);
      const end = new Date(timeTo);
      const durationMs = end - start;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${
        minutes !== 1 ? "s" : ""
      }`;
    };

    const eventDate = formatEventDate(data.eventMetadata.eventDate);
    const eventTime = formatTimeRange(
      data.eventMetadata.eventTimeFrom,
      data.eventMetadata.eventTimeTo
    );
    const duration = formatDuration(
      data.eventMetadata.eventTimeFrom,
      data.eventMetadata.eventTimeTo
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p>
            <strong>Event Name:</strong> {data.eventMetadata.eventName}
          </p>
          <p>
            <strong>Event Date:</strong> {eventDate}
          </p>
          <p>
            <strong>Event Time:</strong> {eventTime}
          </p>
          <p>
            <strong>Duration:</strong> {duration}
          </p>
          <p>
            <strong>Event Venue:</strong> {data.eventMetadata.eventVenue}
          </p>
          <p>
            <strong>Event Type:</strong> {data.eventMetadata.eventType}
          </p>
          <p>
            <strong>Event Category:</strong> {data.eventMetadata.eventCategory}
          </p>
          <p>
            <strong>Total Participants:</strong> {data.participants.length}
          </p>
          <p>
            <strong>Male Participants:</strong>{" "}
            {data.participants.filter((p) => p.sex === "Male").length}
          </p>
          <p>
            <strong>Female Participants:</strong>{" "}
            {data.participants.filter((p) => p.sex === "Female").length}
          </p>
          <Accordion type="single" collapsible>
            <AccordionItem value="participants">
              <AccordionTrigger>View Participants</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5">
                  {data.participants.map((participant, index) => (
                    <li key={index}>
                      {participant.name} - {participant.studentId} (
                      {participant.sex})
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>Import Event</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Event Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />
          {previewData ? (
            <EventPreview data={previewData} />
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
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isImporting || !file}>
              {isImporting ? "Importing..." : "Confirm Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
