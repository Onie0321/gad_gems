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

const WorkplaceTab = memo(({ employees, loading, onView, onEdit }) => {
  if (loading) {
    return (
      <div className="p-4 text-center">
        Loading workplace environment data...
      </div>
    );
  }

  if (!employees?.length) {
    return (
      <div className="p-4 text-center">
        No workplace environment data found.
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
            <TableHead>Aware of Security Laws</TableHead>
            <TableHead>Experienced Abuse</TableHead>
            <TableHead>Abuse Source</TableHead>
            <TableHead>Abuse Age</TableHead>
            <TableHead>Abuse Ongoing</TableHead>
            <TableHead>Abuse Reaction</TableHead>
            <TableHead>Willing for Counseling</TableHead>
            <TableHead>Needs Crisis Room</TableHead>
            <TableHead>Aware of VAW Desk</TableHead>
            <TableHead>Has Legal Assistance</TableHead>
            <TableHead>Aware of RA9262 Leave</TableHead>
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
                    employee.awareSecurityLaws
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.awareSecurityLaws ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.experiencedAbuse} limit={40} />
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.abuseSource} limit={40} />
              </TableCell>
              <TableCell>{employee.abuseAge}</TableCell>
              <TableCell>
                <TruncatedText text={employee.abuseOngoing} limit={20} />
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.abuseReaction} limit={40} />
              </TableCell>
              <TableCell>
                <TruncatedText
                  text={employee.willingForCounseling}
                  limit={20}
                />
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.needsCrisisRoom} limit={20} />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.awareVAWDesk
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.awareVAWDesk ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.hasLegalAssistance} limit={20} />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.awareRA9262Leave
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.awareRA9262Leave ? "Yes" : "No"}
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

WorkplaceTab.displayName = "WorkplaceTab";
export default WorkplaceTab;
