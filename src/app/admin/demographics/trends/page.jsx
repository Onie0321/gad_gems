"use client";
import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventParticipationTrends } from "./event-participation/page"
import { DemographicTrends } from "./demographic-trends/page"
import { ActionableInsights } from "./actionable-insights/page"
import { databases, databaseId, participantCollectionId, eventCollectionId } from '@/lib/appwrite'
import { Query } from 'appwrite'
import { DateRangePicker } from "@/components/ui/date-range-picker"
import GADConnectSimpleLoader from "@/components/loading/simpleLoading"

export const Trends = () => {
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      
      // Fetch participants within date range
      const participantsResponse = await databases.listDocuments(
        databaseId,
        participantCollectionId,
        [
          Query.greaterThanEqual('$createdAt', dateRange.from.toISOString()),
          Query.lessThanEqual('$createdAt', dateRange.to.toISOString()),
          Query.limit(1000)
        ]
      );

      // Process data for different trend analyses
      const processedData = {
        eventParticipation: processEventParticipation(participantsResponse.documents),
        ageDistribution: processAgeDistribution(participantsResponse.documents),
        ethnicDistribution: processEthnicDistribution(participantsResponse.documents)
      };

      setTrendData(processedData);
    } catch (error) {
      console.error("Error fetching trend data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendData();
  }, [dateRange]);

  const processEventParticipation = (participants) => {
    const participationByDate = participants.reduce((acc, participant) => {
      const date = new Date(participant.$createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, total: 0, male: 0, female: 0 };
      }
      acc[date].total++;
      acc[date][participant.sex.toLowerCase()]++;
      return acc;
    }, {});

    return Object.values(participationByDate).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  };

  const processAgeDistribution = (participants) => {
    const ageGroups = participants.reduce((acc, participant) => {
      const age = parseInt(participant.age);
      let group = '';
      if (age < 18) group = '18 and below';
      else if (age <= 24) group = '18-24';
      else if (age <= 34) group = '25-34';
      else if (age <= 44) group = '35-44';
      else group = '45+';

      if (!acc[group]) {
        acc[group] = { name: group, male: 0, female: 0 };
      }
      acc[group][participant.sex.toLowerCase()]++;
      return acc;
    }, {});

    return Object.values(ageGroups);
  };

  const processEthnicDistribution = (participants) => {
    const ethnicGroups = participants.reduce((acc, participant) => {
      const group = participant.ethnicGroup;
      if (!acc[group]) {
        acc[group] = { name: group, male: 0, female: 0 };
      }
      acc[group][participant.sex.toLowerCase()]++;
      return acc;
    }, {});

    return Object.values(ethnicGroups);
  };

  if (loading) return <GADConnectSimpleLoader />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Trends Analysis</h1>
      <DateRangePicker
        from={dateRange.from}
        to={dateRange.to}
        onSelect={setDateRange}
      />
      <Tabs defaultValue="participation">
        <TabsList>
          <TabsTrigger value="participation">Event Participation</TabsTrigger>
          <TabsTrigger value="demographics">Demographic Data</TabsTrigger>
          <TabsTrigger value="insights">Actionable Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="participation">
          <EventParticipationTrends data={trendData?.eventParticipation} />
        </TabsContent>
        <TabsContent value="demographics">
          <DemographicTrends 
            ageData={trendData?.ageDistribution}
            ethnicData={trendData?.ethnicDistribution}
          />
        </TabsContent>
        <TabsContent value="insights">
          <ActionableInsights data={trendData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
