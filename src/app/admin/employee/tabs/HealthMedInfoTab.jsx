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

const HealthMedInfoTab = memo(({ employees, loading, onView, onEdit }) => {
  if (loading) {
    return (
      <div className="p-4 text-center">Loading health & medical data...</div>
    );
  }

  if (!employees?.length) {
    return (
      <div className="p-4 text-center">No health & medical data found.</div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Family Planning</TableHead>
            <TableHead>Contraceptive Method</TableHead>
            <TableHead>Need Family Planning Info</TableHead>
            <TableHead>Household Activities</TableHead>
            <TableHead>Chore Hours</TableHead>
            <TableHead>Family Participation</TableHead>
            <TableHead>Own House</TableHead>
            <TableHead>House Details</TableHead>
            <TableHead>Regular Checkup</TableHead>
            <TableHead>Family Checkup</TableHead>
            <TableHead>Annual Checkup</TableHead>
            <TableHead>Blood Type</TableHead>
            <TableHead>Medical Illness</TableHead>
            <TableHead>Medical Details</TableHead>
            <TableHead>Hospitalized</TableHead>
            <TableHead>Hospital Year</TableHead>
            <TableHead>Had Surgery</TableHead>
            <TableHead>Surgery Year</TableHead>
            <TableHead>Food Allergies</TableHead>
            <TableHead>Medicine Allergies</TableHead>
            <TableHead>Family History</TableHead>
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
                    employee.familyPlanning
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.familyPlanning ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.contraceptiveMethod} limit={40} />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.needFamilyPlanningInfo
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.needFamilyPlanningInfo ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.performHouseholdActivities
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.performHouseholdActivities ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.householdChoreHours} limit={20} />
              </TableCell>
              <TableCell>
                <TruncatedText
                  text={employee.householdMembersParticipate}
                  limit={30}
                />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.ownHouseProperty
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.ownHouseProperty ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText
                  text={employee.houseOwnershipDetails}
                  limit={40}
                />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.regularCheckup
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.regularCheckup ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.familyCheckup
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.familyCheckup ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.annualCheckup
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.annualCheckup ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>{employee.bloodType}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.hasMedicalIllness
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.hasMedicalIllness ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText
                  text={employee.hasMedicalIllnessSpecify}
                  limit={40}
                />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.hospitalizedBefore
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.hospitalizedBefore ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>{employee.hospitalizationYear || "N/A"}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.hadSurgery
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.hadSurgery ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>{employee.surgeryYear || "N/A"}</TableCell>
              <TableCell>
                <TruncatedText text={employee.foodAllergies} limit={40} />
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.medicineAllergies} limit={40} />
              </TableCell>
              <TableCell>
                <TruncatedText
                  text={employee.familyMedicalHistory}
                  limit={40}
                />
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

HealthMedInfoTab.displayName = "HealthMedInfoTab";
export default HealthMedInfoTab;
