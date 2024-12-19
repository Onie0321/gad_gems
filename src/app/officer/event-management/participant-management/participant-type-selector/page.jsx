import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ParticipantTypeSelector({ selectedType, onTypeChange }) {
  return (
    <div className="mb-6">
      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[200px]">
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