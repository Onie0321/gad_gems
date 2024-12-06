import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventParticipationTrends } from "./event-participation/page"
import { DemographicTrends } from "./demographic-trends/page"
import { ActionableInsights } from "./actionable-insights/page"
import { fetchTrendData, processTrendData } from '@/lib/appwrite'
import { DateRangePicker } from "@/components/ui/date-range-picker"

export const Trends = () => {
  const [trendData, setTrendData] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawData = await fetchTrendData(
          dateRange.from.toISOString().split('T')[0],
          dateRange.to.toISOString().split('T')[0]
        );
        const processedData = processTrendData(rawData);
        setTrendData(processedData);
      } catch (error) {
        console.error("Error fetching trend data:", error);
      }
    };

    fetchData();
  }, [dateRange]);

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
