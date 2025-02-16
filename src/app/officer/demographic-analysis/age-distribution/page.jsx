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
import { UserIcon as Male, UserIcon as Female } from "lucide-react";
import DataTable from "../data-table/page";
import { CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
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

export default function AgeDistribution({ data }) {
  const [showMaximized, setShowMaximized] = useState(false);

  console.log("Age Distribution Data:", data);
  console.log("Age Distribution Data Length:", data?.length);
  console.log("Age Distribution Values:", data?.map(item => ({ 
    age: item.name, 
    male: item.male, 
    female: item.female 
  })));

  if (!data || data.length === 0 || data.every(item => item.male === 0 && item.female === 0)) {
    console.log("No Age Distribution Data Available - Showing Empty State");
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Age Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <p>No data available for the selected age distribution filters</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ChartContent = ({ height = 300 }) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          content={({ active, payload, label }) => {
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
          }}
        />
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
        <Bar dataKey="male" fill={COLORS.male} />
        <Bar dataKey="female" fill={COLORS.female} />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Age Distribution</CardTitle>
            <CardDescription>Distribution of participants by age</CardDescription>
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
            <DialogTitle>Age Distribution</DialogTitle>
            <CardDescription>Distribution of participants by age</CardDescription>
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
