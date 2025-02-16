"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, TrendingUp, TrendingDown, Users } from "lucide-react";

export const ActionableInsights = ({ data }) => {
  if (!data) return <div>Loading...</div>;

  const calculateInsights = () => {
    const {
      eventParticipation,
      ageDistribution,
      ethnicDistribution
    } = data;

    // Calculate total participation trends
    const totalParticipants = eventParticipation.reduce((sum, event) => sum + event.total, 0);
    const averageParticipantsPerEvent = totalParticipants / eventParticipation.length;

    // Calculate gender ratio trends
    const totalMale = eventParticipation.reduce((sum, event) => sum + event.male, 0);
    const totalFemale = eventParticipation.reduce((sum, event) => sum + event.female, 0);
    const genderRatio = totalFemale / (totalMale + totalFemale);

    // Calculate age distribution insights
    const dominantAgeGroup = ageDistribution.reduce((prev, current) => 
      (current.male + current.female) > (prev.male + prev.female) ? current : prev
    );

    // Calculate ethnic diversity insights
    const ethnicDiversity = ethnicDistribution.length;
    const ethnicParticipation = ethnicDistribution.map(group => ({
      name: group.name,
      total: group.male + group.female
    }));

    return {
      totalParticipants,
      averageParticipantsPerEvent,
      genderRatio,
      dominantAgeGroup,
      ethnicDiversity,
      ethnicParticipation
    };
  };

  const insights = calculateInsights();

  const generateRecommendations = (insights) => {
    const recommendations = [];

    // Participation recommendations
    if (insights.averageParticipantsPerEvent < 50) {
      recommendations.push({
        title: "Increase Event Participation",
        description: "Consider implementing broader outreach strategies and promotional campaigns.",
        icon: <TrendingUp className="h-4 w-4" />
      });
    }

    // Gender balance recommendations
    if (insights.genderRatio < 0.4 || insights.genderRatio > 0.6) {
      recommendations.push({
        title: "Address Gender Balance",
        description: "Develop targeted programs to encourage participation from underrepresented gender groups.",
        icon: <Users className="h-4 w-4" />
      });
    }

    // Age distribution recommendations
    recommendations.push({
      title: "Age Group Focus",
      description: `Consider developing programs specifically for age groups outside the dominant ${insights.dominantAgeGroup.name} category.`,
      icon: <Info className="h-4 w-4" />
    });

    // Ethnic diversity recommendations
    if (insights.ethnicDiversity < 5) {
      recommendations.push({
        title: "Enhance Ethnic Diversity",
        description: "Implement initiatives to reach and engage diverse ethnic communities.",
        icon: <TrendingUp className="h-4 w-4" />
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations(insights);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Participation Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Total Participants</p>
              <p className="text-2xl font-bold">{insights.totalParticipants}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Average per Event</p>
              <p className="text-2xl font-bold">
                {insights.averageParticipantsPerEvent.toFixed(1)}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600">Gender Ratio (F:M)</p>
              <p className="text-2xl font-bold">
                {(insights.genderRatio / (1 - insights.genderRatio)).toFixed(2)}:1
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-600">Ethnic Groups</p>
              <p className="text-2xl font-bold">{insights.ethnicDiversity}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.map((recommendation, index) => (
            <Alert key={index}>
              <div className="flex items-center gap-2">
                {recommendation.icon}
                <AlertTitle>{recommendation.title}</AlertTitle>
              </div>
              <AlertDescription>{recommendation.description}</AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {insights.averageParticipantsPerEvent > 0 && (
              <Alert>
                <AlertTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Participation Trend
                </AlertTitle>
                <AlertDescription>
                  Average participation is {insights.averageParticipantsPerEvent.toFixed(1)} participants per event.
                  {insights.averageParticipantsPerEvent < 50 
                    ? " Consider strategies to increase participation."
                    : " Maintaining strong participation levels."}
                </AlertDescription>
              </Alert>
            )}

            {insights.dominantAgeGroup && (
              <Alert>
                <AlertTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Age Distribution
                </AlertTitle>
                <AlertDescription>
                  The {insights.dominantAgeGroup.name} age group shows the highest participation.
                  Consider developing programs for other age groups to ensure balanced representation.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

