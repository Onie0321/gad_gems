import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ReportsSection() {
  return (
    <Tabs defaultValue="event-reports">
      <TabsList>
        <TabsTrigger value="event-reports">Event Reports</TabsTrigger>
        <TabsTrigger value="demographic-reports">Demographic Reports</TabsTrigger>
        <TabsTrigger value="performance-metrics">Performance Metrics</TabsTrigger>
      </TabsList>
      <TabsContent value="event-reports">
        <Card>
          <CardHeader>
            <CardTitle>Event Reports</CardTitle>
            <CardDescription>View and download reports for individual events</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Satisfaction Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Women in Tech Summit</TableCell>
                  <TableCell>2023-11-15</TableCell>
                  <TableCell>250</TableCell>
                  <TableCell>95%</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View</Button>
                    <Button variant="outline" size="sm" className="ml-2">Download</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Gender Equality Workshop</TableCell>
                  <TableCell>2023-11-20</TableCell>
                  <TableCell>100</TableCell>
                  <TableCell>92%</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View</Button>
                    <Button variant="outline" size="sm" className="ml-2">Download</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="demographic-reports">
        <Card>
          <CardHeader>
            <CardTitle>Demographic Reports</CardTitle>
            <CardDescription>Analyze participant demographics across all events</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Total Participants</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Q4 2023 Demographics</TableCell>
                  <TableCell>Oct 1, 2023 - Dec 31, 2023</TableCell>
                  <TableCell>1,500</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View</Button>
                    <Button variant="outline" size="sm" className="ml-2">Download</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Annual Demographics 2023</TableCell>
                  <TableCell>Jan 1, 2023 - Dec 31, 2023</TableCell>
                  <TableCell>5,000</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View</Button>
                    <Button variant="outline" size="sm" className="ml-2">Download</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="performance-metrics">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators for GADConnect initiatives</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Previous Period</TableHead>
                  <TableHead>Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Total Events</TableCell>
                  <TableCell>24</TableCell>
                  <TableCell>20</TableCell>
                  <TableCell className="text-green-600">+20%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Participants</TableCell>
                  <TableCell>1,234</TableCell>
                  <TableCell>1,000</TableCell>
                  <TableCell className="text-green-600">+23.4%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Average Satisfaction Rate</TableCell>
                  <TableCell>92%</TableCell>
                  <TableCell>89%</TableCell>
                  <TableCell className="text-green-600">+3%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Gender Diversity Index</TableCell>
                  <TableCell>0.85</TableCell>
                  <TableCell>0.80</TableCell>
                  <TableCell className="text-green-600">+6.25%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}