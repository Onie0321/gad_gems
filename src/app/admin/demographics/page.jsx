import { Bar, BarChart, Line, LineChart, Pie, PieChart, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function DemographicsSection() {
  const ageData = [
    { age: "18-24", count: 200 },
    { age: "25-34", count: 300 },
    { age: "35-44", count: 250 },
    { age: "45-54", count: 150 },
    { age: "55+", count: 100 },
  ]

  const genderData = [
    { name: "Female", value: 60 },
    { name: "Male", value: 35 },
    { name: "Non-binary", value: 5 },
  ]

  const locationData = [
    { name: "North America", value: 400 },
    { name: "Europe", value: 300 },
    { name: "Asia", value: 200 },
    { name: "Other", value: 100 },
  ]

  const participationTrendData = [
    { year: 2019, participants: 800 },
    { year: 2020, participants: 1000 },
    { year: 2021, participants: 1200 },
    { year: 2022, participants: 1500 },
    { year: 2023, participants: 1800 },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Demographic Overview</CardTitle>
          <CardDescription>Analysis of participant demographics across all events</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="age">
            <TabsList>
              <TabsTrigger value="age">Age Distribution</TabsTrigger>
              <TabsTrigger value="gender">Gender Distribution</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>
            <TabsContent value="age">
              <ChartContainer config={{ age: { label: "Age Group", color: "hsl(var(--chart-1))" } }} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData}>
                    <Bar dataKey="count" fill="var(--color-age)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
            <TabsContent value="gender">
              <ChartContainer config={{ gender: { label: "Gender", color: "hsl(var(--chart-2))" } }} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="var(--color-gender)"
                      label
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
            <TabsContent value="location">
              <ChartContainer config={{ location: { label: "Location", color: "hsl(var(--chart-3))" } }} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={locationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="var(--color-location)"
                      label
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Participation Trends</CardTitle>
          <CardDescription>Year-over-year participation growth</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ participants: { label: "Participants", color: "hsl(var(--chart-4))" } }} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={participationTrendData}>
                <Line type="monotone" dataKey="participants" stroke="var(--color-participants)" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}