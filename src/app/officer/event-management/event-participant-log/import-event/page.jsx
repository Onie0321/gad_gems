import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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

export default function ImportEventData() {
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    setFile(file);
    setError(null);

    try {
      validateFileType(file);
      const data = await importUtils.handleFileChange(file);
      setPreviewData(data);
    } catch (error) {
      setError(error.message);
      console.error("Error parsing file:", error);
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
        throw new Error("No active academic period found. Please set up an academic period first.");
      }

      validateFileType(file);

      const result = await importUtils.importEventAndParticipants(
        file,
        currentPeriod.$id
      );

      toast.success(result.message);
      
      setFile(null);
      setPreviewData(null);
      setIsDialogOpen(false);

      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      let errorMessage = "Failed to import data.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const EventPreview = ({ data }) => {
    const previewData = importUtils.formatEventPreview(data);
    
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p>
            <strong>School Year:</strong> {previewData.schoolYear}
          </p>
          <p>
            <strong>Period Type:</strong> {previewData.periodType}
          </p>
          <p>
            <strong>Event Name:</strong> {previewData.eventName}
          </p>
          <p>
            <strong>Event Date:</strong> {previewData.eventDate}
          </p>
          <p>
            <strong>Event Time:</strong> {previewData.eventTime}
          </p>
          <p>
            <strong>Duration:</strong> {previewData.duration}
          </p>
          <p>
            <strong>Event Venue:</strong> {previewData.eventVenue}
          </p>
          <p>
            <strong>Event Type:</strong> {previewData.eventType}
          </p>
          <p>
            <strong>Event Category:</strong> {previewData.eventCategory}
          </p>
          <div className="mt-4">
            <p>
              <strong>Total Participants:</strong> {previewData.totalParticipants}
            </p>
            <p>
              <strong>Gender Distribution:</strong> Male: {previewData.participantDetails.male} | Female: {previewData.participantDetails.female}
            </p>
            <p className="text-sm mt-1">
              <strong>Students:</strong> {previewData.participantDetails.students} | 
              <strong> Staff/Faculty:</strong> {previewData.participantDetails.staffFaculty} | 
              <strong> Community:</strong> {previewData.participantDetails.community}
            </p>
          </div>
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
          {previewData ? (
            <EventPreview data={previewData} />
          ) : (
            <p className="text-center text-gray-500">No file chosen. Upload a file to see the preview.</p>
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

