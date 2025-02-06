'use client';

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
  PieChart,
  Pie,
  Sector,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { UserIcon as Male, UserIcon as Female, Maximize2 } from "lucide-react";
import DataTable from "../data-table/page";
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

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
      >{`Count: ${value}`}</text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
      >
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

const ChartContent = ({ data, activeIndex, onPieEnter, height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <PieChart>
      <Pie
        activeIndex={activeIndex}
        activeShape={renderActiveShape}
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={height * 0.2}
        outerRadius={height * 0.3}
        fill="#8884d8"
        dataKey="value"
        onMouseEnter={onPieEnter}
      >
        {data.map((entry, index) => (
          <Cell
            key={`cell-${index}`}
            fill={entry.name === "Male" ? COLORS.male : COLORS.female}
          />
        ))}
      </Pie>
      <Tooltip />
      <Legend
        verticalAlign="bottom"
        height={36}
        iconType="circle"
        iconSize={10}
        formatter={(value, entry) => (
          <span className="flex items-center">
            {value === "Male" ? (
              <Male size={16} className="mr-2" />
            ) : (
              <Female size={16} className="mr-2" />
            )}
            {value}
          </span>
        )}
      />
    </PieChart>
  </ResponsiveContainer>
);

export default function SexBreakdown({ data }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showMaximized, setShowMaximized] = useState(false);

  console.log("Sex Breakdown Data:", data);
  console.log("Sex Breakdown Data Length:", data?.length);
  console.log("Sex Breakdown Values:", {
    male: data?.find(d => d.name === "Male")?.value || 0,
    female: data?.find(d => d.name === "Female")?.value || 0
  });
  console.log("All Zero Check:", data?.[0]?.value === 0 && data?.[1]?.value === 0);

  if (!data || data.length === 0 || (data[0].value === 0 && data[1].value === 0)) {
    console.log("No Sex Breakdown Data Available - Showing Empty State");
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sex Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <p>No data available for the selected sex breakdown filters</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  // Calculating counts for the table
  const maleCount = data.find((entry) => entry.name === "Male")?.value || 0;
  const femaleCount = data.find((entry) => entry.name === "Female")?.value || 0;
  const total = maleCount + femaleCount;

  const tableData = [
    { name: "Male", male: maleCount, female: 0, total: maleCount },
    { name: "Female", male: 0, female: femaleCount, total: femaleCount },
    { name: "Total", male: maleCount, female: femaleCount, total: total },
  ];

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sex Breakdown</CardTitle>
            <CardDescription>Distribution of participants by Sex</CardDescription>
          </div>
          <button
            onClick={() => setShowMaximized(true)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <ChartContent
            data={data}
            activeIndex={activeIndex}
            onPieEnter={onPieEnter}
          />
          <DataTable data={tableData} />
        </CardContent>
      </Card>

      <Dialog open={showMaximized} onOpenChange={setShowMaximized}>
        <DialogContent className="max-w-[80vw] w-[800px] my-6">
          <DialogHeader className="mb-4">
            <DialogTitle>Sex Distribution</DialogTitle>
            <CardDescription>Distribution of participants by Sex</CardDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="h-[350px]">
              <ChartContent 
                data={data}
                activeIndex={activeIndex}
                onPieEnter={onPieEnter}
                height={350}
              />
            </div>
            <div className="max-h-[250px] overflow-auto">
              <DataTable data={tableData} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
