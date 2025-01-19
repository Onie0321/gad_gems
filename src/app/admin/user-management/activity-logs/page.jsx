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
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { fetchActivityLogs, fetchUsers } from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [users, setUsers] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsResponse, usersResponse] = await Promise.all([
        fetchActivityLogs(),
        fetchUsers(),
      ]);

      console.log("Logs Response:", logsResponse);
      console.log("Users Response:", usersResponse);

      // Create users map if usersResponse exists and has documents
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

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.activityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      users[log.userId]?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === "all") return matchesSearch;
    if (filterType === "signed")
      return (
        matchesSearch &&
        (log.activityType.includes("Sign In") ||
          log.activityType.includes("Sign Out"))
      );
    if (filterType === "event")
      return matchesSearch && log.activityType.includes("Event");
    if (filterType === "participant")
      return matchesSearch && log.activityType.includes("Participant");
    if (filterType === "profile")
      return matchesSearch && log.activityType.includes("Profile");
    return matchesSearch;
  });

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search by user or activity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />

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
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableCaption>A list of all user activities</TableCaption>
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
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  No activity logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
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
      </div>
    </Card>
  );
}
