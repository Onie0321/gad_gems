"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Archive,
  Search,
} from "lucide-react";
import {
  PersonalTab,
  DemographicsTab,
  EmploymentTab,
  GenderAwarenessTab,
  FamilyFinancialTab,
  ChildFamPlanTab,
  HealthMedInfoTab,
  LifestyleTab,
  WorkplaceTab,
  AccessTab,
  PhysicalTab,
} from "./employee/tabs";
import AdvancedSearchTab from "./employee/tabs/AdvancedSearchTab";
import { useToast } from "@/hooks/use-toast";
import { getAllEmployeeData, fetchEmployeeTabData } from "@/lib/appwrite";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ExcelImport from "./ExcelImport";
import { Loader2 } from "lucide-react";
import TablesAndChartsTab from "./employee/tabs/TablesAndChartsTab";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [tablesAndChartsData, setTablesAndChartsData] = useState([]);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState("overview");
  const [activeEmployeeTab, setActiveEmployeeTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const tabListRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    sexDistribution: [],
    departments: [],
    positions: [],
    civilStatusDistribution: [],
    genderDistribution: [],
  });
  const [archivedEmployees, setArchivedEmployees] = useState([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [showAllDepartments, setShowAllDepartments] = useState(false);
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [showAllCivilStatus, setShowAllCivilStatus] = useState(false);
  const [showAllGender, setShowAllGender] = useState(false);

  // Optimized scroll handler with debouncing
  const handleScroll = useCallback((e) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    setIsScrolling(true);
    const position = e.target.scrollLeft;

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      localStorage.setItem("tabScrollPosition", position.toString());
    }, 150);
  }, []);

  // Scroll controls
  const scrollLeft = useCallback(() => {
    if (tabListRef.current) {
      tabListRef.current.scrollLeft -= 200;
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (tabListRef.current) {
      tabListRef.current.scrollLeft += 200;
    }
  }, []);

  // Restore scroll position
  useEffect(() => {
    const savedPosition = localStorage.getItem("tabScrollPosition");
    if (savedPosition && tabListRef.current) {
      tabListRef.current.scrollLeft = parseInt(savedPosition);
    }
  }, [activeEmployeeTab]);

  // View and edit handlers
  const handleViewEmployee = useCallback((employee) => {}, []);

  const handleEditEmployee = useCallback((employee) => {}, []);

  // Fetch employees data
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await fetchEmployeeTabData(activeEmployeeTab);

      console.log("Fetched employee data:", {
        tab: activeEmployeeTab,
        count: data?.length || 0,
        data: data,
      });

      if (!data || data.length === 0) {
        console.log("No employee data returned from API");
        toast({
          title: "No data found",
          description: "No employee data available",
          variant: "destructive",
        });
        setEmployees([]);
        return;
      }

      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: "Error",
        description:
          error.code === "network_error"
            ? "Network error. Please check your connection."
            : "Failed to fetch employee data. Please try again.",
        variant: "destructive",
      });
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Add effect to fetch data when overview tab is active
  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        // Use getAllEmployeeData for overview since it fetches all related data
        const data = await getAllEmployeeData(false);

        console.log("Fetched complete employee data for overview:", {
          count: data?.length || 0,
          sampleEmployee: data[0],
        });

        setEmployees(data);
        // Store complete data for Tables & Charts
        setTablesAndChartsData(data);
      } catch (error) {
        console.error("Error fetching overview data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch overview data",
          variant: "destructive",
        });
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    if (activeMainTab === "overview") {
      fetchOverviewData();
    } else if (activeMainTab === "employees") {
      fetchEmployees();
    }
  }, [activeMainTab, activeEmployeeTab]);

  // Calculate statistics from employee data
  useEffect(() => {
    console.log("Starting stats calculation with employees:", employees);

    if (employees.length > 0) {
      const departmentCounts = {};
      const positionCounts = {};
      const civilStatusCounts = {};
      const genderCounts = {};

      // First, let's count departments and positions
      employees.forEach((employee, index) => {
        // Get office and status from employment details
        const dept = employee.employment?.office || "Unspecified";
        const pos = employee.employment?.eStatus || "Unspecified";
        const civilStatus = employee.demographics?.civilStatus || "Unspecified";
        const gender = employee.demographics?.nonHeterosexual
          ? "Non-Heterosexual"
          : "Heterosexual";

        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
        positionCounts[pos] = (positionCounts[pos] || 0) + 1;
        civilStatusCounts[civilStatus] =
          (civilStatusCounts[civilStatus] || 0) + 1;
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
      });

      // Convert counts to array format and sort
      const departmentsArray = Object.entries(departmentCounts)
        .map(([name, count]) => ({
          name,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      const positionsArray = Object.entries(positionCounts)
        .map(([name, count]) => ({
          name,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      const civilStatusArray = Object.entries(civilStatusCounts)
        .map(([name, count]) => ({
          name,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      const genderArray = Object.entries(genderCounts)
        .map(([name, count]) => ({
          name,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate sex distribution from demographics collection
      const maleCount = employees.filter(
        (e) => e.demographics?.sexAtBirth?.toLowerCase() === "male"
      ).length;

      const femaleCount = employees.filter(
        (e) => e.demographics?.sexAtBirth?.toLowerCase() === "female"
      ).length;

      const newStats = {
        totalEmployees: employees.length,
        sexDistribution: [{ value: maleCount }, { value: femaleCount }],
        departments: departmentsArray,
        positions: positionsArray,
        civilStatusDistribution: civilStatusArray,
        genderDistribution: genderArray,
      };

      console.log("Final stats object:", newStats);
      setStats(newStats);
    } else {
      setStats({
        totalEmployees: 0,
        sexDistribution: [{ value: 0 }, { value: 0 }],
        departments: [],
        positions: [],
        civilStatusDistribution: [],
        genderDistribution: [],
      });
    }
  }, [employees]);

  // Fetch archived employees
  const fetchArchivedEmployees = async () => {
    if (activeMainTab !== "archives") return;

    try {
      setArchiveLoading(true);
      const data = await getAllEmployeeData(true); // Add isArchived parameter
      const archivedData = data.filter((employee) => employee.isArchived);

      const mappedArchived = archivedData.map((employee) => ({
        id: employee.$id,
        fullName: `${employee.firstName || ""} ${employee.middleName || ""} ${
          employee.lastName || ""
        }`.trim(),
        office: employee.office || "",
        eStatus: employee.eStatus || "",
        archivedAt: employee.archivedAt || employee.$updatedAt,
        // Include other necessary fields
        ...employee,
      }));

      setArchivedEmployees(mappedArchived);
    } catch (error) {
      console.error("Error fetching archived employees:", error);
      toast({
        title: "Error",
        description: "Failed to fetch archived employee data",
        variant: "destructive",
      });
    } finally {
      setArchiveLoading(false);
    }
  };

  // Handle restore employee
  const handleRestoreEmployee = async (employeeId) => {
    try {
      await updateEmployeeArchiveStatus(employeeId, false);
      toast({
        title: "Success",
        description: "Employee restored successfully",
      });
      fetchEmployees();
      fetchArchivedEmployees();
    } catch (error) {
      console.error("Error restoring employee:", error);
      toast({
        title: "Error",
        description: "Failed to restore employee",
        variant: "destructive",
      });
    }
  };

  // Handle restore all
  const handleRestoreAll = async () => {
    try {
      await Promise.all(
        archivedEmployees.map((employee) =>
          updateEmployeeArchiveStatus(employee.id, false)
        )
      );
      toast({
        title: "Success",
        description: "All employees restored successfully",
      });
      fetchEmployees();
      fetchArchivedEmployees();
    } catch (error) {
      console.error("Error restoring all employees:", error);
      toast({
        title: "Error",
        description: "Failed to restore all employees",
        variant: "destructive",
      });
    }
  };

  // Add effect to fetch archived employees when tab changes
  useEffect(() => {
    if (activeMainTab === "archives") {
      fetchArchivedEmployees();
    }
  }, [activeMainTab]);

  // Add OverviewSkeleton component before the main EmployeeManagement component
  const OverviewSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-[180px] mb-2" />
            <Skeleton className="h-4 w-[150px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[100px] mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-6 w-[60px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Add TableSkeleton component
  const TableSkeleton = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>
      <div className="border rounded-lg">
        <div className="p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 py-3">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Add ChartSkeleton component
  const ChartSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[200px] mb-2" />
        <Skeleton className="h-4 w-[300px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
          <div className="border rounded-lg p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-4 py-3">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue="overview"
        value={activeMainTab}
        onValueChange={setActiveMainTab}
      >
        <div className="flex items-center space-x-4 mb-4">
          <TabsList className="grid w-full max-w-[800px] grid-cols-6">
            <TabsTrigger value="overview" className="px-8">
              Overview
            </TabsTrigger>
            <TabsTrigger value="employees" className="px-8">
              Participant List
            </TabsTrigger>
            <TabsTrigger value="tables-charts" className="px-8">
              Tables & Charts
            </TabsTrigger>
            <TabsTrigger value="advanced-search" className="px-8">
              <Search className="w-4 h-4 mr-2" />
              Advanced Search
            </TabsTrigger>
            <TabsTrigger value="import" className="px-8">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </TabsTrigger>
            <TabsTrigger value="archives" className="px-8">
              <Archive className="w-4 h-4 mr-2" />
              Archives
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          {loading ? (
            <OverviewSkeleton />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Total Employees</CardTitle>
                  <CardDescription>Current active employees</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalEmployees}
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Male</span>
                      <span>{stats.sexDistribution?.[0]?.value || 0}</span>
                    </div>
                    <Progress
                      value={
                        (stats.sexDistribution?.[0]?.value /
                          stats.totalEmployees) *
                          100 || 0
                      }
                      className="bg-blue-100"
                      indicatorClassName="bg-blue-500"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span>Female</span>
                      <span>{stats.sexDistribution?.[1]?.value || 0}</span>
                    </div>
                    <Progress
                      value={
                        (stats.sexDistribution?.[1]?.value /
                          stats.totalEmployees) *
                          100 || 0
                      }
                      className="bg-pink-100"
                      indicatorClassName="bg-pink-500"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Departments</CardTitle>
                  <CardDescription>
                    Employee distribution by department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(showAllDepartments
                      ? stats.departments
                      : stats.departments?.slice(0, 5)
                    )?.map(({ name, count }) => (
                      <div
                        key={name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate" title={name}>
                          {name}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                    {stats.departments?.length > 5 && (
                      <Button
                        variant="link"
                        className="p-0 h-auto font-normal"
                        onClick={() =>
                          setShowAllDepartments(!showAllDepartments)
                        }
                      >
                        {showAllDepartments ? "Show Less" : "See More"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Positions</CardTitle>
                  <CardDescription>
                    Employee distribution by position
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(showAllPositions
                      ? stats.positions
                      : stats.positions?.slice(0, 5)
                    )?.map(({ name, count }) => (
                      <div
                        key={name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate" title={name}>
                          {name}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                    {stats.positions?.length > 5 && (
                      <Button
                        variant="link"
                        className="p-0 h-auto font-normal"
                        onClick={() => setShowAllPositions(!showAllPositions)}
                      >
                        {showAllPositions ? "Show Less" : "See More"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Civil Status</CardTitle>
                  <CardDescription>
                    Employee distribution by civil status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(showAllCivilStatus
                      ? stats.civilStatusDistribution
                      : stats.civilStatusDistribution?.slice(0, 5)
                    )?.map(({ name, count }) => (
                      <div
                        key={name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate" title={name}>
                          {name}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                    {stats.civilStatusDistribution?.length > 5 && (
                      <Button
                        variant="link"
                        className="p-0 h-auto font-normal"
                        onClick={() =>
                          setShowAllCivilStatus(!showAllCivilStatus)
                        }
                      >
                        {showAllCivilStatus ? "Show Less" : "See More"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gender</CardTitle>
                  <CardDescription>
                    Employee distribution by gender
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.genderDistribution?.map(({ name, count }) => (
                      <div
                        key={name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate" title={name}>
                          {name}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="employees">
          {loading ? (
            <TableSkeleton />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Participant List</h2>
                <Button onClick={() => setIsAddingEmployee(true)}>
                  Add Participant
                </Button>
              </div>

              <Tabs
                defaultValue="personal"
                value={activeEmployeeTab}
                onValueChange={setActiveEmployeeTab}
                className="w-full"
              >
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
                    onClick={scrollLeft}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div
                    ref={tabListRef}
                    onScroll={handleScroll}
                    className="overflow-x-auto scrollbar-hide mx-8"
                  >
                    <TabsList className="inline-flex min-w-max">
                      <TabsTrigger value="personal">
                        Personal Information
                      </TabsTrigger>
                      <TabsTrigger value="demographics">
                        Demographics
                      </TabsTrigger>
                      <TabsTrigger value="employment">
                        Employment Details
                      </TabsTrigger>
                      <TabsTrigger value="gender">Gender Awareness</TabsTrigger>
                      <TabsTrigger value="family">
                        Family & Financial
                      </TabsTrigger>
                      <TabsTrigger value="children">
                        Children & Family Planning
                      </TabsTrigger>
                      <TabsTrigger value="health">Health & Medical</TabsTrigger>
                      <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
                      <TabsTrigger value="workplace">
                        Workplace Environment
                      </TabsTrigger>
                      <TabsTrigger value="access">
                        Access to Resources
                      </TabsTrigger>
                      <TabsTrigger value="physical">
                        Physical Fitness
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
                    onClick={scrollRight}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <TabsContent value="personal">
                  <PersonalTab
                    employees={employees}
                    loading={loading}
                    onView={handleViewEmployee}
                    onEdit={handleEditEmployee}
                  />
                </TabsContent>

                <TabsContent value="demographics">
                  <DemographicsTab
                    employees={employees}
                    loading={loading}
                    onView={handleViewEmployee}
                    onEdit={handleEditEmployee}
                  />
                </TabsContent>

                <TabsContent value="employment">
                  <EmploymentTab
                    employees={employees}
                    loading={loading}
                    onView={handleViewEmployee}
                    onEdit={handleEditEmployee}
                  />
                </TabsContent>

                <TabsContent value="gender">
                  <GenderAwarenessTab
                    employees={employees}
                    loading={loading}
                    onView={handleViewEmployee}
                    onEdit={handleEditEmployee}
                  />
                </TabsContent>

                <TabsContent value="family">
                  <FamilyFinancialTab
                    employees={employees}
                    loading={loading}
                    onView={handleViewEmployee}
                    onEdit={handleEditEmployee}
                  />
                </TabsContent>

                <TabsContent value="children">
                  <ChildFamPlanTab
                    employees={employees}
                    loading={loading}
                    onView={handleViewEmployee}
                    onEdit={handleEditEmployee}
                  />
                </TabsContent>

                <TabsContent value="health">
                  <HealthMedInfoTab
                    employees={employees}
                    loading={loading}
                    onView={handleViewEmployee}
                    onEdit={handleEditEmployee}
                  />
                </TabsContent>

                <TabsContent value="lifestyle">
                  <LifestyleTab
                    employees={employees}
                    loading={loading}
                    onView={handleViewEmployee}
                    onEdit={handleEditEmployee}
                  />
                </TabsContent>

                <TabsContent value="workplace">
                  <WorkplaceTab
                    employees={employees}
                    loading={loading}
                    onView={handleViewEmployee}
                    onEdit={handleEditEmployee}
                  />
                </TabsContent>

                <TabsContent value="access">
                  <AccessTab
                    employees={employees}
                    loading={loading}
                    onView={handleViewEmployee}
                    onEdit={handleEditEmployee}
                  />
                </TabsContent>

                <TabsContent value="physical">
                  <PhysicalTab
                    employees={employees}
                    loading={loading}
                    onView={handleViewEmployee}
                    onEdit={handleEditEmployee}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tables-charts">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Data Visualization</CardTitle>
                <CardDescription>
                  Comprehensive view of employee data through tables and charts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TablesAndChartsTab employees={tablesAndChartsData} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="advanced-search">
          <AdvancedSearchTab employees={employees} />
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Excel Import</CardTitle>
              <CardDescription>
                Import employee data from Excel or CSV files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExcelImport onImportComplete={fetchEmployees} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archives">
          {archiveLoading ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <Skeleton className="h-6 w-[200px] mb-2" />
                    <Skeleton className="h-4 w-[300px]" />
                  </div>
                  <Skeleton className="h-10 w-[120px]" />
                </div>
              </CardHeader>
              <CardContent>
                <TableSkeleton />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Archived Employees</CardTitle>
                    <CardDescription>
                      View and manage archived employee records
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => handleRestoreAll()}>
                    <Download className="w-4 h-4 mr-2" />
                    Restore All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {archivedEmployees.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    No archived records found
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Archive Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archivedEmployees.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell>{employee.fullName}</TableCell>
                            <TableCell>{employee.department}</TableCell>
                            <TableCell>{employee.position}</TableCell>
                            <TableCell>
                              {new Date(
                                employee.archivedAt
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRestoreEmployee(employee.id)
                                }
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Restore
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Optimize animations */
        @media (prefers-reduced-motion: no-preference) {
          .smooth-scroll {
            scroll-behavior: smooth;
          }
        }

        /* Prevent content shift during scroll */
        .overflow-x-auto {
          overflow-x: auto;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
}
