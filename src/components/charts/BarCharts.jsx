import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const BarChartComponent = ({ data, xDataKey, yDataKeys, colors }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xDataKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {yDataKeys.map((key, index) => (
          <Bar key={key} dataKey={key} fill={colors[index]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

