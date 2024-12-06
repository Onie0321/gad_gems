import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChartComponent } from "@/components/charts/BarCharts";

export const DemographicTrends= ({ ageData, ethnicData }) => {
  if (!ageData || !ethnicData) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Age Distribution Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChartComponent 
            data={ageData} 
            xDataKey="name" 
            yDataKeys={["male", "female"]} 
            colors={["#4299E1", "#ED64A6"]} 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ethnic and Racial Diversity Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChartComponent 
            data={ethnicData} 
            xDataKey="name" 
            yDataKeys={["male", "female"]} 
            colors={["#4299E1", "#ED64A6"]} 
          />
        </CardContent>
      </Card>
    </div>
  )
}

