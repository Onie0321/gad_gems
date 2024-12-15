import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


export const LineChartComponent= ({ data, xDataKey, yDataKeys, colors }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xDataKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {yDataKeys.map((key, index) => (
          <Line key={key} type="monotone" dataKey={key} stroke={colors[index]} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

