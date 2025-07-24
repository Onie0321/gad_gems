import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const filterOptions = {
  demographics: {
    sexAtBirth: ["Male", "Female"],
    civilStatus: ["Single", "Married", "Widowed", "Separated", "Others"],
    gender: ["Male", "Female", "Non-binary", "Others"],
    nonHeterosexual: ["Yes", "No"],
    pwd: ["Yes", "No"],
    soloParent: ["Yes", "No"],
    ip: ["Yes", "No"],
  },
  employment: {
    office: ["IT", "HR", "Finance", "Operations", "Others"],
    eStatus: ["Regular", "Contractual", "Part-time", "Others"],
    employmentType: ["Full-time", "Part-time", "Project-based"],
  },
  gender: {
    awareGadAct: ["Yes", "No"],
    participateGadAct: ["Yes", "No"],
    awareGadFbPage: ["Yes", "No"],
    visitedGadFbPage: ["Yes", "No"],
    awareLaws: ["Yes", "No"],
  },
  family: {
    monthlyIncome: ["Below 10k", "10k-20k", "20k-30k", "30k-40k", "Above 40k"],
    breadwinner: ["Yes", "No"],
  },
  children: {
    hasChildren: ["Yes", "No"],
    planningMore: ["Yes", "No"],
  },
  health: {
    healthCondition: ["Excellent", "Good", "Fair", "Poor"],
    hasInsurance: ["Yes", "No"],
  },
  lifestyle: {
    smoker: ["Yes", "No"],
    drinker: ["Yes", "No"],
    exerciseFrequency: ["Daily", "Weekly", "Monthly", "Never"],
  },
  workplace: {
    satisfaction: ["High", "Medium", "Low"],
    stressLevel: ["High", "Medium", "Low"],
  },
  access: {
    hasInternet: ["Yes", "No"],
    hasComputer: ["Yes", "No"],
  },
  physical: {
    fitnessLevel: ["Excellent", "Good", "Fair", "Poor"],
    hasDisability: ["Yes", "No"],
  },
  age: {
    ranges: ["18-25", "26-35", "36-45", "46-55", "56+"],
  },
};

// Add this utility function at the top of the file, before the component
const searchInObject = (obj, searchTerms) => {
  const searchIn = (value) => {
    if (value === null || value === undefined) return false;

    if (typeof value === "object") {
      return Object.values(value).some((v) => searchIn(v));
    }

    const stringValue = String(value).toLowerCase();
    return searchTerms.some((term) => stringValue.includes(term));
  };

  return searchIn(obj);
};

// Add debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function AdvancedSearchTab({ employees }) {
  const [activeTab, setActiveTab] = useState("personal");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selections, setSelections] = useState({
    demographics: {
      sexAtBirth: "",
      civilStatus: "",
      gender: "",
      nonHeterosexual: "",
      pwd: "",
      pwdSpecify: "",
      soloParent: "",
      ip: "",
      ipSpecify: "",
      year: "",
    },
    employment: {
      office: "",
      eStatus: "",
      assignment: "",
    },
    gender: {
      awareGadAct: "",
      awareGadSpecify: "",
      participateGadAct: "",
      awareGadFbPage: "",
      visitedGadFbPage: "",
      year: "",
      awareLaws: "",
    },
    family: {
      monthlyIncome: "",
      breadwinner: "",
    },
    children: {
      hasChildren: "",
      planningMore: "",
    },
    health: {
      healthCondition: "",
      hasInsurance: "",
    },
    lifestyle: {
      smoker: "",
      drinker: "",
      exerciseFrequency: "",
    },
    workplace: {
      satisfaction: "",
      stressLevel: "",
    },
    access: {
      hasInternet: "",
      hasComputer: "",
    },
    physical: {
      fitnessLevel: "",
      hasDisability: "",
    },
    age: {
      range: "",
    },
  });

  // Add new state for search performance optimization
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Add useCallback for memoized search function
  const performSearch = useCallback((query, data) => {
    if (!query.trim()) return data;

    const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

    return data.filter((employee) => {
      // Create a flattened search object with all relevant fields
      const searchableData = {
        id: employee.employeeId,
        name: employee.fullName,
        personal: {
          contact: employee.contactNumber,
          email: employee.emailAddress,
          birth: employee.dateOfBirth,
          age: employee.age,
        },
        demographics: employee.demographics,
        employment: employee.employment,
        gender: employee.gender,
        family: employee.family,
        children: employee.children,
        health: employee.health,
        lifestyle: employee.lifestyle,
        workplace: employee.workplace,
        access: employee.access,
        physical: employee.physical,
      };

      return searchInObject(searchableData, searchTerms);
    });
  }, []);

  // Add debounced search effect
  useEffect(() => {
    const debouncedSearch = debounce((value) => {
      setDebouncedSearchQuery(value);
    }, 300);

    debouncedSearch(searchQuery);

    return () => debouncedSearch.cancel;
  }, [searchQuery]);

  // Modify the existing filter effect to use the new search logic
  useEffect(() => {
    let filtered = [...employees];

    // Apply text search across all fields using the new search function
    if (debouncedSearchQuery) {
      filtered = performSearch(debouncedSearchQuery, filtered);
    }

    // Apply active filters (keep existing filter logic)
    Object.entries(activeFilters).forEach(([category, filters]) => {
      Object.entries(filters).forEach(([field, value]) => {
        filtered = filtered.filter((employee) => {
          if (category === "age") {
            const age = parseInt(employee.age);
            const [min, max] = value
              .split("-")
              .map((num) => (num === "+" ? Infinity : parseInt(num)));
            return age >= min && age <= (max || Infinity);
          }

          const fieldValue =
            category === "demographics"
              ? employee.demographics?.[field]
              : category === "employment"
              ? employee.employment?.[field]
              : employee[field];

          return (
            String(fieldValue).toLowerCase() === String(value).toLowerCase()
          );
        });
      });
    });

    setFilteredData(filtered);
  }, [employees, debouncedSearchQuery, activeFilters, performSearch]);

  const addFilter = (category, field, value) => {
    setActiveFilters((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [field]: value,
      },
    }));
    setSelectedFilters((prev) => [...prev, { category, field, value }]);
    setSelections((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const removeFilter = (category, field) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      if (newFilters[category]) {
        delete newFilters[category][field];
        if (Object.keys(newFilters[category]).length === 0) {
          delete newFilters[category];
        }
      }
      return newFilters;
    });
    setSelectedFilters((prev) =>
      prev.filter((f) => !(f.category === category && f.field === field))
    );
    setSelections((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: "",
      },
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setSelectedFilters([]);
    setSelections({
      demographics: {
        sexAtBirth: "",
        civilStatus: "",
        gender: "",
        nonHeterosexual: "",
        pwd: "",
        pwdSpecify: "",
        soloParent: "",
        ip: "",
        ipSpecify: "",
        year: "",
      },
      employment: {
        office: "",
        eStatus: "",
        employmentType: "",
      },
      gender: {
        awareGadAct: "",
        awareGadSpecify: "",
        participateGadAct: "",
        awareGadFbPage: "",
        visitedGadFbPage: "",
        year: "",
        awareLaws: "",
      },
      family: {
        monthlyIncome: "",
        breadwinner: "",
      },
      children: {
        hasChildren: "",
        planningMore: "",
      },
      health: {
        healthCondition: "",
        hasInsurance: "",
      },
      lifestyle: {
        smoker: "",
        drinker: "",
        exerciseFrequency: "",
      },
      workplace: {
        satisfaction: "",
        stressLevel: "",
      },
      access: {
        hasInternet: "",
        hasComputer: "",
      },
      physical: {
        fitnessLevel: "",
        hasDisability: "",
      },
      age: {
        range: "",
      },
    });
  };

  const renderFilterCard = (category, title, fields) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(fields).map(([field, options]) => (
          <Select
            key={field}
            value={selections[category]?.[field] || ""}
            onValueChange={(value) => addFilter(category, field, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Search</CardTitle>
          <CardDescription>
            Search and filter employee records. Use multiple words to search
            across all fields.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Enhanced Search Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by any keyword (e.g. 'john hr manager')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Enter multiple keywords to find matches across all fields
              </p>
            </div>

            {/* Tabs for different categories */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full flex-wrap h-auto">
                <TabsTrigger value="personal">Personal Information</TabsTrigger>
                <TabsTrigger value="demographics">Demographics</TabsTrigger>
                <TabsTrigger value="employment">Employment Details</TabsTrigger>
                <TabsTrigger value="gender">Gender Awareness</TabsTrigger>
                <TabsTrigger value="family">Family & Financial</TabsTrigger>
                <TabsTrigger value="children">
                  Children & Family Planning
                </TabsTrigger>
                <TabsTrigger value="health">Health & Medical</TabsTrigger>
                <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
                <TabsTrigger value="workplace">
                  Workplace Environment
                </TabsTrigger>
                <TabsTrigger value="access">Access to Resources</TabsTrigger>
                <TabsTrigger value="physical">Physical Fitness</TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <TabsContent value="demographics" className="m-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderFilterCard(
                      "demographics",
                      "Demographics",
                      filterOptions.demographics
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="employment" className="m-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderFilterCard(
                      "employment",
                      "Employment",
                      filterOptions.employment
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="gender" className="m-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderFilterCard("gender", "Gender", filterOptions.gender)}
                  </div>
                </TabsContent>

                <TabsContent value="family" className="m-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderFilterCard(
                      "family",
                      "Family & Financial",
                      filterOptions.family
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="children" className="m-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderFilterCard(
                      "children",
                      "Children & Family Planning",
                      filterOptions.children
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="health" className="m-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderFilterCard(
                      "health",
                      "Health & Medical",
                      filterOptions.health
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="lifestyle" className="m-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderFilterCard(
                      "lifestyle",
                      "Lifestyle",
                      filterOptions.lifestyle
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="workplace" className="m-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderFilterCard(
                      "workplace",
                      "Workplace Environment",
                      filterOptions.workplace
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="access" className="m-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderFilterCard(
                      "access",
                      "Access to Resources",
                      filterOptions.access
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="physical" className="m-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderFilterCard(
                      "physical",
                      "Physical Fitness",
                      filterOptions.physical
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* Active Filters */}
            {selectedFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4">
                {selectedFilters.map(({ category, field, value }, index) => (
                  <Badge
                    key={`${category}-${field}-${index}`}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {field}: {value}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeFilter(category, field)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <CardDescription>
            Found {filteredData.length} matching records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  {activeTab === "personal" && (
                    <>
                      <TableHead>Contact Number</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Birth Date</TableHead>
                      <TableHead>Age</TableHead>
                    </>
                  )}
                  {activeTab === "demographics" && (
                    <>
                      <TableHead>Sex at Birth</TableHead>
                      <TableHead>Civil Status</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Non-Heterosexual</TableHead>
                      <TableHead>PWD</TableHead>
                      <TableHead>PWD Specification</TableHead>
                      <TableHead>Solo Parent</TableHead>
                      <TableHead>Indigenous People</TableHead>
                      <TableHead>IP Group</TableHead>
                      <TableHead>Year</TableHead>
                    </>
                  )}
                  {activeTab === "employment" && (
                    <>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Assignment</TableHead>
                    </>
                  )}
                  {activeTab === "gender" && (
                    <>
                      <TableHead>Aware of GAD Activities</TableHead>
                      <TableHead>GAD Activities Specification</TableHead>
                      <TableHead>Participated in GAD Activities</TableHead>
                      <TableHead>Aware of GAD Facebook Page</TableHead>
                      <TableHead>Visited GAD Facebook Page</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Aware of Laws</TableHead>
                    </>
                  )}
                  {activeTab === "family" && (
                    <>
                      <TableHead>Monthly Income</TableHead>
                      <TableHead>Breadwinner</TableHead>
                      <TableHead>Dependents</TableHead>
                    </>
                  )}
                  {activeTab === "children" && (
                    <>
                      <TableHead>Has Children</TableHead>
                      <TableHead>Number of Children</TableHead>
                      <TableHead>Planning More</TableHead>
                    </>
                  )}
                  {activeTab === "health" && (
                    <>
                      <TableHead>Health Condition</TableHead>
                      <TableHead>Has Insurance</TableHead>
                      <TableHead>Medical History</TableHead>
                    </>
                  )}
                  {activeTab === "lifestyle" && (
                    <>
                      <TableHead>Smoker</TableHead>
                      <TableHead>Drinker</TableHead>
                      <TableHead>Exercise Frequency</TableHead>
                    </>
                  )}
                  {activeTab === "workplace" && (
                    <>
                      <TableHead>Satisfaction Level</TableHead>
                      <TableHead>Stress Level</TableHead>
                      <TableHead>Work Environment</TableHead>
                    </>
                  )}
                  {activeTab === "access" && (
                    <>
                      <TableHead>Has Internet</TableHead>
                      <TableHead>Has Computer</TableHead>
                      <TableHead>Resource Access</TableHead>
                    </>
                  )}
                  {activeTab === "physical" && (
                    <>
                      <TableHead>Fitness Level</TableHead>
                      <TableHead>Has Disability</TableHead>
                      <TableHead>Physical Condition</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((employee) => (
                  <TableRow key={employee.employeeId}>
                    <TableCell>{employee.employeeId}</TableCell>
                    <TableCell>{employee.fullName}</TableCell>
                    {activeTab === "personal" && (
                      <>
                        <TableCell>{employee.contactNumber || "-"}</TableCell>
                        <TableCell>{employee.emailAddress || "-"}</TableCell>
                        <TableCell>{employee.dateOfBirth || "-"}</TableCell>
                        <TableCell>{employee.age || "-"}</TableCell>
                      </>
                    )}
                    {activeTab === "demographics" && (
                      <>
                        <TableCell>
                          {employee.demographics?.sexAtBirth || "-"}
                        </TableCell>
                        <TableCell>
                          {employee.demographics?.civilStatus || "-"}
                        </TableCell>
                        <TableCell>
                          {employee.demographics?.gender || "-"}
                        </TableCell>
                        <TableCell>
                          {employee.demographics?.nonHeterosexual
                            ? "Yes"
                            : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.demographics?.pwd ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.demographics?.pwdSpecify || "-"}
                        </TableCell>
                        <TableCell>
                          {employee.demographics?.soloParent ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.demographics?.ip ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.demographics?.ipSpecify || "-"}
                        </TableCell>
                        <TableCell>
                          {employee.demographics?.year || "-"}
                        </TableCell>
                      </>
                    )}
                    {activeTab === "employment" && (
                      <>
                        <TableCell>
                          {employee.employment?.office || "-"}
                        </TableCell>
                        <TableCell>
                          {employee.employment?.eStatus || "-"}
                        </TableCell>
                        <TableCell>
                          {employee.employment?.assignment || "-"}
                        </TableCell>
                      </>
                    )}
                    {activeTab === "gender" && (
                      <>
                        <TableCell>
                          {employee.gender?.awareGadAct ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.gender?.awareGadSpecify || "-"}
                        </TableCell>
                        <TableCell>
                          {employee.gender?.participateGadAct ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.gender?.awareGadFbPage ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.gender?.visitedGadFbPage ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>{employee.gender?.year || "-"}</TableCell>
                        <TableCell>
                          {employee.gender?.awareLaws || "-"}
                        </TableCell>
                      </>
                    )}
                    {activeTab === "family" && (
                      <>
                        <TableCell>
                          {employee.family?.monthlyIncome || "-"}
                        </TableCell>
                        <TableCell>
                          {employee.family?.breadwinner ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.family?.dependents || "-"}
                        </TableCell>
                      </>
                    )}
                    {activeTab === "children" && (
                      <>
                        <TableCell>
                          {employee.children?.hasChildren ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.children?.numberOfChildren || "-"}
                        </TableCell>
                        <TableCell>
                          {employee.children?.planningMore ? "Yes" : "No"}
                        </TableCell>
                      </>
                    )}
                    {activeTab === "health" && (
                      <>
                        <TableCell>
                          {employee.health?.healthCondition || "-"}
                        </TableCell>
                        <TableCell>
                          {employee.health?.hasInsurance ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.health?.medicalHistory || "-"}
                        </TableCell>
                      </>
                    )}
                    {activeTab === "lifestyle" && (
                      <>
                        <TableCell>
                          {employee.lifestyle?.smoker ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.lifestyle?.drinker ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.lifestyle?.exerciseFrequency || "-"}
                        </TableCell>
                      </>
                    )}
                    {activeTab === "workplace" && (
                      <>
                        <TableCell>
                          {employee.workplace?.satisfaction || "-"}
                        </TableCell>
                        <TableCell>
                          {employee.workplace?.stressLevel || "-"}
                        </TableCell>
                        <TableCell>
                          {employee.workplace?.environment || "-"}
                        </TableCell>
                      </>
                    )}
                    {activeTab === "access" && (
                      <>
                        <TableCell>
                          {employee.access?.hasInternet ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.access?.hasComputer ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.access?.resourceAccess || "-"}
                        </TableCell>
                      </>
                    )}
                    {activeTab === "physical" && (
                      <>
                        <TableCell>
                          {employee.physical?.fitnessLevel || "-"}
                        </TableCell>
                        <TableCell>
                          {employee.physical?.hasDisability ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {employee.physical?.condition || "-"}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
