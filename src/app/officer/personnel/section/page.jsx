"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatisticChart } from '@/components/statistic/chart'
import { StatisticTable } from '@/components/statistic/table'
import { StatisticModal } from '@/components/statistic/modal'
import { Maximize2 } from 'lucide-react'

export function StatisticSection({ title, data }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const isPieChart = title === "Number of Employees by Sex"


  return (
    <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle>{title}</CardTitle>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsModalOpen(true)}
        className="h-8 w-8 p-0"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </CardHeader>
    <CardContent>
      {title === "Number of Employees by Sex" ? (
        <StatisticChart data={data} type="pie" />
      ) : (
        <StatisticChart data={data} />
      )}
      <StatisticTable data={data} />
    </CardContent>
    <StatisticModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title={title}
      data={data}
    />
  </Card>
  )
}