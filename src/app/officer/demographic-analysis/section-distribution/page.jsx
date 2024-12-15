import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, CartesianGrid, LabelList, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { UserIcon as Male, UserIcon as Female } from 'lucide-react';
import DataTable from "../data-table/page";

const COLORS = {
  male: "#4299E1", // Blue for Male
  female: "#ED64A6", // Pink for Female
};

export default function SectionDistribution({ data }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const male = payload.find(p => p.dataKey === "male")?.value || 0;
      const female = payload.find(p => p.dataKey === "female")?.value || 0;
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
        <text x={x + width / 2} y={y - radius} fill="#fff" textAnchor="middle" dominantBaseline="middle">
          {value}
        </text>
      </g>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Section Distribution</CardTitle>
        <CardDescription>Distribution of participants by section</CardDescription>
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
                  {value === "male" ? <Male size={16} className="mr-2" /> : <Female size={16} className="mr-2" />}
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
  );
}
