// src/app/admin/user-management/page.jsx
"use client";

import * as React from "react";
import { account, databases, client } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ID, Query } from "appwrite";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const ITEMS_PER_PAGE = 10;
const USER_ROLES = ["admin", "editor", "viewer", "user"];

export function UserManagement() {
  const [userList, setUserList] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedUsers, setSelectedUsers] = React.useState(new Set());
  const [activityLogs, setActivityLogs] = React.useState([]);
  const [filters, setFilters] = React.useState({
    role: "",
    isActive: "",
    approvalStatus: "",
  });
  const { toast } = useToast();

  // Real-time updates subscription
  React.useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.*.collections.*.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*")) {
          fetchUsers();
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Build queries based on filters and search
      const queries = [Query.limit(ITEMS_PER_PAGE)];
      queries.push(Query.offset((currentPage - 1) * ITEMS_PER_PAGE));

      if (searchQuery) {
        queries.push(
          Query.or([
            Query.search("name", searchQuery),
            Query.search("email", searchQuery),
          ])
        );
      }

      if (filters.role) queries.push(Query.equal("role", filters.role));
      if (filters.isActive)
        queries.push(Query.equal("isActive", filters.isActive === "true"));
      if (filters.approvalStatus)
        queries.push(Query.equal("approvalStatus", filters.approvalStatus));

      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID,
        queries
      );

      setUserList(response.documents);
      setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      toast({
        title: "Error",
        description: `Failed to fetch users: ${
          error.message || "Unknown error"
        }`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, filters, toast]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const logActivity = (action, details) => {
    const newLog = {
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const updateUserStatus = async (userId, field, newValue) => {
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID,
        userId,
        { [field]: newValue }
      );
      toast({
        title: "Success",
        description: `User ${field} updated successfully.`,
      });
      logActivity("status_update", `Updated ${field} for user ${userId}`);
      fetchUsers();
    } catch (error) {
      console.error(`Error updating user ${field}:`, error);
      toast({
        title: "Error",
        description: `Failed to update user ${field}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async (action) => {
    try {
      const promises = Array.from(selectedUsers).map((userId) => {
        switch (action) {
          case "delete":
            return handleDeleteUser(userId);
          case "approve":
            return updateUserStatus(userId, "approvalStatus", "approved");
          case "deactivate":
            return updateUserStatus(userId, "isActive", false);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      setSelectedUsers(new Set());
      toast({
        title: "Success",
        description: `Bulk action '${action}' completed successfully.`,
      });
      logActivity(
        "bulk_action",
        `Performed ${action} on ${selectedUsers.size} users`
      );
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to perform bulk action: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID,
        userId
      );
      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
      logActivity("delete", `Deleted user ${userId}`);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex space-x-2">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <div className="p-2 space-y-2">
                <Select
                  value={filters.role}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.approvalStatus}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, approvalStatus: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by approval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {selectedUsers.size > 0 && (
        <div className="flex space-x-2">
          <Button onClick={() => handleBulkAction("approve")}>
            Approve Selected
          </Button>
          <Button onClick={() => handleBulkAction("deactivate")}>
            Deactivate Selected
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleBulkAction("delete")}
          >
            Delete Selected
          </Button>
        </div>
      )}

      {isLoading && <p>Loading users...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!isLoading && !error && (
        <>
          {userList.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={selectedUsers.size === userList.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers(
                            new Set(userList.map((user) => user.$id))
                          );
                        } else {
                          setSelectedUsers(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Activity Status</TableHead>
                  <TableHead>Approval Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userList.map((user) => (
                  <TableRow key={user.$id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.$id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedUsers);
                          if (checked) {
                            newSelected.add(user.$id);
                          } else {
                            newSelected.delete(user.$id);
                          }
                          setSelectedUsers(newSelected);
                        }}
                      />
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          updateUserStatus(user.$id, "role", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isActive ? "success" : "destructive"}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateUserStatus(
                            user.$id,
                            "approvalStatus",
                            user.approvalStatus === "approved"
                              ? "pending"
                              : "approved"
                          )
                        }
                      >
                        <Badge
                          variant={
                            user.approvalStatus === "approved"
                              ? "success"
                              : "warning"
                          }
                        >
                          {user.approvalStatus || "pending"}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          updateUserStatus(user.$id, "isActive", !user.isActive)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.$id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-2">
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </Button>
              <Button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Activity Logs</h3>
        <ScrollArea className="h-[200px] border rounded-md p-4">
          {activityLogs.map((log, index) => (
            <div key={index} className="mb-2">
              <span className="text-sm text-muted-foreground">
                {new Date(log.timestamp).toLocaleString()}: {log.action} -{" "}
                {log.details}
              </span>
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}
