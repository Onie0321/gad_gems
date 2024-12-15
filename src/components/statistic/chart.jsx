"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell  } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function StatisticChart({ data, type = 'bar' }) {
  const chartData = data.map(item => ({
    name: item.category,
    Male: item.male || item.value,
    Female: item.female,
  }))

  const pieData = data.map(item => ({
    name: item.category,
    value: item.male || item.female || item.value || 0,
  }))
  
  const COLORS = ['hsl(210, 100%, 50%)', 'hsl(350, 100%, 70%)']


  return (
    <ChartContainer
      config={{
        Male: {
          label: "Male",
          color: "hsl(210, 100%, 50%)", // Blue
        },
        Female: {
          label: "Female",
          color: "hsl(350, 100%, 70%)", // Pink
        },
      }}
      className="h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height={300}>
        {type === 'bar' ? (
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="Male" fill="var(--color-Male)" />
            <Bar dataKey="Female" fill="var(--color-Female)" />
          </BarChart>
        ) : (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </ChartContainer>
  )
}

