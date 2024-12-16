// src/app/admin/user-management/page.jsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserList from "./user-list/page";
import ActivityLogs from "./activity-logs/page";

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-heading mb-6">User Management</h1>

      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="text-base">
            Users
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-base">
            Activity Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserList />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
