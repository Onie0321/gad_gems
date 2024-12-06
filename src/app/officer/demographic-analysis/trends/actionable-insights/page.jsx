import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const ActionableInsights= ({ data }) => {
  if (!data) return <div>Loading...</div>;

  // Calculate some basic insights
  const totalParticipants = data.eventParticipation.reduce((sum, event) => sum + event.total, 0);
  const averageParticipantsPerEvent = totalParticipants / data.eventParticipation.length;
  const genderRatio = data.eventParticipation.reduce(
    (sum, event) => sum + (event.female / event.total),
    0
  ) / data.eventParticipation.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Participation Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Total Participants: {totalParticipants}</p>
          <p>Average Participants per Event: {averageParticipantsPerEvent.toFixed(2)}</p>
          <p>Gender Ratio (Female:Male): {(genderRatio / (1 - genderRatio)).toFixed(2)}:1</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5">
            <li>Consider organizing more events to increase overall participation.</li>
            <li>Implement targeted outreach to balance gender participation.</li>
            <li>Develop programs to engage underrepresented age groups and ethnicities.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

