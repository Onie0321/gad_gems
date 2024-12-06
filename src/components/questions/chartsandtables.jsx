'use client'

import { useState, useEffect } from 'react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listQuestions, listResponses } from '@/lib/appwrite'
import { useToast } from 'react-toastify'

export default function ChartsAndTables() {
  const [chartData, setChartData] = useState([])
  const [tableData, setTableData] = useState([])
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const responsesResponse = await listResponses()
      const questionsResponse = await listQuestions()

      const responses = responsesResponse.documents
      const questions = questionsResponse.documents

      // Process data for chart
      const chartData = questions.map(question => {
        const answerCounts = {}
        responses.forEach(response => {
          const answer = response.responses[question.$id]
          if (answer) {
            answerCounts[answer] = (answerCounts[answer] || 0) + 1
          }
        })
        return {
          question: question.text,
          ...answerCounts
        }
      })

      // Process data for table
      const tableData = responses.map(response => ({
        userId: response.userId,
        timestamp: new Date(response.timestamp).toLocaleString(),
        ...response.responses
      }))

      setChartData(chartData)
      setTableData(tableData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch data. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Charts and Tables</h2>
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Response Distribution</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="question" />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(chartData[0] || {}).filter(key => key !== 'question').map((key, index) => (
              <Bar key={key} dataKey={key} fill={`hsl(${index * 30}, 70%, 50%)`} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">User Responses</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Timestamp</TableHead>
              {chartData.map(item => (
                <TableHead key={item.question}>{item.question}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.userId}</TableCell>
                <TableCell>{row.timestamp}</TableCell>
                {chartData.map(item => (
                  <TableCell key={item.question}>{row[item.question]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

