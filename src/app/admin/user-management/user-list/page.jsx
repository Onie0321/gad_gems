// src/app/admin/user-management/user-list/page.jsx
"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Eye, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  fetchUsers,
  updateUserStatus,
  logActivity,
  databases,
  databaseId,
  userCollectionId,
  activityLogsCollectionId,
} from "@/lib/appwrite";
import { Query, ID } from "appwrite";
import { Label } from "@/components/ui/label";
import { SelectStatus } from "@/components/ui/selectStatus";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Starting to fetch users...");
      const fetchedUsers = await fetchUsers();
      console.log("Fetched users:", fetchedUsers);

      if (!fetchedUsers || fetchedUsers.length === 0) {
        console.log("No users found or empty response");
      }

      setUsers(fetchedUsers || []);
    } catch (error) {
      console.error("Error in loadUsers:", error);
      setError(error.message);
      toast({
        title: "Error",
        description: `Failed to fetch users: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updated = await databases.updateDocument(
        databaseId,
        usersCollectionId,
        selectedUser.$id,
        editForm
      );

      await logActivity(selectedUser.$id, "User profile updated");

      setUsers(
        users.map((user) =>
          user.$id === selectedUser.$id ? { ...user, ...editForm } : user
        )
      );

      setIsEditOpen(false);
      toast({
        title: "Success",
        description: "User updated successfully",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      await updateUserStatus(userId, newStatus);

      // Log the activity
      await logActivity(userId, `User status updated to ${newStatus}`);

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.$id === userId ? { ...user, approvalStatus: newStatus } : user
        )
      );

      toast({
        title: "Success",
        description: `User status updated to ${newStatus}`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      filterRole === "all" ||
      user.role.toLowerCase() === filterRole.toLowerCase();
    const matchesStatus =
      filterStatus === "all" ||
      user.approvalStatus.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading users: {error}</p>
          <Button onClick={loadUsers} className="mt-4">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
      <div className="flex justify-between items-center">
        
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-100"></div>
            <span className="text-sm">Pending: {users.filter(user => user.approvalStatus === 'pending').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-100"></div>
            <span className="text-sm">Approved: {users.filter(user => user.approvalStatus === 'approved').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-100"></div>
            <span className="text-sm">Declined: {users.filter(user => user.approvalStatus === 'declined').length}</span>
          </div>
        </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableCaption>
            {users.length === 0 && !loading
              ? "No users found"
              : "A list of all users"}
          </TableCaption>{" "}
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading users...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.$id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    <SelectStatus
                      status={user.approvalStatus}
                      onStatusChange={(newStatus) => handleUpdateStatus(user.$id, newStatus)}
                      className="text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.$createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(user)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(user)}
                      className="text-yellow-600 hover:text-yellow-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                      </DialogHeader>
                      {selectedUser && (
                        <div className="space-y-4">
                          <div>
                            <label className="font-bold">Name:</label>
                            <p>{selectedUser.name}</p>
                          </div>
                          <div>
                            <label className="font-bold">Email:</label>
                            <p>{selectedUser.email}</p>
                          </div>
                          <div>
                            <label className="font-bold">Role:</label>
                            <p className="capitalize">{selectedUser.role}</p>
                          </div>
                          <div>
                            <label className="font-bold">Status:</label>
                            <p className="capitalize">
                              {selectedUser.approvalStatus}
                            </p>
                          </div>
                          <div>
                            <label className="font-bold">Joined:</label>
                            <p>
                              {format(new Date(selectedUser.$createdAt), "PPP")}
                            </p>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                          />
                        </div>
                        <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={editForm.email}
          disabled // Make email read-only
          className="bg-gray-100" // Visual indication that it's read-only
        />
      </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <Select
                            value={editForm.role}
                            onValueChange={(value) =>
                              setEditForm({ ...editForm, role: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Save changes</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
