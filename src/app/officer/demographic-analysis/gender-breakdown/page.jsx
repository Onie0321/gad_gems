import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Sector, Tooltip, Legend, Cell } from "recharts";
import { UserIcon as Male, UserIcon as Female } from 'lucide-react';
import DataTable from "../data-table/page";

const COLORS = {
  male: "#4299E1",
  female: "#ED64A6",
};

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

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
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`Value: ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

export default function GenderBreakdown({ data, colors }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  // Calculating male and female counts for the table
  const maleCount = data.find(entry => entry.name === 'Male')?.value || 0;
  const femaleCount = data.find(entry => entry.name === 'Female')?.value || 0;
  const total = maleCount + femaleCount;

  const tableData = [
    { name: 'Male', male: maleCount, female: 0, total: maleCount },
    { name: 'Female', male: 0, female: femaleCount, total: femaleCount },
    { name: 'Total', male: maleCount, female: femaleCount, total: total }
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Gender Breakdown</CardTitle>
        <CardDescription>Distribution of male and female participants</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              iconType="circle"
              iconSize={10}
              formatter={(value, entry) => (
                <span className="flex items-center">
                  {value === "Male" ? <Male size={16} className="mr-2" /> : <Female size={16} className="mr-2" />}
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <DataTable data={tableData} />
      </CardContent>
    </Card>
  );
}
