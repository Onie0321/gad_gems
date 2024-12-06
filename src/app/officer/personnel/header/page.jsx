import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardFilters } from "../filter/page"

export function DashboardHeader({ totalEmployees, maleEmployees, femaleEmployees, onFilterChange }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Male Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maleEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Female Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{femaleEmployees}</div>
          </CardContent>
        </Card>
      </div>
      <DashboardFilters onFilterChange={onFilterChange} />
    </div>
  )
}

