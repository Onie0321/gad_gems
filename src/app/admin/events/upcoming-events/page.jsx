import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function UpcomingEvents() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
        <CardDescription>Manage and view details of upcoming events.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Women in Tech Summit</TableCell>
              <TableCell>2024-03-15</TableCell>
              <TableCell>Virtual</TableCell>
              <TableCell>250</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">View</Button>
                <Button variant="outline" size="sm" className="ml-2">Edit</Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Gender Equality Workshop</TableCell>
              <TableCell>2024-04-20</TableCell>
              <TableCell>New York</TableCell>
              <TableCell>100</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">View</Button>
                <Button variant="outline" size="sm" className="ml-2">Edit</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

