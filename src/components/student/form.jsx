"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
} from "@/lib/appwrite";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function StudentInfoTabs() {
  const [formData, setFormData] = useState({
    surName: "",
    firstName: "",
    lastName: "",
    studentId: "",
    email: "",
    semester: "",
    schoolYear: "",
    course: "",
    year: "",
    section: "",
    studentType: "",
    sex: "",
    civilStatus: "",
    cpNumber: "",
    homeAddress: "",
    birthPlace: "",
    religion: "",
    dialect: "",
    elementary: "",
    elemYearGraduated: "",
    secondary: "",
    secondaryYearGraduated: "",
    college: "",
    collegeYearGraduated: "",
    fatherName: "",
    fatherOccupation: "",
    motherName: "",
    motherOccupation: "",
    personName: "",
    personOccupation: "",
    personAddress: "",
    personName: "",
    personCpNumber: "",
    personAddress: "",
    livingWithFamily: null,
    boarding: null,
    otherImportant: [],
  });

  const [students, setStudents] = useState([]);
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      const response = await getStudents();
      setStudents(response.documents);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students. Please try again.");
    }
  }, [toast]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      validateField(key, formData[key]);
      if (errors[key]) {
        newErrors[key] = errors[key];
      }
    });
    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  }, [formData, errors]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let formattedValue = value;

    if (type === "text") {
      formattedValue = value.replace(/\b\w/g, (l) => l.toUpperCase());
    }

    if (name === "studentId") {
      formattedValue = formatStudentId(value);
    }

    if (name === "schoolYear") {
      formattedValue = formatSchoolYear(value);
    }

    if (name === "cpNumber") {
      formattedValue = formatCPNumber(value);
    }

    if (type === "number") {
      const intValue = parseInt(value, 10);
      formattedValue = isNaN(intValue) ? "" : intValue;
    }

    setFormData((prevData) => ({ ...prevData, [name]: formattedValue }));
    validateField(name, formattedValue);
  };

  const handleSelect = (name, value) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    validateField(name, value);
  };

  const handleCheckbox = (value) => {
    const currentValues = formData.otherImportant;
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    setFormData((prevData) => ({ ...prevData, otherImportant: newValues }));
  };

  const formatStudentId = (value) => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return value;
  };

  const formatSchoolYear = (value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 8) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    }
    return value;
  };

  const formatCPNumber = (value) => {
    if (value.startsWith("+63")) {
      return value.slice(0, 13);
    }
    if (value.startsWith("09")) {
      return value.slice(0, 11);
    }
    return value;
  };

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "studentId":
        if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) {
          error = "Invalid Student ID format. Use 00-00-0000.";
        }
        break;
      case "schoolYear":
        if (!/^\d{4}-\d{4}$/.test(value)) {
          error = "Invalid School Year format. Use YYYY-YYYY.";
        }
        break;
      case "cpNumber":
        if (!/^(\+63\d{10}|09\d{9})$/.test(value)) {
          error = "Invalid CP Number. Use 09123456789 or +639123456789.";
        }
        break;
      default:
        if (!value && isRequiredField(name)) {
          error = `${
            name.charAt(0).toUpperCase() + name.slice(1)
          } is required.`;
        }
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
  };

  const isRequiredField = (name) => {
    const requiredFields = [
      "surName",
      "firstName",
      "lastName",
      "studentId",
      "email",
    ];
    return requiredFields.includes(name);
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      toast.error("Please correct all errors before submitting.");
      return;
    }

    try {
      const response = await createStudent(formData);
      console.log("Student created successfully:", response);
      toast.success("Student registered successfully!");
      setFormData({
        surName: "",
        firstName: "",
        lastName: "",
        studentId: "",
        email: "",
        semester: "",
        schoolYear: "",
        course: "",
        year: "",
        section: "",
        studentType: "",
        sex: "",
        civilStatus: "",
        cpNumber: "",
        homeAddress: "",
        birthPlace: "",
        religion: "",
        dialect: "",
        elementary: "",
        elemYearGraduated: "",
        secondary: "",
        secondaryYearGraduated: "",
        college: "",
        collegeYearGraduated: "",
        fatherName: "",
        fatherOccupation: "",
        motherName: "",
        motherOccupation: "",
        personName: "",
        personOccupation: "",
        personAddress: "",
        personName: "",
        personCpNumber: "",
        personAddress: "",
        livingWithFamily: null,
        boarding: null,
        otherImportant: [],
      });
      fetchStudents();
    } catch (error) {
      console.error("Error creating student:", error);
      toast.error("Failed to register student. Please try again.");
    }
  };

  const handleEdit = (student) => {
    setFormData(student);
  };

  const handleDelete = async (studentId) => {
    try {
      await deleteStudent(studentId);
      toast.success("Student deleted successfully!");
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student. Please try again.");
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      <Tabs defaultValue="student-info" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="student-info">Student Information</TabsTrigger>
          <TabsTrigger value="student-table">Student Table</TabsTrigger>
        </TabsList>

        <TabsContent value="student-info" className="mt-6">
          <div className="space-y-6">
            {/* Student Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Student Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="surName">Surname</Label>
                  <Input
                    id="surName"
                    name="surName"
                    value={formData.surName}
                    onChange={handleChange}
                  />
                  {errors.surName && (
                    <p className="text-red-500 text-sm">{errors.surName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm">{errors.lastName}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                  />
                  {errors.studentId && (
                    <p className="text-red-500 text-sm">{errors.studentId}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Details */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Academic Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="semester">Semester</Label>
                  <Select
                    onValueChange={(value) => handleSelect("semester", value)}
                    value={formData.semester}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st">1st</SelectItem>
                      <SelectItem value="2nd">2nd</SelectItem>
                      <SelectItem value="Midyear">Midyear</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="schoolYear">School Year</Label>
                  <Input
                    id="schoolYear"
                    name="schoolYear"
                    value={formData.schoolYear}
                    onChange={handleChange}
                  />
                  {errors.schoolYear && (
                    <p className="text-red-500 text-sm">{errors.schoolYear}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="course">Course</Label>
                  <Input
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Select
                    onValueChange={(value) => handleSelect("year", value)}
                    value={formData.year}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                      <SelectItem value="5">5th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Student Type</Label>
                <RadioGroup
                  onValueChange={(value) => handleSelect("studentType", value)}
                  value={formData.studentType}
                >
                  <div className="flex flex-wrap gap-4">
                    {[
                      "New",
                      "Old",
                      "Transferee",
                      "Cross Enrollee",
                      "Foreigner",
                    ].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={type}
                          id={`studentType-${type}`}
                        />
                        <Label htmlFor={`studentType-${type}`}>{type}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sex">Sex</Label>
                  <Select
                    onValueChange={(value) => handleSelect("sex", value)}
                    value={formData.sex}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="civilStatus">Civil Status</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelect("civilStatus", value)
                    }
                    value={formData.civilStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select civil status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cpNumber">CP Number</Label>
                  <Input
                    id="cpNumber"
                    name="cpNumber"
                    type="tel"
                    value={formData.cpNumber}
                    onChange={handleChange}
                  />
                  {errors.cpNumber && (
                    <p className="text-red-500 text-sm">{errors.cpNumber}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="homeAddress">Home Address</Label>
                <Textarea
                  id="homeAddress"
                  name="homeAddress"
                  value={formData.homeAddress}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="birthPlace">Birth Place</Label>
                  <Input
                    id="birthPlace"
                    name="birthPlace"
                    value={formData.birthPlace}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="religion">Religion</Label>
                  <Input
                    id="religion"
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="dialect">Dialect</Label>
                  <Input
                    id="dialect"
                    name="dialect"
                    value={formData.dialect}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Educational Background */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Educational Background</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="elementary">Elementary</Label>
                  <Input
                    id="elementary"
                    name="elementary"
                    value={formData.elementary}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="elemYearGraduated">Year Graduated</Label>
                  <Input
                    id="elemYearGraduated"
                    name="elemYearGraduated"
                    type="number"
                    value={formData.elemYearGraduated}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="secondary">
                    Secondary/Senior High School
                  </Label>
                  <Input
                    id="secondary"
                    name="secondary"
                    value={formData.secondary}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="secondaryYearGraduated">Year Graduated</Label>
                  <Input
                    id="secondaryYearGraduated"
                    name="secondaryYearGraduated"
                    type="number"
                    value={formData.secondaryYearGraduated}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="college">College</Label>
                  <Input
                    id="college"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="collegeYearGraduated">Year Graduated</Label>
                  <Input
                    id="collegeYearGraduated"
                    name="collegeYearGraduated"
                    type="number"
                    value={formData.collegeYearGraduated}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Family Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Family Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fatherName">Father&apos;s Name</Label>
                  <Input
                    id="fatherName"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="fatherOccupation">
                    Father&apos;s Occupation
                  </Label>
                  <Input
                    id="fatherOccupation"
                    name="fatherOccupation"
                    value={formData.fatherOccupation}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="motherName">Mother&apos;s Name</Label>
                  <Input
                    id="motherName"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="motherOccupation">
                    Mother&apos;s Occupation
                  </Label>
                  <Input
                    id="motherOccupation"
                    name="motherOccupation"
                    value={formData.motherOccupation}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  Person Supporting You (if other than parents)
                </h3>
                <div>
                  <Label htmlFor="personName">Name</Label>
                  <Input
                    id="personName"
                    name="personName"
                    value={formData.personName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="personOccupation">Occupation</Label>
                  <Input
                    id="personOccupation"
                    name="personOccupation"
                    value={formData.personOccupation}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="personAddress">Address</Label>
                  <Textarea
                    id="personAddress"
                    name="personAddress"
                    value={formData.personAddress}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Emergency Contact</h2>
              <div>
                <Label htmlFor="personName">Name</Label>
                <Input
                  id="personName"
                  name="personName"
                  value={formData.personName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="personCpNumber">CP Number</Label>
                <Input
                  id="personCpNumber"
                  name="personCpNumber"
                  type="number"
                  value={formData.personCpNumber}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="personAddress">Address</Label>
                <Textarea
                  id="personAddress"
                  name="personAddress"
                  value={formData.personAddress}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Living Arrangements */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Living Arrangements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="livingWithFamily">Living with Family?</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelect("livingWithFamily", value === "true")
                    }
                    value={formData.livingWithFamily?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="boarding">Are you boarding?</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelect("boarding", value === "true")
                    }
                    value={formData.boarding?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Special Categories */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Special Categories</h2>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pwd"
                    checked={formData.otherImportant.includes("PWD")}
                    onCheckedChange={() => handleCheckbox("PWD")}
                  />
                  <Label
                    htmlFor="pwd"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Person with Disability (PWD)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ip"
                    checked={formData.otherImportant.includes("IP")}
                    onCheckedChange={() => handleCheckbox("IP")}
                  />
                  <Label
                    htmlFor="ip"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Indigenous People (IP)
                  </Label>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={!isFormValid}
            >
              Submit
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="student-table" className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.$id}>
                  <TableCell>{student.studentId}</TableCell>
                  <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                  <TableCell>{student.course}</TableCell>
                  <TableCell>{student.year}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleEdit(student)}
                      className="mr-2"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(student.$id)}
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </>
  );
}
