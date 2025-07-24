import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, UserPlus } from "lucide-react";

const Dashboard = ({
  users,
  events,
  participants,
  participantTotals,
  onNavigate,
}) => {
  console.log("[Dashboard] Rendering with props:", {
    users: users?.length,
    events: events?.length,
    participants: participants?.length,
    participantTotals,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => onNavigate("users")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => onNavigate("events")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events?.length || 0}</div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => onNavigate("participants")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Participants
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {participantTotals?.students +
                participantTotals?.staffFaculty +
                participantTotals?.community || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {participantTotals?.students || 0} Students •{" "}
              {participantTotals?.staffFaculty || 0} Staff/Faculty •{" "}
              {participantTotals?.community || 0} Community
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events?.length > 0 ? (
              <div className="space-y-4">
                {events.slice(0, 5).map((event) => (
                  <div
                    key={event.$id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.date}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {event.participants?.length || 0} participants
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No events found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            {users?.length > 0 ? (
              <div className="space-y-4">
                {users.slice(0, 5).map((user) => (
                  <div
                    key={user.$id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.role}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No users found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
