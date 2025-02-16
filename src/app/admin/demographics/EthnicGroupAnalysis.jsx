'use client';

import { useState, useEffect } from 'react';
import { Card, Title, BarChart, Text } from '@tremor/react';

export default function EthnicGroupAnalysis() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/demographics/ethnic-groups');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl">
      <Title>Ethnic Group Analysis</Title>
      <Text>Distribution of members across different ethnic groups</Text>
      
      <Card className="mt-6">
        <BarChart
          data={data}
          index="group"
          categories={["count"]}
          colors={["blue"]}
          yAxisWidth={48}
        />
      </Card>
    </main>
  );
}
