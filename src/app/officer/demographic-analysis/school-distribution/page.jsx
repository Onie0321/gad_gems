import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { UserIcon as Male, UserIcon as Female } from 'lucide-react'; 
import DataTable from "../data-table/page";
import { CartesianGrid } from "recharts";

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

export default function SchoolDistribution({ data, colors }) {
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
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="male" name="Male" fill={colors[0]} />
            <Bar dataKey="female" name="Female" fill={colors[1]} />
            <Bar dataKey="intersex" name="Intersex" fill={colors[2]} />
          </BarChart>
        </ResponsiveContainer>
        <DataTable data={data} />
      </CardContent>
    </Card>
  );
}
