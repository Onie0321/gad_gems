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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { UserIcon as Male, UserIcon as Female, Maximize2 } from "lucide-react";
import DataTable from "../data-table/page";
import { CartesianGrid } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const COLORS = {
  male: "#2196F3",
  female: "#E91E63",
};

const formatName = (name, existingNames) => {
  const words = name.split(" ").filter((word) => word.toLowerCase() !== "and"); // Remove 'and'
  let acronym = words.map((word) => word.charAt(0).toUpperCase()).join(""); // Create acronym

  let uniqueAcronym = acronym;
  let counter = 1;
  while (existingNames.has(uniqueAcronym)) {
    uniqueAcronym = `${acronym}${counter}`;
    counter++;
  }

  existingNames.add(uniqueAcronym);
  return uniqueAcronym;
};

const ChartContent = ({ data, height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} layout="vertical">
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" />
      <YAxis dataKey="name" type="category" width={150} />
      <Tooltip content={({ active, payload, label }) => {
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
      }} />
      <Legend
        iconType="circle"
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
      <Bar dataKey="male" name="Male" fill={COLORS.male} />
      <Bar dataKey="female" name="Female" fill={COLORS.female} />
    </BarChart>
  </ResponsiveContainer>
);

export default function SchoolDistribution({ data }) {
  const [showMaximized, setShowMaximized] = useState(false);

  if (!data || data.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>School Distribution</CardTitle>
            <CardDescription>
              Distribution of participants by school
            </CardDescription>
          </div>
          <button
            onClick={() => setShowMaximized(true)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px] text-muted-foreground">
          No data available for the selected school filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>School Distribution</CardTitle>
            <CardDescription>
              Distribution of participants by school
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
          <ChartContent data={data} />
          <DataTable data={data} />
        </CardContent>
      </Card>

      <Dialog open={showMaximized} onOpenChange={setShowMaximized}>
        <DialogContent className="max-w-[80vw] w-[800px] my-6">
          <DialogHeader className="mb-4">
            <DialogTitle>School Distribution</DialogTitle>
            <CardDescription>
              Distribution of participants by school
            </CardDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="h-[350px]">
              <ChartContent data={data} height={350} />
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
