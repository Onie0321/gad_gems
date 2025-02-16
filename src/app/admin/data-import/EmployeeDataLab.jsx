"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function EmployeeDataTab({ employeeData, dataImported }) {
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [displayData, setDisplayData] = useState(employeeData)

  useEffect(() => {
    if (dataImported) {
      setDisplayData([])
    } else {
      setDisplayData(employeeData)
    }
  }, [dataImported, employeeData])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Data</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Gender (Non-Heterosexual)</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((employee) => (
                <TableRow key={employee.$id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.age}</TableCell>
                  <TableCell>{employee.gender}</TableCell>
                  <TableCell>{employee["genderIfNon-Heterosexual"]}</TableCell>
                  <TableCell>{employee.timeStamp}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setSelectedEmployee(employee)}>
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{employee.name} Details</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          <h3 className="text-lg font-semibold">Personal Information</h3>
                          <Table>
                            <TableBody>
                              {Object.entries(employee).map(([key, value]) => {
                                if (key !== "$id" && key !== "surveyData") {
                                  return (
                                    <TableRow key={key}>
                                      <TableCell className="font-medium">{key}</TableCell>
                                      <TableCell>{value}</TableCell>
                                    </TableRow>
                                  )
                                }
                              })}
                            </TableBody>
                          </Table>
                          <h3 className="text-lg font-semibold">Survey Responses</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Question</TableHead>
                                <TableHead>Answer</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {employee.surveyData && employee.surveyData.questionsAnswers ? (
                                (() => {
                                  try {
                                    const parsedQA = JSON.parse(employee.surveyData.questionsAnswers)
                                    return Array.isArray(parsedQA) ? (
                                      parsedQA.map((qa, index) => (
                                        <TableRow key={index}>
                                          <TableCell>{qa.question}</TableCell>
                                          <TableCell>{qa.answer}</TableCell>
                                        </TableRow>
                                      ))
                                    ) : (
                                      <TableRow>
                                        <TableCell colSpan={2}>Invalid survey data format</TableCell>
                                      </TableRow>
                                    )
                                  } catch (error) {
                                    console.error("Error parsing survey data:", error)
                                    return (
                                      <TableRow>
                                        <TableCell colSpan={2}>Error parsing survey data</TableCell>
                                      </TableRow>
                                    )
                                  }
                                })()
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={2}>No survey data available</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

