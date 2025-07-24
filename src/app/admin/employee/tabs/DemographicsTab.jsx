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

const DemographicsTab = memo(({ employees, loading, onView, onEdit }) => {
  if (loading) {
    return <div className="p-4 text-center">Loading demographics data...</div>;
  }

  if (!employees?.length) {
    return <div className="p-4 text-center">No demographics data found.</div>;
  }

  const getBadgeColor = (value) => {
    return value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const formatYesNo = (value) => {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (typeof value === "string") {
      const lowered = value.toLowerCase();
      return lowered === "yes" || lowered === "true" || lowered === "1"
        ? "Yes"
        : "No";
    }
    return "No";
  };

  const getDisplayValue = (value) => {
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return value.trim();
    return String(value);
  };

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Civil Status</TableHead>
            <TableHead>Sex at Birth</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Non-Heterosexual</TableHead>
            <TableHead>PWD</TableHead>
            <TableHead>PWD Details</TableHead>
            <TableHead>Solo Parent</TableHead>
            <TableHead>Indigenous People</TableHead>
            <TableHead>IP Details</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => {
            (
              employee.demographics
            );

            const demographics = employee.demographics || {};

            return (
              <TableRow key={employee.id}>
                <TableCell>{employee.employeeId}</TableCell>
                <TableCell>
                  <TruncatedText text={employee.fullName} limit={30} />
                </TableCell>
                <TableCell>
                  <TruncatedText
                    text={getDisplayValue(demographics.civilStatus)}
                    limit={20}
                  />
                </TableCell>
                <TableCell>
                  <TruncatedText
                    text={getDisplayValue(demographics.sexAtBirth)}
                    limit={20}
                  />
                </TableCell>
                <TableCell>
                  <TruncatedText
                    text={getDisplayValue(demographics.gender)}
                    limit={20}
                  />
                </TableCell>
                <TableCell>
                  <TruncatedText
                    text={getDisplayValue(demographics.nonHeterosexual)}
                    limit={30}
                  />
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getBadgeColor(demographics.pwd)}
                  >
                    {formatYesNo(demographics.pwd)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TruncatedText
                    text={getDisplayValue(demographics.pwdSpecify)}
                    limit={40}
                  />
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getBadgeColor(demographics.soloParent)}
                  >
                    {formatYesNo(demographics.soloParent)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getBadgeColor(demographics.ip)}
                  >
                    {formatYesNo(demographics.ip)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TruncatedText
                    text={getDisplayValue(demographics.ipSpecify)}
                    limit={40}
                  />
                </TableCell>
                <TableCell>
                  {demographics.year || new Date().getFullYear()}
                </TableCell>
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

DemographicsTab.displayName = "DemographicsTab";
export default DemographicsTab;
