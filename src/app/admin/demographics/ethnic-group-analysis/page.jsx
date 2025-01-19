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
import DataTable from "../../../officer/demographic-analysis/data-table/page";

const COLORS = {
  male: "#4299E1",
  female: "#ED64A6",
};

export default function EthnicGroupAnalysis({ data }) {
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

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Ethnic Group Analysis</CardTitle>
        <CardDescription>
          Distribution of participants' ethnic groups
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fontSize: 12 }} // Reduce font size of labels if needed
              interval={0} // Ensure all labels are displayed
              tickFormatter={(tick) => tick} // Optional if you need to format label
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={10}
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
        <DataTable data={data} />
      </CardContent>
    </Card>
  );
}
