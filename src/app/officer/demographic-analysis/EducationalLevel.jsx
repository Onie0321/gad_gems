"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { UserIcon as Male, UserIcon as Female } from "lucide-react";
import DataTable from "./DataTable";
import { Maximize2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COLORS = {
  male: "#2196F3",
  female: "#E91E63",
};

export default function EducationLevel({ data, colors }) {
  const [showMaximized, setShowMaximized] = useState(false);

  console.log("Educational Level Data:", data);
  console.log("Educational Level Data Length:", data?.length);
  console.log("Raw Data Values:", data);
  console.log(
    "Individual Values Check:",
    data?.map((item) => ({
      name: item.name,
      value: item.value,
      male: item.male,
      female: item.female,
      isZero: item.male === 0 && item.female === 0,
    }))
  );

  if (
    !data ||
    data.length === 0 ||
    data.every(
      (item) =>
        (item.male === 0 || !item.male) && (item.female === 0 || !item.female)
    )
  ) {
    console.log("Triggering empty state because:", {
      noData: !data,
      emptyLength: data?.length === 0,
      allZeros: data?.every(
        (item) =>
          (item.male === 0 || !item.male) && (item.female === 0 || !item.female)
      ),
    });
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Educational Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <p>No data available for the selected educational level filters</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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

  // Adjust font size based on label length, and avoid rotation
  const getLabelStyle = (label) => {
    if (label.length <= 5) {
      return { fontSize: "14px" }; // Larger font size for shorter labels
    } else if (label.length <= 10) {
      return { fontSize: "12px" }; // Medium font size for medium-length labels
    } else {
      return {
        fontSize: "10px",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }; // Smaller font size + ellipsis for long labels
    }
  };

  const ChartContent = ({ height = 300 }) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={({ x, y, payload }) => (
            <g transform={`translate(${x},${y})`}>
              <text
                x={0}
                y={0}
                dy={16}
                textAnchor="middle"
                fill="#666"
                {...getLabelStyle(payload.value)}
              >
                {payload.value}
              </text>
            </g>
          )}
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          formatter={(value) => (
            <span style={{ color: COLORS[value.toLowerCase()] }}>{value}</span>
          )}
        />
        <Bar
          dataKey="male"
          fill={COLORS.male}
          name="Male"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="female"
          fill={COLORS.female}
          name="Female"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Educational Level</CardTitle>
            <CardDescription>
              Distribution of participants by educational level
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
          <ChartContent />
          <DataTable data={data} />
        </CardContent>
      </Card>

      <Dialog open={showMaximized} onOpenChange={setShowMaximized}>
        <DialogContent className="max-w-[80vw] w-[800px] my-6">
          <DialogHeader className="mb-4">
            <DialogTitle>Educational Level</DialogTitle>
            <CardDescription>
              Distribution of participants' educational levels
            </CardDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="h-[350px]">
              <ChartContent height={350} />
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
