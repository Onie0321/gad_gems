'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function StudentList() {
  const [students, setStudents] = useState([
    {
      id: "1",
      surname: "Doe",
      firstName: "John",
      lastName: "Smith",
      studentId: "2023001",
      email: "john.doe@example.com",
      course: "Computer Science",
      year: "1st",
      section: "A",
    },
    // Add more sample students here
  ])

  const [searchTerm, setSearchTerm] = useState("")

  const filteredStudents = students.filter((student) =>
    Object.values(student).some((value) =>
      value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const handleDelete = (id) => {
    setStudents(students.filter((student) => student.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button>Add New Student</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Surname</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Student ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStudents.map((student) => (
            <TableRow key={student.id}>
              <TableCell>{student.surname}</TableCell>
              <TableCell>{student.firstName}</TableCell>
              <TableCell>{student.lastName}</TableCell>
              <TableCell>{student.studentId}</TableCell>
              <TableCell>{student.email}</TableCell>
              <TableCell>{student.course}</TableCell>
              <TableCell>{student.year}</TableCell>
              <TableCell>{student.section}</TableCell>
              <TableCell>
                <Button variant="outline" className="mr-2">View</Button>
                <Button variant="outline" className="mr-2">Edit</Button>
                <Button variant="destructive" onClick={() => handleDelete(student.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

