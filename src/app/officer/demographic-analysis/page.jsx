"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, Line, LineChart, Pie, PieChart } from "@/components/ui/chart"

const ageData = [
  { name: '18-25', value: 35 },
  { name: '26-35', value: 45 },
  { name: '36-45', value: 15 },
  { name: '46+', value: 5 },
]

const genderData = [
  { name: 'Male', value: 48 },
  { name: 'Female', value: 50 },
  { name: 'Non-binary', value: 2 },
]

const educationData = [
  { name: 'High School', value: 15 },
  { name: 'Bachelor', value: 50 },
  { name: 'Master', value: 30 },
  { name: 'PhD', value: 5 },
]

const genderOverTimeData = [
  { year: 2019, male: 55, female: 44, nonBinary: 1 },
  { year: 2020, male: 53, female: 45, nonBinary: 2 },
  { year: 2021, male: 51, female: 47, nonBinary: 2 },
  { year: 2022, male: 49, female: 49, nonBinary: 2 },
  { year: 2023, male: 48, female: 50, nonBinary: 2 },
]

const ethnicData = [
  { name: 'Group A', value: 35 },
  { name: 'Group B', value: 30 },
  { name: 'Group C', value: 20 },
  { name: 'Group D', value: 10 },
  { name: 'Others', value: 5 },
]

export default function DemographicAnalysis() {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="gender">Gender Representation</TabsTrigger>
        <TabsTrigger value="ethnic">Ethnic Group Analysis</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart data={ageData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Gender Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart data={genderData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Education Level</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={educationData} />
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      <TabsContent value="gender" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Gender Representation Insights</CardTitle>
            <CardDescription>Track gender-based metrics across events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="gad-seminar-2024">GAD Seminar 2024</SelectItem>
                    <SelectItem value="women-leadership-2023">Women in Leadership 2023</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-time">All Time</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="last-year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <LineChart
                data={genderOverTimeData}
                index="year"
                categories={["male", "female", "nonBinary"]}
                colors={["blue", "pink", "purple"]}
                yAxisWidth={40}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="ethnic" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Ethnic Group Representation Analysis</CardTitle>
            <CardDescription>Analyze ethnic diversity across events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="gad-seminar-2024">GAD Seminar 2024</SelectItem>
                  <SelectItem value="women-leadership-2023">Women in Leadership 2023</SelectItem>
                </SelectContent>
              </Select>
              <BarChart data={ethnicData} />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}