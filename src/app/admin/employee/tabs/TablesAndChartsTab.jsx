import { useState, useEffect, useMemo, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";

const COLORS = {
  male: "#0088FE", // Blue
  female: "#FF69B4", // Pink
  default: [
    "#8884D8",
    "#82CA9D",
    "#FFC658",
    "#FF7C43",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
  ],
};

const truncateText = (text, maxLength = 20) => {
  if (!text) return "";
  // Handle common abbreviations
  const abbreviations = {
    Department: "Dept.",
    University: "Univ.",
    College: "Col.",
    Professor: "Prof.",
    Administrative: "Admin.",
    Assistant: "Asst.",
    Management: "Mgmt.",
    Development: "Dev.",
    Information: "Info.",
    Technology: "Tech.",
    Sciences: "Sci.",
  };

  // First try to apply abbreviations
  let abbreviated = text;
  Object.entries(abbreviations).forEach(([full, abbr]) => {
    abbreviated = abbreviated.replace(new RegExp(full, "gi"), abbr);
  });

  // If still too long, truncate with ellipsis
  return abbreviated.length > maxLength
    ? `${abbreviated.substring(0, maxLength)}...`
    : abbreviated;
};

const CustomXAxisTick = ({ x, y, payload, verticalLabel }) => {
  const labelLength = payload.value.length;
  const shouldRotate = labelLength > 15 || verticalLabel;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={shouldRotate ? -6 : 16}
        textAnchor={shouldRotate ? "end" : "middle"}
        fill="#666"
        fontSize={12}
        transform={shouldRotate ? "rotate(-45)" : "rotate(0)"}
        title={payload.value} // Native HTML tooltip
      >
        {truncateText(payload.value, shouldRotate ? 25 : 20)}
      </text>
    </g>
  );
};

const CustomYAxisTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dx={-8}
        textAnchor="end"
        fill="#666"
        fontSize={12}
        title={payload.value} // Native HTML tooltip
      >
        {truncateText(payload.value, 25)}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-2 border rounded-lg shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function TablesAndChartsTab({ employees }) {
  const [activeTab, setActiveTab] = useState("demographics");
  const [visibleTables, setVisibleTables] = useState({});
  const [persistedEmployees, setPersistedEmployees] = useState([]);
  const initialDataLoaded = useRef(false);

  const toggleTable = (chartId) => {
    setVisibleTables((prev) => ({
      ...prev,
      [chartId]: !prev[chartId],
    }));
  };

  // Persist employee data on initial load and when it changes meaningfully
  useEffect(() => {
    if (employees?.length > 0 && !initialDataLoaded.current) {
      console.log("Persisting initial employee data:", employees.length);
      setPersistedEmployees(employees);
      initialDataLoaded.current = true;
    }
  }, [employees]);

  // Use persistedEmployees instead of employees prop for calculations
  const stats = useMemo(() => {
    const dataToUse =
      persistedEmployees.length > 0 ? persistedEmployees : employees;
    if (!dataToUse?.length) return null;

    console.log("Calculating stats with data length:", dataToUse.length);

    // Helper function to normalize position names
    const normalizePosition = (position) => {
      if (!position) return "Unspecified";
      // Convert to lowercase for comparison
      const pos = position.toLowerCase().trim();
      // Map of common variations to standardized names
      const positionMap = {
        "cos faculty": "COS Faculty",
        "cos staff": "COS Staff",
        "regular faculty": "Regular Faculty",
        "part time faculty": "Part-time Faculty",
        "part-time faculty": "Part-time Faculty",
        "admin staff": "Administrative Staff",
        "administrative staff": "Administrative Staff",
      };
      return positionMap[pos] || position;
    };

    // Helper function to normalize addresses
    const normalizeAddress = (address) => {
      if (!address) return "Unspecified";

      // Convert to lowercase and trim for comparison
      const addr = address.toLowerCase().trim();

      // Remove common prefixes and standardize separators
      const cleanAddr = addr
        .replace(/^(brgy\.|barangay|brgy)\s*/i, "")
        .replace(/\s*,\s*/g, ", ")
        .trim();

      // Map of common variations to standardized names
      const addressMap = {
        // Zabali variations
        "zabali, baler aurora": "Zabali, Baler, Aurora",
        "zabali baler aurora": "Zabali, Baler, Aurora",
        "zabali, baler": "Zabali, Baler, Aurora",
        "brgy. zabali": "Zabali, Baler, Aurora",
        "barangay zabali": "Zabali, Baler, Aurora",

        // Add more mappings as needed for other common locations
        "baler aurora": "Baler, Aurora",
        "baler, aurora": "Baler, Aurora",
      };

      // Check if we have a direct mapping
      if (addressMap[cleanAddr]) {
        return addressMap[cleanAddr];
      }

      // If no direct mapping, try to standardize the format
      // Split into parts and remove empty/whitespace-only parts
      const parts = cleanAddr
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

      // If we have parts, reconstruct with proper formatting
      if (parts.length > 0) {
        // Capitalize each word in each part
        const formattedParts = parts.map((part) =>
          part
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        );
        return formattedParts.join(", ");
      }

      // If all else fails, return the original address with proper capitalization
      return address
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    };

    // Helper function to calculate age from date of birth
    const calculateAge = (dateOfBirth) => {
      if (!dateOfBirth) return null;
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    };

    // Helper function to group ages into ranges
    const getAgeRange = (age) => {
      if (age === null) return "Unspecified";
      if (age < 25) return "Under 25";
      if (age < 35) return "25-34";
      if (age < 45) return "35-44";
      if (age < 55) return "45-54";
      return "55 and above";
    };

    // Helper function to get birth year
    const getBirthYear = (dateOfBirth) => {
      if (!dateOfBirth) return "Unspecified";
      return new Date(dateOfBirth).getFullYear().toString();
    };

    // Demographics Statistics with enhanced civil status breakdown
    const demographicsStats = {
      sexDistribution: dataToUse.reduce(
        (acc, emp) => {
          const sex = emp.demographics?.sexAtBirth?.toLowerCase();
          if (sex === "male") acc.male++;
          else if (sex === "female") acc.female++;
          return acc;
        },
        { male: 0, female: 0 }
      ),
      // Enhanced civil status with gender breakdown
      civilStatus: dataToUse.reduce((acc, emp) => {
        const status = emp.demographics?.civilStatus || "Unspecified";
        const sex = emp.demographics?.sexAtBirth?.toLowerCase();

        if (!acc[status]) {
          acc[status] = { male: 0, female: 0, total: 0 };
        }

        if (sex === "male") acc[status].male++;
        else if (sex === "female") acc[status].female++;
        acc[status].total++;

        return acc;
      }, {}),
      genderIdentity: dataToUse.reduce((acc, emp) => {
        const gender = emp.demographics?.gender || "Unspecified";
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {}),
      // New PWD statistics
      pwd: dataToUse.reduce((acc, emp) => {
        const isPWD = emp.demographics?.pwd ? "PWD" : "Non-PWD";
        const sex = emp.demographics?.sexAtBirth?.toLowerCase();

        if (!acc[isPWD]) {
          acc[isPWD] = { male: 0, female: 0, total: 0 };
        }

        if (sex === "male") acc[isPWD].male++;
        else if (sex === "female") acc[isPWD].female++;
        acc[isPWD].total++;

        return acc;
      }, {}),
      // PWD Specification breakdown
      pwdSpecification: dataToUse.reduce((acc, emp) => {
        if (!emp.demographics?.pwd) return acc;

        const spec = emp.demographics?.pwdSpecify || "Unspecified";
        const sex = emp.demographics?.sexAtBirth?.toLowerCase();

        if (!acc[spec]) {
          acc[spec] = { male: 0, female: 0, total: 0 };
        }

        if (sex === "male") acc[spec].male++;
        else if (sex === "female") acc[spec].female++;
        acc[spec].total++;

        return acc;
      }, {}),
      // Solo Parent statistics
      soloParent: dataToUse.reduce((acc, emp) => {
        const isSoloParent = emp.demographics?.soloParent
          ? "Solo Parent"
          : "Non-Solo Parent";
        const sex = emp.demographics?.sexAtBirth?.toLowerCase();

        if (!acc[isSoloParent]) {
          acc[isSoloParent] = { male: 0, female: 0, total: 0 };
        }

        if (sex === "male") acc[isSoloParent].male++;
        else if (sex === "female") acc[isSoloParent].female++;
        acc[isSoloParent].total++;

        return acc;
      }, {}),
      // IP statistics
      ip: dataToUse.reduce((acc, emp) => {
        const isIP = emp.demographics?.ip
          ? "Indigenous People"
          : "Non-Indigenous People";
        const sex = emp.demographics?.sexAtBirth?.toLowerCase();

        if (!acc[isIP]) {
          acc[isIP] = { male: 0, female: 0, total: 0 };
        }

        if (sex === "male") acc[isIP].male++;
        else if (sex === "female") acc[isIP].female++;
        acc[isIP].total++;

        return acc;
      }, {}),
      // IP Specification breakdown
      ipSpecification: dataToUse.reduce((acc, emp) => {
        if (!emp.demographics?.ip) return acc;

        const spec = emp.demographics?.ipSpecify || "Unspecified";
        const sex = emp.demographics?.sexAtBirth?.toLowerCase();

        if (!acc[spec]) {
          acc[spec] = { male: 0, female: 0, total: 0 };
        }

        if (sex === "male") acc[spec].male++;
        else if (sex === "female") acc[spec].female++;
        acc[spec].total++;

        return acc;
      }, {}),
    };

    // Personal Information Statistics
    const personalStats = {
      ageDistribution: dataToUse.reduce((acc, emp) => {
        const age = calculateAge(emp.dateOfBirth);
        const ageRange = getAgeRange(age);
        const sex = emp.demographics?.sexAtBirth?.toLowerCase();

        if (!acc[ageRange]) {
          acc[ageRange] = { male: 0, female: 0, total: 0 };
        }

        if (sex === "male") acc[ageRange].male++;
        else if (sex === "female") acc[ageRange].female++;
        acc[ageRange].total++;

        return acc;
      }, {}),

      addressDistribution: dataToUse.reduce((acc, emp) => {
        const rawAddress = emp.address || "Unspecified";
        const address = normalizeAddress(rawAddress);
        const sex = emp.demographics?.sexAtBirth?.toLowerCase();

        if (!acc[address]) {
          acc[address] = { male: 0, female: 0, total: 0 };
        }

        if (sex === "male") acc[address].male++;
        else if (sex === "female") acc[address].female++;
        acc[address].total++;

        return acc;
      }, {}),

      birthYearDistribution: dataToUse.reduce((acc, emp) => {
        const birthYear = getBirthYear(emp.dateOfBirth);
        const sex = emp.demographics?.sexAtBirth?.toLowerCase();

        if (!acc[birthYear]) {
          acc[birthYear] = { male: 0, female: 0, total: 0 };
        }

        if (sex === "male") acc[birthYear].male++;
        else if (sex === "female") acc[birthYear].female++;
        acc[birthYear].total++;

        return acc;
      }, {}),
    };

    // Enhanced Employment Statistics with gender breakdown and position normalization
    const employmentStats = {
      departmentDistribution: dataToUse.reduce((acc, emp) => {
        const dept = emp.employment?.office || "Unspecified";
        const sex = emp.demographics?.sexAtBirth?.toLowerCase();

        if (!acc[dept]) {
          acc[dept] = { male: 0, female: 0, total: 0 };
        }

        if (sex === "male") acc[dept].male++;
        else if (sex === "female") acc[dept].female++;
        acc[dept].total++;

        return acc;
      }, {}),
      positionDistribution: dataToUse.reduce((acc, emp) => {
        const pos = normalizePosition(emp.employment?.eStatus);
        const sex = emp.demographics?.sexAtBirth?.toLowerCase();

        if (!acc[pos]) {
          acc[pos] = { male: 0, female: 0, total: 0 };
        }

        if (sex === "male") acc[pos].male++;
        else if (sex === "female") acc[pos].female++;
        acc[pos].total++;

        return acc;
      }, {}),
      employmentType: dataToUse.reduce((acc, emp) => {
        const type = emp.employment?.assignment || "Unspecified";
        const sex = emp.demographics?.sexAtBirth?.toLowerCase();

        if (!acc[type]) {
          acc[type] = { male: 0, female: 0, total: 0 };
        }

        if (sex === "male") acc[type].male++;
        else if (sex === "female") acc[type].female++;
        acc[type].total++;

        return acc;
      }, {}),
    };

    // Health Statistics with gender breakdown
    const healthStats = {
      healthCondition: dataToUse.reduce((acc, emp) => {
        const condition = emp.health?.healthCondition || "Unspecified";
        const sex = emp.demographics?.sexAtBirth?.toLowerCase();

        if (!acc[condition]) {
          acc[condition] = { male: 0, female: 0, total: 0 };
        }

        if (sex === "male") acc[condition].male++;
        else if (sex === "female") acc[condition].female++;
        acc[condition].total++;

        return acc;
      }, {}),
      insuranceStatus: dataToUse.reduce(
        (acc, emp) => {
          const hasInsurance = emp.health?.hasInsurance;
          const sex = emp.demographics?.sexAtBirth?.toLowerCase();

          if (!acc[hasInsurance ? "insured" : "uninsured"]) {
            acc[hasInsurance ? "insured" : "uninsured"] = {
              male: 0,
              female: 0,
              total: 0,
            };
          }

          if (sex === "male")
            acc[hasInsurance ? "insured" : "uninsured"].male++;
          else if (sex === "female")
            acc[hasInsurance ? "insured" : "uninsured"].female++;
          acc[hasInsurance ? "insured" : "uninsured"].total++;

          return acc;
        },
        {
          insured: { male: 0, female: 0, total: 0 },
          uninsured: { male: 0, female: 0, total: 0 },
        }
      ),
    };

    // Lifestyle Statistics with gender breakdown
    const lifestyleStats = {
      smokers: dataToUse.reduce(
        (acc, emp) => {
          const isSmoker = emp.lifestyle?.smoker;
          const sex = emp.demographics?.sexAtBirth?.toLowerCase();

          if (!acc[isSmoker ? "smokers" : "nonSmokers"]) {
            acc[isSmoker ? "smokers" : "nonSmokers"] = {
              male: 0,
              female: 0,
              total: 0,
            };
          }

          if (sex === "male") acc[isSmoker ? "smokers" : "nonSmokers"].male++;
          else if (sex === "female")
            acc[isSmoker ? "smokers" : "nonSmokers"].female++;
          acc[isSmoker ? "smokers" : "nonSmokers"].total++;

          return acc;
        },
        {
          smokers: { male: 0, female: 0, total: 0 },
          nonSmokers: { male: 0, female: 0, total: 0 },
        }
      ),
      drinkers: dataToUse.reduce(
        (acc, emp) => {
          const isDrinker = emp.lifestyle?.drinker;
          const sex = emp.demographics?.sexAtBirth?.toLowerCase();

          if (!acc[isDrinker ? "drinkers" : "nonDrinkers"]) {
            acc[isDrinker ? "drinkers" : "nonDrinkers"] = {
              male: 0,
              female: 0,
              total: 0,
            };
          }

          if (sex === "male")
            acc[isDrinker ? "drinkers" : "nonDrinkers"].male++;
          else if (sex === "female")
            acc[isDrinker ? "drinkers" : "nonDrinkers"].female++;
          acc[isDrinker ? "drinkers" : "nonDrinkers"].total++;

          return acc;
        },
        {
          drinkers: { male: 0, female: 0, total: 0 },
          nonDrinkers: { male: 0, female: 0, total: 0 },
        }
      ),
      exerciseFrequency: dataToUse.reduce((acc, emp) => {
        const freq = emp.lifestyle?.exerciseFrequency || "Unspecified";
        const sex = emp.demographics?.sexAtBirth?.toLowerCase();

        if (!acc[freq]) {
          acc[freq] = { male: 0, female: 0, total: 0 };
        }

        if (sex === "male") acc[freq].male++;
        else if (sex === "female") acc[freq].female++;
        acc[freq].total++;

        return acc;
      }, {}),
    };

    return {
      personal: personalStats,
      demographics: demographicsStats,
      employment: employmentStats,
      health: healthStats,
      lifestyle: lifestyleStats,
    };
  }, [persistedEmployees, employees]);

  // Convert object data to array format for charts
  const chartData = useMemo(() => {
    if (!stats) return {};

    // Transform civil status data for stacked bar chart
    const civilStatusData = Object.entries(stats.demographics.civilStatus)
      .map(([status, data]) => ({
        name: status,
        Male: data.male,
        Female: data.female,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total); // Sort by total count

    return {
      personal: {
        age: Object.entries(stats.personal.ageDistribution)
          .map(([range, data]) => ({
            name: range,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => {
            // Custom sort for age ranges
            const ageOrder = {
              "Under 25": 1,
              "25-34": 2,
              "35-44": 3,
              "45-54": 4,
              "55 and above": 5,
              Unspecified: 6,
            };
            return ageOrder[a.name] - ageOrder[b.name];
          }),

        address: Object.entries(stats.personal.addressDistribution)
          .map(([address, data]) => ({
            name: address,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => b.total - a.total),

        birthYear: Object.entries(stats.personal.birthYearDistribution)
          .map(([year, data]) => ({
            name: year,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      },
      demographics: {
        sex: [
          {
            name: "Male",
            value: stats.demographics.sexDistribution.male,
            color: COLORS.male,
          },
          {
            name: "Female",
            value: stats.demographics.sexDistribution.female,
            color: COLORS.female,
          },
        ],
        civilStatus: civilStatusData,
        genderIdentity: Object.entries(stats.demographics.genderIdentity).map(
          ([name, value]) => ({
            name,
            value,
          })
        ),
        pwd: Object.entries(stats.demographics.pwd)
          .map(([name, data]) => ({
            name,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => b.total - a.total),
        pwdSpecification: Object.entries(stats.demographics.pwdSpecification)
          .map(([name, data]) => ({
            name,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => b.total - a.total),
        soloParent: Object.entries(stats.demographics.soloParent)
          .map(([name, data]) => ({
            name,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => b.total - a.total),
        ip: Object.entries(stats.demographics.ip)
          .map(([name, data]) => ({
            name,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => b.total - a.total),
        ipSpecification: Object.entries(stats.demographics.ipSpecification)
          .map(([name, data]) => ({
            name,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => b.total - a.total),
      },
      employment: {
        departments: Object.entries(stats.employment.departmentDistribution)
          .map(([name, data]) => ({
            name,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => b.total - a.total),
        positions: Object.entries(stats.employment.positionDistribution)
          .map(([name, data]) => ({
            name,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => b.total - a.total),
        types: Object.entries(stats.employment.employmentType)
          .map(([name, data]) => ({
            name,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => b.total - a.total),
      },
      health: {
        conditions: Object.entries(stats.health.healthCondition)
          .map(([name, data]) => ({
            name,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => b.total - a.total),
        insurance: Object.entries(stats.health.insuranceStatus)
          .map(([name, data]) => ({
            name,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => b.total - a.total),
      },
      lifestyle: {
        smoking: Object.entries(stats.lifestyle.smokers)
          .map(([name, data]) => ({
            name,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => b.total - a.total),
        drinking: Object.entries(stats.lifestyle.drinkers)
          .map(([name, data]) => ({
            name,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => b.total - a.total),
        exercise: Object.entries(stats.lifestyle.exerciseFrequency)
          .map(([name, data]) => ({
            name,
            Male: data.male,
            Female: data.female,
            total: data.total,
          }))
          .sort((a, b) => b.total - a.total),
      },
    };
  }, [stats]);

  const renderPieChart = (data, title, chartId) => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleTable(chartId)}
          >
            {visibleTables[chartId] ? "Hide Table" : "See Table"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  truncateText(`${name} (${(percent * 100).toFixed(0)}%)`, 20)
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.color ||
                      COLORS.default[index % COLORS.default.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {visibleTables[chartId] && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.value}</TableCell>
                    <TableCell>
                      {(
                        (item.value /
                          data.reduce((sum, d) => sum + d.value, 0)) *
                        100
                      ).toFixed(1)}
                      %
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted">
                  <TableCell>Total</TableCell>
                  <TableCell>
                    {data.reduce((sum, item) => sum + item.value, 0)}
                  </TableCell>
                  <TableCell>100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStackedBarChart = (data, title, chartId) => {
    const totalMale = data.reduce((sum, item) => sum + item.Male, 0);
    const totalFemale = data.reduce((sum, item) => sum + item.Female, 0);
    const grandTotal = totalMale + totalFemale;

    const chartHeight = Math.max(400, data.length * 40); // Dynamic height based on data points

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleTable(chartId)}
            >
              {visibleTables[chartId] ? "Hide Table" : "See Table"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[400px] overflow-y-auto overflow-x-hidden">
            <div style={{ height: `${chartHeight}px`, minHeight: "400px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={
                      <CustomXAxisTick
                        verticalLabel={data.some((d) => d.name.length > 15)}
                      />
                    }
                    interval={0}
                    height={60}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Male" stackId="gender" fill={COLORS.male} />
                  <Bar dataKey="Female" stackId="gender" fill={COLORS.female} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {visibleTables[chartId] && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Civil Status</TableHead>
                    <TableHead>Male</TableHead>
                    <TableHead>Female</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((status) => (
                    <TableRow key={status.name}>
                      <TableCell>{status.name}</TableCell>
                      <TableCell>{status.Male}</TableCell>
                      <TableCell>{status.Female}</TableCell>
                      <TableCell>{status.total}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted">
                    <TableCell>Total</TableCell>
                    <TableCell>{totalMale}</TableCell>
                    <TableCell>{totalFemale}</TableCell>
                    <TableCell>{grandTotal}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderBarChart = (data, title, chartId) => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleTable(chartId)}
          >
            {visibleTables[chartId] ? "Hide Table" : "See Table"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[300px] overflow-y-auto overflow-x-hidden">
          <div
            style={{
              height: `${Math.max(300, data.length * 40)}px`,
              minHeight: "300px",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={
                    <CustomXAxisTick
                      verticalLabel={data.some((d) => d.name.length > 15)}
                    />
                  }
                  interval={0}
                  height={60}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {visibleTables[chartId] && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.value}</TableCell>
                    <TableCell>
                      {(
                        (item.value /
                          data.reduce((sum, d) => sum + d.value, 0)) *
                        100
                      ).toFixed(1)}
                      %
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted">
                  <TableCell>Total</TableCell>
                  <TableCell>
                    {data.reduce((sum, item) => sum + item.value, 0)}
                  </TableCell>
                  <TableCell>100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStackedBarChartHorizontal = (data, title, chartId) => {
    const totalMale = data.reduce((sum, item) => sum + item.Male, 0);
    const totalFemale = data.reduce((sum, item) => sum + item.Female, 0);
    const grandTotal = totalMale + totalFemale;

    const chartHeight = Math.max(400, data.length * 40); // Increased height per item
    const labelNeedsRotation = false; // Horizontal bars don't need label rotation

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleTable(chartId)}
            >
              {visibleTables[chartId] ? "Hide Table" : "See Table"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[400px] overflow-y-auto overflow-x-hidden">
            <div style={{ height: `${chartHeight}px`, minHeight: "400px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{
                    left: 150, // Increased left margin for labels
                    right: 20,
                    top: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={140}
                    tick={<CustomYAxisTick />}
                    interval={0}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Male" fill={COLORS.male} />
                  <Bar dataKey="Female" fill={COLORS.female} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {visibleTables[chartId] && (
            <div className="border rounded-lg">
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky top-0 bg-background min-w-[200px]">
                        {title.split(" ")[0]}
                      </TableHead>
                      <TableHead className="sticky top-0 bg-background text-right min-w-[100px]">
                        Male
                      </TableHead>
                      <TableHead className="sticky top-0 bg-background text-right min-w-[100px]">
                        Female
                      </TableHead>
                      <TableHead className="sticky top-0 bg-background text-right min-w-[100px]">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.Male}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.Female}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.total}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t">
                <Table>
                  <TableBody>
                    <TableRow className="font-bold bg-muted">
                      <TableCell className="font-medium">Total</TableCell>
                      <TableCell className="text-right min-w-[100px]">
                        {totalMale}
                      </TableCell>
                      <TableCell className="text-right min-w-[100px]">
                        {totalFemale}
                      </TableCell>
                      <TableCell className="text-right min-w-[100px]">
                        {grandTotal}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderStackedBarChartVertical = (data, title, chartId) => {
    const totalMale = data.reduce((sum, item) => sum + item.Male, 0);
    const totalFemale = data.reduce((sum, item) => sum + item.Female, 0);
    const grandTotal = totalMale + totalFemale;

    const chartHeight = Math.max(400, data.length * 40); // Dynamic height based on data points

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleTable(chartId)}
            >
              {visibleTables[chartId] ? "Hide Table" : "See Table"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[400px] overflow-y-auto overflow-x-hidden">
            <div style={{ height: `${chartHeight}px`, minHeight: "400px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={<CustomYAxisTick />}
                    interval={0}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Male" stackId="gender" fill={COLORS.male} />
                  <Bar dataKey="Female" stackId="gender" fill={COLORS.female} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {visibleTables[chartId] && (
            <div className="border rounded-lg">
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky top-0 bg-background min-w-[200px]">
                        {title.split(" ")[0]}
                      </TableHead>
                      <TableHead className="sticky top-0 bg-background text-right min-w-[100px]">
                        Male
                      </TableHead>
                      <TableHead className="sticky top-0 bg-background text-right min-w-[100px]">
                        Female
                      </TableHead>
                      <TableHead className="sticky top-0 bg-background text-right min-w-[100px]">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.Male}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.Female}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.total}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t">
                <Table>
                  <TableBody>
                    <TableRow className="font-bold bg-muted">
                      <TableCell className="font-medium">Total</TableCell>
                      <TableCell className="text-right min-w-[100px]">
                        {totalMale}
                      </TableCell>
                      <TableCell className="text-right min-w-[100px]">
                        {totalFemale}
                      </TableCell>
                      <TableCell className="text-right min-w-[100px]">
                        {grandTotal}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex-wrap h-auto">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {renderStackedBarChartHorizontal(
              chartData.personal?.age || [],
              "Age Distribution",
              "personal-age"
            )}
            {renderStackedBarChartVertical(
              chartData.personal?.address || [],
              "Address Distribution",
              "personal-address"
            )}
            {renderStackedBarChartVertical(
              chartData.personal?.birthYear || [],
              "Birth Year Distribution",
              "personal-birth-year"
            )}
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderPieChart(
              chartData.demographics?.sex || [],
              "Sex Distribution",
              "demographics-sex"
            )}
            {renderStackedBarChart(
              chartData.demographics?.civilStatus || [],
              "Civil Status Distribution by Gender",
              "demographics-civil-status"
            )}
            {renderPieChart(
              chartData.demographics?.genderIdentity || [],
              "Gender Identity Distribution",
              "demographics-gender"
            )}
            {renderStackedBarChartHorizontal(
              chartData.demographics?.pwd || [],
              "PWD Status Distribution",
              "demographics-pwd"
            )}
            {renderStackedBarChartVertical(
              chartData.demographics?.pwdSpecification || [],
              "PWD Specification Distribution",
              "demographics-pwd-spec"
            )}
            {renderStackedBarChartHorizontal(
              chartData.demographics?.soloParent || [],
              "Solo Parent Status Distribution",
              "demographics-solo-parent"
            )}
            {renderStackedBarChartHorizontal(
              chartData.demographics?.ip || [],
              "Indigenous People Status Distribution",
              "demographics-ip"
            )}
            {renderStackedBarChartVertical(
              chartData.demographics?.ipSpecification || [],
              "Indigenous People Group Distribution",
              "demographics-ip-spec"
            )}
          </div>
        </TabsContent>

        <TabsContent value="employment" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {renderStackedBarChartVertical(
              chartData.employment?.departments || [],
              "Department Distribution",
              "employment-departments"
            )}
            {renderStackedBarChartVertical(
              chartData.employment?.positions || [],
              "Position Distribution",
              "employment-positions"
            )}
            {renderStackedBarChartHorizontal(
              chartData.employment?.types || [],
              "Employment Type Distribution",
              "employment-types"
            )}
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderStackedBarChartVertical(
              chartData.health?.conditions || [],
              "Health Conditions",
              "health-conditions"
            )}
            {renderStackedBarChartHorizontal(
              chartData.health?.insurance || [],
              "Insurance Status",
              "health-insurance"
            )}
          </div>
        </TabsContent>

        <TabsContent value="lifestyle" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderStackedBarChartHorizontal(
              chartData.lifestyle?.smoking || [],
              "Smoking Status",
              "lifestyle-smoking"
            )}
            {renderStackedBarChartHorizontal(
              chartData.lifestyle?.drinking || [],
              "Drinking Status",
              "lifestyle-drinking"
            )}
            {renderStackedBarChartVertical(
              chartData.lifestyle?.exercise || [],
              "Exercise Frequency",
              "lifestyle-exercise"
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
