'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { UserIcon as Male, UserIcon as Female } from "lucide-react";
import DataTable from "../data-table/page";
import { Maximize2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
  
const COLORS = {
  male: "#2196F3",    // Update from #4299E1
  female: "#E91E63",  // Update from #ED64A6
};

export default function SectionDistribution({ data, colors }) {
  const [showMaximized, setShowMaximized] = useState(false);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const male = payload.find((p) => p.dataKey === "male")?.value || 0;
      const female = payload.find((p) => p.dataKey === "female")?.value || 0;
      const total = male + female;
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-bold">{label}</p>
          <p>Male: {male}</p>
          <p>Female: {female}</p>
          <p className="font-bold">Total: {total}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = (props) => {
    const { x, y, width, height, value, dataKey } = props;
    const radius = 10; // Radius of the circle
    const color = dataKey === "male" ? COLORS.male : COLORS.female; // Determine color based on dataKey

    return (
      <g>
        <circle cx={x + width / 2} cy={y - radius} r={radius} fill={color} />
        <text
          x={x + width / 2}
          y={y - radius}
          fill="#fff"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {value}
        </text>
      </g>
    );
  };
  
  if (!data || data.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Section Distribution</CardTitle>
            <CardDescription>Distribution of participants by section</CardDescription>
          </div>
          <button
            onClick={() => setShowMaximized(true)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px] text-muted-foreground">
          No data available for the selected section filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Section Distribution</CardTitle>
            <CardDescription>
              Distribution of participants by section
            </CardDescription>
          </div>
          <button
            onClick={() => setShowMaximized(true)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 50,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={10}
                formatter={(value, entry) => (
                  <span className="flex items-center">
                    {value === "male" ? (
                      <Male size={16} className="mr-2" />
                    ) : (
                      <Female size={16} className="mr-2" />
                    )}
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </span>
                )}
              />
              <Bar dataKey="male" fill={COLORS.male} minPointSize={5}>
                <LabelList dataKey="male" content={renderCustomizedLabel} />
              </Bar>
              <Bar dataKey="female" fill={COLORS.female} minPointSize={10}>
                <LabelList dataKey="female" content={renderCustomizedLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <DataTable data={data} />
        </CardContent>
      </Card>

      <Dialog open={showMaximized} onOpenChange={setShowMaximized}>
        <DialogContent className="max-w-[80vw] w-[800px] my-6">
          <DialogHeader className="mb-4">
            <DialogTitle>Section Distribution</DialogTitle>
            <CardDescription>
              Distribution of participants by section
            </CardDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={data}
                  margin={{
                    top: 5,
                    right: 50,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    formatter={(value, entry) => (
                      <span className="flex items-center">
                        {value === "male" ? (
                          <Male size={16} className="mr-2" />
                        ) : (
                          <Female size={16} className="mr-2" />
                        )}
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </span>
                    )}
                  />
                  <Bar dataKey="male" fill={COLORS.male} minPointSize={5}>
                    <LabelList dataKey="male" content={renderCustomizedLabel} />
                  </Bar>
                  <Bar dataKey="female" fill={COLORS.female} minPointSize={10}>
                    <LabelList dataKey="female" content={renderCustomizedLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="max-h-[250px] overflow-auto">
              <DataTable data={data} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
