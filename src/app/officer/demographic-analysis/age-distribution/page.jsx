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

const COLORS = {
  male: "#4299E1",
  female: "#ED64A6",
};

export default function AgeDistribution({ data, colors }) {
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

  // Adjust font size based on label length
  const getLabelStyle = (label) => {
    if (label.length <= 5) {
      return { fontSize: "14px" }; // Larger font size for shorter labels
    } else if (label.length <= 10) {
      return { fontSize: "12px" }; // Medium font size for medium-length labels
    } else {
      return {
        fontSize: "10px",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }; // Smaller font size + ellipsis for long labels
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Age Distribution</CardTitle>
        <CardDescription>
          Distribution of participants by age range
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
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
