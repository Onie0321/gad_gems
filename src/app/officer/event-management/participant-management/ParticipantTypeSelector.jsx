"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function ParticipantTypeSelector({
  participantType,
  onTypeChange,
  disabled,
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="participantType">Participant Type</Label>
      <Select
        value={participantType}
        onValueChange={onTypeChange}
        disabled={disabled}
      >
        <SelectTrigger id="participantType">
          <SelectValue placeholder="Select participant type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="student">Student</SelectItem>
          <SelectItem value="staff">Staff/Faculty</SelectItem>
          <SelectItem value="community">Community Member</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
