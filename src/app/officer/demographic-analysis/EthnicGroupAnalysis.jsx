"use client";

import { useState } from "react";
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
import { UserIcon as Male } from "lucide-react";
import { UserIcon as Female } from "lucide-react";
import { Maximize2 } from "lucide-react";
import DataTable from "./DataTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import React from "react";
import { processEthnicityData } from "@/utils/participantUtils";

const COLORS = {
  male: "#2196F3",
  female: "#E91E63",
};

export default function EthnicGroupAnalysis({ data }) {
  const [showMaximized, setShowMaximized] = useState(false);

  // Process data using the improved ethnicity processing function
  const processedData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    // If data is already processed (has name, male, female properties), use it directly
    if (
      data.length > 0 &&
      data[0].hasOwnProperty("male") &&
      data[0].hasOwnProperty("female")
    ) {
      return data;
    }

    // If data is raw participant data, process it
    return processEthnicityData(data);
  }, [data]);

  console.log("Ethnic Group Analysis Data:", processedData);
  console.log("Ethnic Group Analysis Data Length:", processedData?.length);

  if (
    !processedData ||
    processedData.length === 0 ||
    processedData.every(
      (item) =>
        (item.male === 0 || !item.male) && (item.female === 0 || !item.female)
    )
  ) {
    console.log("Triggering empty state because:", {
      noData: !processedData,
      emptyLength: processedData?.length === 0,
      allZeros: processedData?.every(
        (item) =>
          (item.male === 0 || !item.male) && (item.female === 0 || !item.female)
      ),
    });
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Ethnic Group Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <p>No data available for the selected ethnic group filters</p>
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
      <BarChart data={processedData}>
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
            <CardTitle>Ethnic Group Analysis</CardTitle>
            <CardDescription>
              Distribution of participants by ethnic group (filtered and
              grouped)
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
          <DataTable data={processedData} />
        </CardContent>
      </Card>

      <Dialog open={showMaximized} onOpenChange={setShowMaximized}>
        <DialogContent className="max-w-[80vw] w-[800px] my-6">
          <DialogHeader className="mb-4">
            <DialogTitle>Ethnic Group Analysis</DialogTitle>
            <DialogDescription>
              Distribution of participants by ethnic group (filtered and
              grouped)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="h-[350px]">
              <ChartContent height={350} />
            </div>
            <div className="max-h-[250px] overflow-auto">
              <DataTable data={processedData} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
