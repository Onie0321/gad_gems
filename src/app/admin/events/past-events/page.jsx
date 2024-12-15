import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClipboardList } from 'lucide-react'

export function PastEvents() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Past Events</CardTitle>
        <CardDescription>View and analyze past events.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Attendees</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Diversity in Leadership</TableCell>
              <TableCell>2023-11-25</TableCell>
              <TableCell>London</TableCell>
              <TableCell>150</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">View Report</Button>
                  <Button variant="outline" size="icon">
                    <ClipboardList className="h-4 w-4" />
                    <span className="sr-only">Questionnaire Builder</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>STEM for Girls</TableCell>
              <TableCell>2023-10-10</TableCell>
              <TableCell>Chicago</TableCell>
              <TableCell>200</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">View Report</Button>
                  <Button variant="outline" size="icon">
                    <ClipboardList className="h-4 w-4" />
                    <span className="sr-only">Questionnaire Builder</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

