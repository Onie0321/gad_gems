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

const ChildFamPlanTab = memo(({ employees, loading, onView, onEdit }) => {
  if (loading) {
    return (
      <div className="p-4 text-center">
        Loading children & family planning data...
      </div>
    );
  }

  if (!employees?.length) {
    return (
      <div className="p-4 text-center">
        No children & family planning data found.
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Has Children</TableHead>
            <TableHead>Ages 0-6</TableHead>
            <TableHead>Ages 7-18</TableHead>
            <TableHead>Ages 18+</TableHead>
            <TableHead>Considering Child</TableHead>
            <TableHead>Want More Children</TableHead>
            <TableHead>Waiting Period</TableHead>
            <TableHead>Age Gap</TableHead>
            <TableHead>Uses Day Care</TableHead>
            <TableHead>Needs Day Care</TableHead>
            <TableHead>Needs Lactation Room</TableHead>
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
                <Badge
                  variant="outline"
                  className={`${
                    employee.hasChildren
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.hasChildren ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>{employee.childrenAge0to6 || 0}</TableCell>
              <TableCell>{employee.childrenAge7to18 || 0}</TableCell>
              <TableCell>{employee.childrenAge18Plus || 0}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.considerHavingChild
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.considerHavingChild ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.wantMoreChildren
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.wantMoreChildren ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText
                  text={employee.waitingPeriodNextChild}
                  limit={30}
                />
              </TableCell>
              <TableCell>
                <TruncatedText
                  text={employee.averageAgeGapChildren}
                  limit={20}
                />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.useDayCareServices
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.useDayCareServices ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.needDayCareFacility
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.needDayCareFacility ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.needLactationRoom
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.needLactationRoom ? "Yes" : "No"}
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

ChildFamPlanTab.displayName = "ChildFamPlanTab";
export default ChildFamPlanTab;
