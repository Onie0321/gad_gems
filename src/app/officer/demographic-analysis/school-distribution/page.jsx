import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { UserIcon as Male, UserIcon as Female } from 'lucide-react'; 
import DataTable from "../data-table/page";

const COLORS = {
  male: "#4299E1",
  female: "#ED64A6",
};

const formatName = (name, existingNames) => {
  const words = name.split(' ').filter(word => word.toLowerCase() !== 'and');  // Remove 'and'
  let acronym = words.map(word => word.charAt(0).toUpperCase()).join('');  // Create acronym

  let uniqueAcronym = acronym;
  let counter = 1;
  while (existingNames.has(uniqueAcronym)) {
    uniqueAcronym = `${acronym}${counter}`;
    counter++;
  }

  existingNames.add(uniqueAcronym);
  return uniqueAcronym;
};

export default function SchoolDistribution({ data }) {
  const existingNames = new Set(); 

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

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>School Distribution</CardTitle>
        <CardDescription>Distribution of participants by school</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" />
            <YAxis
              dataKey="name"
              type="category"
              width={120}
              interval={0} 
              tick={({ x, y, payload }) => {
                // Format the name using the formatName function and pass the existing acronyms set
                const formattedName = formatName(payload.value, existingNames);
                return (
                  <text
                    x={x - 10}  // Adjust x positioning if needed
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    style={{ fontSize: '12px' }} // Adjust font size as needed
                  >
                    {formattedName}
                  </text>
                );
              }}
            />
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
          </BarChart>
        </ResponsiveContainer>
        <DataTable data={data} />
      </CardContent>
    </Card>
  );
}
