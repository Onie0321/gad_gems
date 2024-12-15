import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import { Button } from "@/components/ui/button"
  
  export function StudentTable({ students, onEdit, onDelete, isLoading }) {
    if (students.length === 0) {
      return <p>No students added yet.</p>
    }
  
    const headers = [
      "Name",
      "Student ID",
      "Course",
      "Year",
      "Section",
      "Actions"
    ]
  
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={students.$id}>
                <TableCell>{`${students.surName}, ${students.firstName} ${students.lastName}`}</TableCell>
                <TableCell>{students.studentId}</TableCell>
                <TableCell>{students.course}</TableCell>
                <TableCell>{students.year}</TableCell>
                <TableCell>{students.section}</TableCell>
                <TableCell>
                  <Button onClick={() => onEdit(students)} className="mr-2" disabled={isLoading}>Edit</Button>
                  <Button onClick={() => onDelete(students.$id)} variant="destructive" disabled={isLoading}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }
  
  