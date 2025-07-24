"use client";

import { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TruncatedText } from "../components/TruncatedText";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";

const FamilyFinancialTab = memo(({ employees, loading, onView, onEdit }) => {
  if (loading) {
    return (
      <div className="p-4 text-center">Loading family & financial data...</div>
    );
  }

  if (!employees?.length) {
    return (
      <div className="p-4 text-center">No family & financial data found.</div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Total Income</TableHead>
            <TableHead>Income Sources</TableHead>
            <TableHead>Major Contributor</TableHead>
            <TableHead>Major Contributor Details</TableHead>
            <TableHead>Finance Manager</TableHead>
            <TableHead>Finance Manager Details</TableHead>
            <TableHead>Household Size</TableHead>
            <TableHead>Outside Support</TableHead>
            <TableHead>Has Savings</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.$id}>
              <TableCell>{employee.employeeId}</TableCell>
              <TableCell>
                <TruncatedText text={employee.fullName} limit={30} />
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.totalIncome} limit={20} />
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.incomeSources} limit={40} />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.majorContributor
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.majorContributor ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText
                  text={employee.majorContributorSpecify}
                  limit={40}
                />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.soleFinanceManager
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.soleFinanceManager ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText
                  text={employee.soleFinanceManagerSpecify}
                  limit={40}
                />
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.householdSize} limit={10} />
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.outsideSupport} limit={20} />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.hasSavings === "Yes"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.hasSavings || "No"}
                </Badge>
              </TableCell>
              <TableCell>{employee.year}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView(employee)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(employee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

FamilyFinancialTab.displayName = "FamilyFinancialTab";
export default FamilyFinancialTab;
