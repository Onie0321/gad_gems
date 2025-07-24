// src/app/admin/user-management/activity-logs/page.jsx
"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchActivityLogs, fetchUsers } from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";
import {
  format,
  parseISO,
  startOfDay,
  getYear,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  addHours,
  startOfHour,
  eachHourOfInterval,
  isSameHour,
} from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchColumn, setSearchColumn] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [users, setUsers] = useState({});
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear())
  );
  const [graphData, setGraphData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const rowsPerPage = 10;
  const [timePeriod, setTimePeriod] = useState("daily");
  const [selectedActivities, setSelectedActivities] = useState(["total"]);

  // Generate array of years
  const years = Array.from({ length: 5 }, (_, i) =>
    String(new Date().getFullYear() - i)
  );

  const activityTypes = [
    { key: "total", name: "Total Activities", color: "#8884d8" },
    { key: "signIns", name: "Sign Ins", color: "#82ca9d" },
    { key: "signOuts", name: "Sign Outs", color: "#ff7300" },
    { key: "newUsers", name: "New Users", color: "#FFBB28" },
    { key: "eventCreated", name: "Events Created", color: "#00C49F" },
    { key: "eventImported", name: "Events Imported", color: "#ffc658" },
    { key: "participants", name: "Participant Activities", color: "#ff8042" },
    { key: "profiles", name: "Profile Updates", color: "#ea5545" },
  ];

  // Load initial data and set up real-time subscription
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [logsResponse, usersResponse] = await Promise.all([
          fetchActivityLogs(),
          fetchUsers(),
        ]);

        // Create users map
        const userMap = {};
        usersResponse.forEach((user) => {
          userMap[user.$id] = user.name;
        });

        setLogs(logsResponse || []);
        setUsers(userMap);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load activity logs and users",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    // Set up real-time subscription
    let unsubscribe;
    try {
      // Use the pre-configured client
      unsubscribe = client.subscribe(
        `databases.${process.env.NEXT_PUBLIC_DATABASE_ID}.collections.activity_logs.documents`,
        (response) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            )
          ) {
            setLogs((prevLogs) => {
              const newLog = response.payload;
              return [newLog, ...prevLogs].sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              );
            });
          }
        }
      );
    } catch (error) {
      console.error("Error setting up real-time subscription:", error);
      toast({
        title: "Warning",
        description: "Real-time updates are not available",
        variant: "warning",
      });
    }

    loadInitialData();

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Update graph data when time period changes
  useEffect(() => {
    processGraphData();
  }, [logs, selectedUser, selectedYear, timePeriod]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchColumn, filterType, selectedUser]);

  const processGraphData = () => {
    console.log("Starting processGraphData");
    console.log("Initial logs:", logs);

    if (!logs.length) {
      console.log("No logs found");
      return;
    }

    try {
      // Get current date
      const now = new Date();
      let startDate, endDate;

      // Set date range based on time period
      switch (timePeriod) {
        case "hourly":
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case "daily":
          startDate = new Date(selectedYear, 0, 1);
          endDate = new Date(selectedYear, 11, 31);
          break;
        case "weekly":
          startDate = startOfWeek(new Date(selectedYear, 0, 1));
          endDate = endOfWeek(new Date(selectedYear, 11, 31));
          break;
        case "monthly":
          startDate = new Date(selectedYear, 0, 1);
          endDate = new Date(selectedYear, 11, 31);
          break;
        case "yearly":
          startDate = new Date(selectedYear, 0, 1);
          endDate = new Date(selectedYear, 11, 31);
          break;
      }

      console.log("Date range:", { startDate, endDate, timePeriod });

      // Filter logs by date range and user
      const filteredLogs = logs.filter((log) => {
        if (!log.timestamp) {
          console.log("Log missing timestamp:", log);
          return false;
        }

        try {
          const logDate = new Date(log.timestamp);
          if (isNaN(logDate.getTime())) {
            console.log("Invalid timestamp:", log.timestamp);
            return false;
          }

          const matchesUser =
            selectedUser === "all" || log.userId === selectedUser;
          const isInRange = logDate >= startDate && logDate <= endDate;

          console.log("Log filtering:", {
            timestamp: log.timestamp,
            logDate,
            matchesUser,
            isInRange,
            activityType: log.activityType,
          });

          return isInRange && matchesUser;
        } catch (error) {
          console.error("Error processing log date:", error);
          return false;
        }
      });

      console.log("Filtered logs:", filteredLogs);

      // Get periods based on selected time period
      let periods;
      let getStartOfPeriod;
      let isSamePeriod;
      let formatPattern;

      switch (timePeriod) {
        case "hourly":
          periods = eachHourOfInterval({ start: startDate, end: endDate });
          getStartOfPeriod = startOfHour;
          isSamePeriod = isSameHour;
          formatPattern = "HH:mm";
          break;
        case "daily":
          periods = eachDayOfInterval({ start: startDate, end: endDate });
          getStartOfPeriod = startOfDay;
          isSamePeriod = isSameDay;
          formatPattern = "MMM d";
          break;
        case "weekly":
          periods = eachWeekOfInterval({ start: startDate, end: endDate });
          getStartOfPeriod = startOfWeek;
          isSamePeriod = isSameWeek;
          formatPattern = "'Week of' MMM d";
          break;
        case "monthly":
          periods = eachMonthOfInterval({ start: startDate, end: endDate });
          getStartOfPeriod = startOfMonth;
          isSamePeriod = isSameMonth;
          formatPattern = "MMM yyyy";
          break;
        case "yearly":
          periods = eachYearOfInterval({ start: startDate, end: endDate });
          getStartOfPeriod = startOfYear;
          isSamePeriod = isSameYear;
          formatPattern = "yyyy";
          break;
      }

      console.log("Generated periods:", periods);

      // Initialize data structure for each period
      const groupedData = periods.reduce((acc, period) => {
        acc[period.toISOString()] = {
          date: period,
          total: 0,
          signIns: 0,
          signOuts: 0,
          newUsers: 0,
          eventCreated: 0,
          eventImported: 0,
          participants: 0,
          profiles: 0,
        };
        return acc;
      }, {});

      console.log("Initial grouped data:", groupedData);

      // Group logs by period
      filteredLogs.forEach((log) => {
        if (!log.timestamp) return;

        try {
          const logDate = new Date(log.timestamp);
          if (isNaN(logDate.getTime())) return;

          const periodKey = periods
            .find((period) => isSamePeriod(logDate, period))
            ?.toISOString();

          console.log("Processing log:", {
            logDate,
            periodKey,
            activityType: log.activityType,
            hasMatchingPeriod: !!periodKey && !!groupedData[periodKey],
          });

          if (periodKey && groupedData[periodKey]) {
            // Normalize the activity type by removing spaces and converting to lowercase
            const activity = (log.activityType || "")
              .toLowerCase()
              .replace(/\s+/g, "_");

            groupedData[periodKey].total++;

            console.log("Processing normalized activity:", activity); // Debug log

            // Updated activity type matching with normalized cases
            switch (activity) {
              case "user_signin":
              case "email_signin":
              case "sign_in":
                groupedData[periodKey].signIns++;
                break;
              case "user_signout":
              case "user_sign_out":
              case "admin_sign_out":
              case "sign_out":
                groupedData[periodKey].signOuts++;
                break;
              case "user_register":
              case "register":
              case "new_user":
                groupedData[periodKey].newUsers++;
                break;
              case "event_create":
              case "create_event":
              case "event_created":
                groupedData[periodKey].eventCreated++;
                break;
              case "event_import":
              case "import_event":
              case "event_imported":
                groupedData[periodKey].eventImported++;
                break;
              case "participant_action":
              case "participant":
                groupedData[periodKey].participants++;
                break;
              case "profile_update":
              case "update_profile":
                groupedData[periodKey].profiles++;
                break;
            }

            console.log("Updated group data:", {
              periodKey,
              originalActivity: log.activityType,
              normalizedActivity: activity,
              signIns: groupedData[periodKey].signIns,
              signOuts: groupedData[periodKey].signOuts,
            });
          }
        } catch (error) {
          console.error("Error processing log:", error);
        }
      });

      console.log("Final grouped data:", groupedData);

      // Convert to array, filter out periods with no data, and format for display
      const formattedData = Object.values(groupedData)
        .filter((data) => {
          // Check if this period has any data
          return (
            data.total > 0 ||
            data.signIns > 0 ||
            data.signOuts > 0 ||
            data.newUsers > 0 ||
            data.eventCreated > 0 ||
            data.eventImported > 0 ||
            data.participants > 0 ||
            data.profiles > 0
          );
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((data) => ({
          ...data,
          date: format(data.date, formatPattern),
        }));

      console.log("Final formatted data:", formattedData);
      setGraphData(formattedData);
    } catch (error) {
      console.error("Error processing graph data:", error);
      setGraphData([]);
    }
  };

  // Filter logs based on search criteria
  const filteredLogs = logs.filter((log) => {
    try {
      const timestamp = log.timestamp
        ? format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss").toLowerCase()
        : "";
      const userName = (users[log.userId] || "Unknown User").toLowerCase();
      const activity = (log.activityType || "").toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      // Filter by selected user
      const matchesUser = selectedUser === "all" || log.userId === selectedUser;

      // Search based on selected column
      const matchesSearch =
        searchColumn === "all"
          ? timestamp.includes(searchLower) ||
            userName.includes(searchLower) ||
            activity.includes(searchLower)
          : searchColumn === "timestamp"
          ? timestamp.includes(searchLower)
          : searchColumn === "user"
          ? userName.includes(searchLower)
          : activity.includes(searchLower);

      // Filter by activity type
      const matchesType =
        filterType === "all"
          ? true
          : filterType === "signed"
          ? activity.includes("sign in") || activity.includes("sign out")
          : filterType === "event"
          ? activity.includes("event") ||
            activity.includes("created event") ||
            activity.includes("imported event")
          : filterType === "participant"
          ? activity.includes("participant")
          : filterType === "profile"
          ? activity.includes("profile")
          : activity.includes("user registered");

      return matchesSearch && matchesType && matchesUser;
    } catch (error) {
      console.error("Error filtering log:", error);
      return false;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Add a function to check if an activity has any data
  const hasActivityData = (dataKey) => {
    return graphData.some((data) => data[dataKey] > 0);
  };

  return (
    <div className="space-y-6">
      {/* Activity Graph Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activity Timeline</CardTitle>
          <div className="flex gap-4">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {Object.entries(users).map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {activityTypes.map((activity) => (
              <Button
                key={activity.key}
                variant={
                  selectedActivities.includes(activity.key)
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => {
                  setSelectedActivities((prev) =>
                    prev.includes(activity.key)
                      ? prev.filter((a) => a !== activity.key)
                      : [...prev, activity.key]
                  );
                }}
                className="flex items-center gap-2"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: activity.color }}
                />
                {activity.name}
                {
                  !hasActivityData(
                    activity.key === "total" ? "total" : activity.key + "s"
                  )
                }
              </Button>
            ))}
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedActivities.includes("total") &&
                  hasActivityData("total") && (
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Total Activities"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  )}
                {selectedActivities.includes("signIns") &&
                  hasActivityData("signIns") && (
                    <Area
                      type="monotone"
                      dataKey="signIns"
                      name="Sign Ins"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.3}
                    />
                  )}
                {selectedActivities.includes("signOuts") &&
                  hasActivityData("signOuts") && (
                    <Area
                      type="monotone"
                      dataKey="signOuts"
                      name="Sign Outs"
                      stroke="#ff7300"
                      fill="#ff7300"
                      fillOpacity={0.3}
                    />
                  )}
                {selectedActivities.includes("newUsers") &&
                  hasActivityData("newUsers") && (
                    <Area
                      type="monotone"
                      dataKey="newUsers"
                      name="New Users"
                      stroke="#FFBB28"
                      fill="#FFBB28"
                      fillOpacity={0.3}
                    />
                  )}
                {selectedActivities.includes("eventCreated") &&
                  hasActivityData("eventCreated") && (
                    <Area
                      type="monotone"
                      dataKey="eventCreated"
                      name="Events Created"
                      stroke="#00C49F"
                      fill="#00C49F"
                      fillOpacity={0.3}
                    />
                  )}
                {selectedActivities.includes("eventImported") &&
                  hasActivityData("eventImported") && (
                    <Area
                      type="monotone"
                      dataKey="eventImported"
                      name="Events Imported"
                      stroke="#ffc658"
                      fill="#ffc658"
                      fillOpacity={0.3}
                    />
                  )}
                {selectedActivities.includes("participants") &&
                  hasActivityData("participants") && (
                    <Area
                      type="monotone"
                      dataKey="participants"
                      name="Participant Activities"
                      stroke="#ff8042"
                      fill="#ff8042"
                      fillOpacity={0.3}
                    />
                  )}
                {selectedActivities.includes("profiles") &&
                  hasActivityData("profiles") && (
                    <Area
                      type="monotone"
                      dataKey="profiles"
                      name="Profile Updates"
                      stroke="#ea5545"
                      fill="#ea5545"
                      fillOpacity={0.3}
                    />
                  )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 max-w-sm relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={searchColumn} onValueChange={setSearchColumn}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Search in column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Columns</SelectItem>
                <SelectItem value="timestamp">Timestamp</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="signed">Sign In/Out</SelectItem>
                <SelectItem value="event">Event Activities</SelectItem>
                <SelectItem value="participant">
                  Participant Activities
                </SelectItem>
                <SelectItem value="profile">Profile Updates</SelectItem>
                <SelectItem value="user">User Registration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableCaption>
              Page {currentPage} of {totalPages} | Showing{" "}
              {paginatedLogs.length} of {filteredLogs.length} activities
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading activity logs...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    No matching activities found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => (
                  <TableRow key={log.$id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>{users[log.userId] || "Unknown User"}</TableCell>
                    <TableCell>{log.activityType}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
