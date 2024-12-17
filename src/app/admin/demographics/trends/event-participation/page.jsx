"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChartComponent } from "@/components/charts/LineChart";
import { format } from "date-fns";

export const EventParticipationTrends = ({ data }) => {
  if (!data) return <div>Loading...</div>;

  const formattedData = data.map(item => ({
    ...item,
    date: format(new Date(item.date), "MMM dd, yyyy")
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Event Participation Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChartComponent 
            data={formattedData}
            xDataKey="date"
            yDataKeys={["total"]}
            colors={["#2D89EF"]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gender Participation Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChartComponent 
            data={formattedData}
            xDataKey="date"
            yDataKeys={["male", "female"]}
            colors={["#4299E1", "#ED64A6"]}
          />
        </CardContent>
      </Card>
    </div>
  );
};
