"use client"

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"

const categories = [
  { label: "All Employees", value: "all" },
  { label: "Management", value: "management" },
  { label: "Teaching", value: "teaching" },
  { label: "Non-Teaching", value: "non-teaching" },
  { label: "Contractual", value: "contractual" },
  { label: "Permanent", value: "permanent" },
]

export function DashboardFilters({ onFilterChange }) {
  const [date, setDate] = useState()
  const [selectedCategories, setSelectedCategories] = useState(["all"])
  const [open, setOpen] = useState(false)

  const handleDateChange = (newDate) => {
    setDate(newDate)
    onFilterChange({ date: newDate, categories: selectedCategories })
  }

  const handleCategoryChange = (value) => {
    setSelectedCategories(values)
    onFilterChange({ date, categories: values })
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <div className="flex-1">
            <Label htmlFor="date-picker" className="mb-2 block">
              Select Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-1">
            <Label htmlFor="category-select" className="mb-2 block">
              Employee Categories
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedCategories.length > 0
                    ? `${selectedCategories.length} selected`
                    : "Select categories..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search categories..." />
                  <CommandEmpty>No category found.</CommandEmpty>
                  <CommandGroup>
                    {categories.map((category) => (
                      <CommandItem
                        key={category.value}
                        onSelect={() => {
                          const newCategories = selectedCategories.includes(category.value)
                            ? selectedCategories.filter((c) => c !== category.value)
                            : [...selectedCategories, category.value]
                          handleCategoryChange(newCategories)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCategories.includes(category.value) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {category.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

