import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { UserIcon as Male, UserIcon as Female } from 'lucide-react';
import DataTable from "../data-table/page";

const COLORS = {
  male: "#4299E1",
  female: "#ED64A6",
};

export default function EducationLevel({ data, colors }) {
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
  
    // Adjust font size based on label length, and avoid rotation
    const getLabelStyle = (label) => {
      if (label.length <= 5) {
        return { fontSize: '14px' }; // Larger font size for shorter labels
      } else if (label.length <= 10) {
        return { fontSize: '12px' }; // Medium font size for medium-length labels
      } else {
        return { fontSize: '10px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }; // Smaller font size + ellipsis for long labels
      }
    };
  
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Educational Level</CardTitle>
          <CardDescription>Distribution of participants' educational levels</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                tickFormatter={(value) => value}
                interval={0}  // Ensure all ticks are displayed
                tick={({ x, y, payload }) => {
                  const labelStyle = getLabelStyle(payload.value); // Apply dynamic font size
                  return (
                    <text
                      x={x}
                      y={y + 15}  // Adjust y positioning if needed
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={labelStyle}
                    >
                      {payload.value}
                    </text>
                  );
                }}
              />
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
              <Bar dataKey="male" stackId="a" fill={COLORS.male} />
              <Bar dataKey="female" stackId="a" fill={COLORS.female} />
              <Bar dataKey="intersex" name="Intersex" fill={colors[2]} />
            </BarChart>
          </ResponsiveContainer>
          <DataTable data={data} />
        </CardContent>
      </Card>
    );
  }
  