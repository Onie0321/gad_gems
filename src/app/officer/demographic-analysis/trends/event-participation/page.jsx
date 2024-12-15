import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChartComponent } from "@/components/charts/LineChart";
import { BarChartComponent } from "@/components/charts/BarCharts";
import { format } from "date-fns"; // Import date-fns for date formatting

export const EventParticipationTrends = ({ data }) => {
  if (!data) return <div>Loading...</div>;

  // Function to format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString); 
    return format(date, "MMMM dd, yyyy"); // Format to "March 21, 2002"
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Event Participation Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChartComponent 
            data={data.map(item => ({
              ...item, // Spread the existing properties
              date: formatDate(item.date) // Format the date
            }))} 
            xDataKey="date" 
            yDataKeys={["total"]} 
            colors={["#8884d8"]} 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gender Participation Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChartComponent 
            data={data.map(item => ({
              ...item, // Spread the existing properties
              date: formatDate(item.date) // Format the date
            }))} 
            xDataKey="date" 
            yDataKeys={["male", "female"]} 
            colors={["#8884d8", "#82ca9d"]} 
          />
        </CardContent>
      </Card>
    </div>
  );
};
