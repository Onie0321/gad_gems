export default function EthnicGroupAnalysis({ data, colors }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ethnic Group Distribution</CardTitle>
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
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 