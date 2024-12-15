'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export function SearchAndFilter() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('')

  const handleSearch = () => {
    // Implement search functionality
  }

  return (
    <div className="flex space-x-4 mb-4">
      <Input
        type="text"
        placeholder="Search events..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Select value={category} onValueChange={setCategory}>
        <option value="">All Categories</option>
        <option value="meeting">Meeting</option>
        <option value="birthday">Birthday</option>
        <option value="deadline">Deadline</option>
      </Select>
      <Select value={priority} onValueChange={setPriority}>
        <option value="">All Priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </Select>
      <Select value={status} onValueChange={setStatus}>
        <option value="">All Statuses</option>
        <option value="upcoming">Upcoming</option>
        <option value="past">Past</option>
      </Select>
      <Button onClick={handleSearch}>Search</Button>
    </div>
  )
}

