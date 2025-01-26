"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { DemographicsOverview } from "./overview/page";
import { DetailedAnalysis } from "./detailed-analysis/page";
import { databases, databaseId, academicPeriodCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";

export default function DemographicAnalysis() {
  const [loading, setLoading] = useState(true);
  const [hasParticipants, setHasParticipants] = useState(true);
  const [academicPeriods, setAcademicPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const initializeData = async () => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          academicPeriodCollectionId,
          [Query.orderDesc("startDate")]
        );
        setAcademicPeriods(response.documents);

        // Set the current period as default
        const currentPeriod = response.documents.find(
          (period) => period.isActive
        );
        if (currentPeriod) {
          setSelectedPeriod(currentPeriod.$id);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching academic periods:", error);
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasParticipants) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center text-gray-500">
        <p className="text-lg">No participants found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Academic Period Selector */}
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold">Select Academic Period:</h2>
        <Select
          value={selectedPeriod}
          onValueChange={(value) => setSelectedPeriod(value)}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select academic period" />
          </SelectTrigger>
          <SelectContent>
            {academicPeriods.map((period) => (
              <SelectItem key={period.$id} value={period.$id}>
                {period.schoolYear} - {period.periodType}
                {period.isActive && " (Current)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DemographicsOverview selectedPeriod={selectedPeriod} />
        </TabsContent>

        <TabsContent value="detailed">
          <DetailedAnalysis 
            selectedPeriod={selectedPeriod} 
            setLoading={setLoading}
            setHasParticipants={setHasParticipants}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
