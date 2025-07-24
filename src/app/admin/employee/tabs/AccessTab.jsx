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

const AccessTab = memo(({ employees, loading, onView, onEdit }) => {
  if (loading) {
    return <div className="p-4 text-center">Loading office access data...</div>;
  }

  if (!employees?.length) {
    return <div className="p-4 text-center">No office access data found.</div>;
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Office Access</TableHead>
            <TableHead>Controls Resources</TableHead>
            <TableHead>Involved in Decisions</TableHead>
            <TableHead>Committee Member</TableHead>
            <TableHead>Consulted on Policies</TableHead>
            <TableHead>Superior Respects Rights</TableHead>
            <TableHead>Disrespect Reason</TableHead>
            <TableHead>Treated with Respect</TableHead>
            <TableHead>Respect Issue Reason</TableHead>
            <TableHead>Aware of GAD Guidelines</TableHead>
            <TableHead>Audited GAD Funds</TableHead>
            <TableHead>GAD Funds Compliance</TableHead>
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
                    employee.hasOfficeAccess
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.hasOfficeAccess ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.controlsOfficeResources
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.controlsOfficeResources ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.involvedInDecisions
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.involvedInDecisions ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.memberOfCommittee
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.memberOfCommittee ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.consultedOnPolicies} limit={40} />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.superiorRespectsRights
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {employee.superiorRespectsRights ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText
                  text={employee.superiorDisrespectReason}
                  limit={40}
                />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.treatedWithRespect
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {employee.treatedWithRespect ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.respectIssueReason} limit={40} />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.awareOfGADAuditGuidelines
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.awareOfGADAuditGuidelines ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.auditedGADFunds
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.auditedGADFunds ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.gadFundsCompliance
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.gadFundsCompliance ? "Yes" : "No"}
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

AccessTab.displayName = "AccessTab";
export default AccessTab;
