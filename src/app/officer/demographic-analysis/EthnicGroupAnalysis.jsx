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

const COLORS = {
  male: "#2196F3",
  female: "#E91E63",
};

export default function EthnicGroupAnalysis({ data }) {
  const [showMaximized, setShowMaximized] = useState(false);

  // Process data to include otherEthnicGroup entries
  const processedData = React.useMemo(() => {
    if (!data) return [];

    // First, get all regular ethnic groups
    const regularGroups = data
      .filter((item) => item.name !== "Other")
      .map((item) => ({
        ...item,
        id: `regular-${item.name}`, // Add unique id
      }));

    // Then, get all "Other" entries and their specific ethnic groups
    const otherEntries = data.find((item) => item.name === "Other");

    if (otherEntries?.otherGroups) {
      // Add each other ethnic group as a separate entry
      const otherGroups = Object.entries(otherEntries.otherEthnicGroup).map(
        ([name, counts], index) => ({
          id: `other-${name}`, // Add unique id
          name,
          male: counts.male || 0,
          female: counts.female || 0,
          value: (counts.male || 0) + (counts.female || 0),
        })
      );

      return [...regularGroups, ...otherGroups];
    }

    return regularGroups;
  }, [data]);

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

  const ChartContent = ({ data, height = 300 }) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={150} />
        <Tooltip content={CustomTooltip} />
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

  const MaximizeButton = () => (
    <button
      type="button"
      onClick={() => setShowMaximized(true)}
      className="p-2 hover:bg-gray-100 rounded-full inline-flex items-center justify-center bg-white"
    >
      <Maximize2 className="h-5 w-5 text-gray-600" />
    </button>
  );

  if (!processedData || processedData.length === 0) {
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

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Ethnic Group Analysis</CardTitle>
            <CardDescription>
              Distribution of participants by ethnic group
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
              data={processedData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tickFormatter={(value, index) => value}
                key="yAxis"
              />
              <Tooltip content={CustomTooltip} />
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
              <Bar
                dataKey="male"
                name="Male"
                fill={COLORS.male}
                key="male-bar"
              />
              <Bar
                dataKey="female"
                name="Female"
                fill={COLORS.female}
                key="female-bar"
              />
            </BarChart>
          </ResponsiveContainer>
          <DataTable data={processedData} />
        </CardContent>
      </Card>

      <Dialog open={showMaximized} onOpenChange={setShowMaximized}>
        <DialogContent className="max-w-[80vw] w-[800px] my-6">
          <DialogHeader className="mb-4">
            <DialogTitle>Ethnic Group Analysis</DialogTitle>
            <CardDescription>
              Distribution of participants by ethnic group
            </CardDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={processedData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={150}
                    tickFormatter={(value, index) => value}
                    key="yAxis-max"
                  />
                  <Tooltip content={CustomTooltip} />
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
                  <Bar
                    dataKey="male"
                    name="Male"
                    fill={COLORS.male}
                    key="male-bar-max"
                  />
                  <Bar
                    dataKey="female"
                    name="Female"
                    fill={COLORS.female}
                    key="female-bar-max"
                  />
                </BarChart>
              </ResponsiveContainer>
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
