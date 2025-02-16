"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportTab } from "./data-import/ImportTab";
import { EmployeeDataTab } from "./data-import/EmployeeDataLab";
import { AnalyticsTab } from "./data-import/AnalyticTab";
import { getAllEmployeeData } from "@/lib/appwrite";

export default function DataImportAnalytics() {
  const [employeeData, setEmployeeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataImported, setDataImported] = useState(false);

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllEmployeeData();
      setEmployeeData(data);
      setDataImported(false);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setError("Failed to fetch employee data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="data">Employee Data</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="import">
          <ImportTab
            employeeData={employeeData}
            fetchEmployeeData={fetchEmployeeData}
            setDataImported={setDataImported}
          />
        </TabsContent>
        <TabsContent value="data">
          <EmployeeDataTab
            employeeData={employeeData}
            dataImported={dataImported}
          />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab employeeData={employeeData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
