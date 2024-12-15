'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { fetchReportData, calculateKPIs } from '@/lib/appwrite'
import { Download } from 'lucide-react'

export const Reports = () => {
  const [reportData, setReportData] = useState(null)
  const [kpis, setKpis] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchReportData()
        setReportData(data)
        const calculatedKPIs = calculateKPIs(data)
        setKpis(calculatedKPIs)
      } catch (error) {
        console.error("Error fetching report data:", error)
      }
    }

    fetchData()
  }, [])

  const handleExport = async (format) => {
    // Implementation for export functionality
    console.log(`Exporting data in ${format} format`)
    // You would implement the actual export logic here
  }

  if (!reportData || !kpis) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Event Reports</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Male Participation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.maleParticipation.toFixed(2)}%</div>
            <Progress value={kpis.maleParticipation} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Female Participation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.femaleParticipation.toFixed(2)}%</div>
            <Progress value={kpis.femaleParticipation} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Event Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.eventGrowthRate.toFixed(2)}%</div>
            <Progress value={kpis.eventGrowthRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="flex space-x-4">
        <Button onClick={() => handleExport('csv')}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
        <Button onClick={() => handleExport('pdf')}>
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>
    </div>
  )
}

