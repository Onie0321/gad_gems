import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


export function UserProfileDialog({ user }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View Profile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user.name}'s Profile</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Role:</strong> {user.role}
          </p>
          <p>
            <strong>Activity Status:</strong>{" "}
            {user.isActive ? "Active" : "Inactive"}
          </p>
          <p>
            <strong>Approval Status:</strong> {user.approvalStatus || "Pending"}
          </p>
          {/* Add more user details as needed */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
