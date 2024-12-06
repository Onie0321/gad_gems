"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function InputOptions({ onFilterChange }) {
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    sex: '',
  })

  const [data, setData] = useState({
    managementType: {
      topManagement: { male: 0, female: 0 },
      middleManagement: { male: 0, female: 0 },
      administrativeSupport: { male: 0, female: 0 },
    },
    specificCategories: {
      differentlyAbled: { male: 0, female: 0 },
      indigenousPeoples: { male: 0, female: 0 },
      soloParents: { male: 0, female: 0 },
      withChildrenBelow7: { male: 0, female: 0 },
      withDifferentlyAbledChildren: { male: 0, female: 0 },
    },
    employmentStatus: {
      permanent: { male: 0, female: 0 },
      contractual: { male: 0, female: 0 },
      temporary: { male: 0, female: 0 },
      jobOrder: { male: 0, female: 0 },
      partTime: { male: 0, female: 0 },
    },
    civilStatus: {
      teaching: { male: 0, female: 0 },
      nonTeaching: { male: 0, female: 0 },
    },
    educationalAttainment: {
      bachelors: { male: 0, female: 0 },
      masters: { male: 0, female: 0 },
      doctorate: { male: 0, female: 0 },
      others: { male: 0, female: 0 },
    },
  })

  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value }
      onFilterChange(newFilters)
      return newFilters
    })
  }

  const handleDataChange = (category, subcategory, gender, value) => {
    setData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subcategory]: {
          ...prev[category][subcategory],
          [gender]: parseInt(value) || 0,
        },
      },
    }))
  }

  const handleExport = () => {
    const js = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSOify({ filters, data })
    )}`
    const link = document.createElement("a")
    link.href = js
    link.download = "personnel_statistics.json"
    link.click()
  }

  const handleImport = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result)
          setFilters(importedData.filters)
          setData(importedData.data)
          onFilterChange(importedData.filters)
        } catch (error) {
          console.error("Error parsing imported data:", error)
          alert("Invalid file format. Please upload a valid JSON file.")
        }
      }
      reader.readAsText(file)
    }
  }

  const renderInputGroup = (category, subcategory, label) => (
    <div className="grid grid-cols-3 gap-2 mb-2">
      <Label htmlFor={`${category}-${subcategory}-male`} className="text-right">{label}</Label>
      <Input
        id={`${category}-${subcategory}-male`}
        type="number"
        value={data[category][subcategory].male}
        onChange={(e) => handleDataChange(category, subcategory, 'male', e.target.value)}
        className="bg-blue-50"
      />
      <Input
        id={`${category}-${subcategory}-female`}
        type="number"
        value={data[category][subcategory].female}
        onChange={(e) => handleDataChange(category, subcategory, 'female', e.target.value)}
        className="bg-pink-50"
      />
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Input and Selection Options</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="filters">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="filters" className="flex-1">Filters</TabsTrigger>
            <TabsTrigger value="data-entry" className="flex-1">Data Entry</TabsTrigger>
          </TabsList>
          <TabsContent value="filters">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={filters.department} onValueChange={(value) => handleFilterChange('department', value)}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="it">Information Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select value={filters.year} onValueChange={(value) => handleFilterChange('year', value)}>
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select value={filters.sex} onValueChange={(value) => handleFilterChange('sex', value)}>
                  <SelectTrigger id="sex">
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="data-entry">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Management Type</h3>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div></div>
                  <Label className="text-center text-blue-600">Male</Label>
                  <Label className="text-center text-pink-600">Female</Label>
                </div>
                {renderInputGroup('managementType', 'topManagement', 'Top Management')}
                {renderInputGroup('managementType', 'middleManagement', 'Middle Management')}
                {renderInputGroup('managementType', 'administrativeSupport', 'Administrative and Support')}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Specific Categories</h3>
                {renderInputGroup('specificCategories', 'differentlyAbled', 'Differently-abled')}
                {renderInputGroup('specificCategories', 'indigenousPeoples', 'Indigenous Peoples (IP) Groups')}
                {renderInputGroup('specificCategories', 'soloParents', 'Solo Parents')}
                {renderInputGroup('specificCategories', 'withChildrenBelow7', 'With children below 7 years old')}
                {renderInputGroup('specificCategories', 'withDifferentlyAbledChildren', 'With differently-abled children')}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Employment Status</h3>
                {renderInputGroup('employmentStatus', 'permanent', 'Permanent')}
                {renderInputGroup('employmentStatus', 'contractual', 'Contractual')}
                {renderInputGroup('employmentStatus', 'temporary', 'Temporary')}
                {renderInputGroup('employmentStatus', 'jobOrder', 'Job Order')}
                {renderInputGroup('employmentStatus', 'partTime', 'Part-Time')}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Civil Status (Teaching and Non-Teaching)</h3>
                {renderInputGroup('civilStatus', 'teaching', 'Teaching')}
                {renderInputGroup('civilStatus', 'nonTeaching', 'Non-Teaching')}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Educational Attainment</h3>
                {renderInputGroup('educationalAttainment', 'bachelors', "Bachelor's Degree")}
                {renderInputGroup('educationalAttainment', 'masters', "Master's Degree")}
                {renderInputGroup('educationalAttainment', 'doctorate', 'Doctorate Degree')}
                {renderInputGroup('educationalAttainment', 'others', 'Others')}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex justify-between mt-6">
          <Button onClick={handleExport}>Export Data</Button>
          <div>
            <input
              type="file"
              id="import-file"
              className="hidden"
              accept=".json"
              onChange={handleImport}
            />
            <Button onClick={() => document.getElementById('import-file')?.click()}>
              Import Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

