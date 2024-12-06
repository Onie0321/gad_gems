import { Suspense, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "./header/page";
import { DashboardContent } from "./content/page";
import { DashboardSkeleton } from "./section/page";
import { InputOptions } from "./input-options/page";


export default function PersonnelStatistic() {
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    sex: '',
  })

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Personnel Statistics Dashboard</h1> 

      <Tabs defaultValue="dashboard" className="mt-8">
        <TabsList className="w-full">
          <TabsTrigger value="dashboard" className="flex-1">Dashboard</TabsTrigger>
          <TabsTrigger value="input" className="flex-1">Input and Selection Options</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="pt-6">
          <DashboardContent filters={filters} />
        </TabsContent>
        <TabsContent value="input" className="pt-6">
          <InputOptions onFilterChange={handleFilterChange} />
        </TabsContent>
      </Tabs>
     
    </div>
  )
}


