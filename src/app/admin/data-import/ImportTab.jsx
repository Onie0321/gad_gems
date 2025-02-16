"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import {
  importEmployeeDataInBatches,
  validateEmployeeData,
} from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function ImportTab({ fetchEmployeeData, setDataImported }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [importedData, setImportedData] = useState([]);
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    setFile(file);
    setFileName(file.name);

    Papa.parse(file, {
      complete: handleParseComplete,
      header: true,
      skipEmptyLines: true,
    });
  };

  const handleParseComplete = (results) => {
    const parsedData = results.data.map((row) => {
      let questions = [];
      let answers = [];

      Object.entries(row)
        .filter(
          ([key]) =>
            ![
              "Timestamp",
              "Email Address",
              "Fullname (Ex. Juan A. Dela Cruz)",
              "Age",
              "Date of Birth (Ex. January 1, 2024)",
              "Address",
              "CP No. of Employee",
              "Sex (at birth)",
              "Gender",
              "Gender, if non-heterosexual",
            ].includes(key)
        )
        .forEach(([question, answer]) => {
          questions.push(question);
          answers.push(answer || "N/A");
        });

      return {
        email: row["Email Address"] || "",
        name: row["Fullname (Ex. Juan A. Dela Cruz)"] || "",
        age: row["Age"] ? String(row["Age"]).slice(0, 1000) : "",
        birth: row["Date of Birth (Ex. January 1, 2024)"] || "Not provided",
        address: row["Address"] || "Not provided",
        cpNumber: row["CP No. of Employee"] || "Not provided",
        sexAtBirth: row["Sex (at birth)"] || "",
        gender: row["Gender"] || "",
        "genderIfNon-Heterosexual":
          row["Gender, if non-heterosexual"] || "Not applicable",
        timeStamp: row["Timestamp"] || new Date().toISOString(),
        questions,
        answers,
      };
    });
    setImportedData(parsedData);
    setError("");
  };

  const confirmImport = async () => {
    setIsLoading(true);
    setImportResult(null);

    try {
      const requiredFields = [
        "email",
        "name",
        "age",
        "address",
        "cpNumber",
        "sexAtBirth",
        "gender",
        "genderIfNon-Heterosexual",
      ];

      const processedData = importedData.map((data) => {
        try {
          return validateEmployeeData(data, requiredFields);
        } catch (error) {
          console.error("Validation error:", error);
          throw error;
        }
      });

      const importLog = await importEmployeeDataInBatches(processedData, 50);

      setImportResult({
        total: importLog.total,
        successful: importLog.successful,
        failed: importLog.failed,
        failedRecords: importLog.failedRecords,
      });

      if (importLog.failed === 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${importLog.successful} records.`,
          variant: "default",
        });
      } else if (importLog.successful > 0) {
        toast({
          title: "Partial Import Success",
          description: `Imported ${importLog.successful} records. ${importLog.failed} records failed.`,
          variant: "warning",
        });
      } else {
        toast({
          title: "Import Failed",
          description: `Failed to import ${importLog.failed} records.`,
          variant: "destructive",
        });
      }

      setFile(null);
      setFileName("");
      setImportedData([]);

      await fetchEmployeeData();
      setDataImported(true);
    } catch (error) {
      console.error("Error importing data:", error);
      setError(
        `Failed to import data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      toast({
        title: "Import Error",
        description: `An error occurred while importing data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  const renderImportResults = () => {
    if (!importResult) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Import Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Badge variant="outline">
                Total Records: {importResult.total}
              </Badge>
              <Badge variant="default">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Successful:{" "}
                {importResult.successful}
              </Badge>
              <Badge variant="destructive">
                <XCircle className="mr-2 h-4 w-4" /> Failed:{" "}
                {importResult.failed}
              </Badge>
            </div>

            {importResult.failed > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import Partial Failure</AlertTitle>
                <AlertDescription>
                  Some records could not be imported. Check the console for
                  details.
                </AlertDescription>
              </Alert>
            )}

            {importResult.failedRecords &&
              importResult.failedRecords.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-2">Failed Records</h4>
                  <ScrollArea className="h-[200px] border rounded-md p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Record Details</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.failedRecords
                          .slice(0, 10)
                          .map((record, index) => (
                            <TableRow key={index}>
                              <TableCell>{record.record.name}</TableCell>
                              <TableCell className="text-red-500">
                                {record.error}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>File Import</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer"
          >
            <input {...getInputProps()} />
            <p>Drag & drop a CSV file here, or click to select one</p>
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {file && (
            <div className="mt-4">
              <Input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="mb-2"
              />
              <div className="mt-4 space-x-2">
                <Button onClick={confirmImport} disabled={isLoading}>
                  {isLoading ? "Importing..." : "Confirm Import"}
                </Button>
                <Button
                  onClick={() => setFile(null)}
                  variant="outline"
                  disabled={isLoading}
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {importedData.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Imported Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Gender (Non-Heterosexual)</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importedData.map((employee, index) => (
                    <TableRow key={index}>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.age}</TableCell>
                      <TableCell>{employee.gender}</TableCell>
                      <TableCell>
                        {employee["genderIfNon-Heterosexual"]}
                      </TableCell>
                      <TableCell>{employee.timeStamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
      {renderImportResults()}
    </div>
  );
}
