"use client";

import React from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function AnalyticsTab({ employeeData }) {
  const getAnalytics = () => {
    const ageGroups = { "18-25": 0, "26-35": 0, "36-45": 0, "46+": 0 };
    const genderDistribution = {};

    employeeData.forEach((employee) => {
      const age = parseInt(employee.age);
      if (!isNaN(age)) {
        if (age <= 25) ageGroups["18-25"]++;
        else if (age <= 35) ageGroups["26-35"]++;
        else if (age <= 45) ageGroups["36-45"]++;
        else ageGroups["46+"]++;
      }

      if (employee.gender) {
        genderDistribution[employee.gender] =
          (genderDistribution[employee.gender] || 0) + 1;
      }
    });

    return { ageGroups, genderDistribution };
  };

  const analytics = getAnalytics();

  const ageChartData = Object.entries(analytics.ageGroups).map(
    ([range, count]) => ({
      range,
      count,
    })
  );

  const genderChartData = Object.entries(analytics.genderDistribution).map(
    ([gender, count]) => ({
      gender,
      count,
    })
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Count",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageChartData}>
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Bar dataKey="count" fill="var(--color-count)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Count",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={genderChartData}>
                    <XAxis dataKey="gender" />
                    <YAxis />
                    <Bar dataKey="count" fill="var(--color-count)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
