"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllEventsAndParticipants } from "@/lib/appwrite";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import stringSimilarity from "string-similarity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function SearchFilter({ activeTab }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    eventType: "all",
    sexAtBirth: "all",
    ethnicGroup: "all",
    participantType: "all",
  });
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    eventTypes: [],
    ethnicGroups: [],
    genderDistribution: [],
    ageGroups: [],
    participantTypes: [],
    organizationDistribution: [],
  });
  const [searchTerms, setSearchTerms] = useState([]);
  const [searchMode, setSearchMode] = useState("simple");
  const [hasSearched, setHasSearched] = useState(false);
  const [processedQuery, setProcessedQuery] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState("students");
  const [collectionFilters, setCollectionFilters] = useState({
    students: {
      course: "all",
      yearLevel: "all",
      section: "all",
      college: "all",
    },
    staffFaculty: {
      department: "all",
      position: "all",
      employmentStatus: "all",
    },
    community: {
      occupation: "all",
      residentialStatus: "all",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllEventsAndParticipants();
        setEvents(data.events);
        setParticipants(data.participants);
        processChartData(data.events, data.participants);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const eventColumns = [
    { accessorKey: "eventName", header: "Event Name" },
    { accessorKey: "eventType", header: "Event Type" },
    { accessorKey: "eventDate", header: "Date" },
    { accessorKey: "eventVenue", header: "Venue" },
  ];

  const participantColumns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "sex", header: "Sex at Birth" },
    { accessorKey: "ethnicGroup", header: "Ethnic Group" },
    { accessorKey: "age", header: "Age" },
  ];

  const processSearchTerms = (input) => {
    return input
      .toLowerCase()
      .split(/[\s,;]+/)
      .filter((term) => term.length > 0);
  };

  const matchesSearchTerms = (text, terms, threshold = 0.4) => {
    if (!text) return false;
    text = text.toLowerCase();

    if (terms.some((term) => text.includes(term))) return true;

    return terms.some((term) => {
      const words = text.split(/\s+/);
      return words.some(
        (word) => stringSimilarity.compareTwoStrings(word, term) > threshold
      );
    });
  };

  const getFilteredEvents = () => {
    if (!searchTerm) return events;

    const terms =
      searchMode === "advanced"
        ? processSearchTerms(searchTerm)
        : [searchTerm.toLowerCase()];

    return events.filter((event) => {
      if (searchMode === "simple") {
        return (
          event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (filters.eventType === "all" || event.eventType === filters.eventType)
        );
      }

      const fieldsToSearch = [
        event.eventName,
        event.eventType,
        event.eventVenue,
        event.eventDate,
      ];

      return (
        fieldsToSearch.some((field) => matchesSearchTerms(field, terms)) &&
        (filters.eventType === "all" || event.eventType === filters.eventType)
      );
    });
  };

  const getFilteredParticipants = () => {
    if (!searchTerm) return participants;

    const terms =
      searchMode === "advanced"
        ? processSearchTerms(searchTerm)
        : [searchTerm.toLowerCase()];

    // Filter participants based on collection type first
    let collectionParticipants = participants;

    // Apply participant type filter if not set to "all"
    if (filters.participantType !== "all") {
      collectionParticipants = collectionParticipants.filter(
        (p) =>
          p.participantType?.toLowerCase() ===
          filters.participantType.toLowerCase()
      );
    }

    // Apply text search and other filters
    return collectionParticipants.filter((participant) => {
      // Apply common filters
      const matchesGender =
        filters.sexAtBirth === "all" || participant.sex === filters.sexAtBirth;
      const matchesEthnic =
        filters.ethnicGroup === "all" ||
        participant.ethnicGroup === filters.ethnicGroup;

      // Apply text search
      if (searchMode === "simple") {
        return (
          (participant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            participant.organization
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            participant.occupation
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            participant.eventName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())) &&
          matchesGender &&
          matchesEthnic
        );
      }

      // For advanced search, search across all fields
      const fieldsToSearch = [
        participant.name,
        participant.ethnicGroup,
        participant.sex,
        participant.age?.toString(),
        participant.participantType,
        participant.organization,
        participant.occupation,
        participant.eventName,
      ];

      return (
        fieldsToSearch.some(
          (field) => field && matchesSearchTerms(field, terms)
        ) &&
        matchesGender &&
        matchesEthnic
      );
    });
  };

  const handleExport = () => {
    const dataToExport =
      activeTab === "events" ? getFilteredEvents() : getFilteredParticipants();
    const csvContent = convertToCSV(dataToExport);
    downloadCSV(csvContent, `${activeTab}_export.csv`);
  };

  const convertToCSV = (data) => {
    const columns = activeTab === "events" ? eventColumns : participantColumns;
    const headers = columns.map((col) => col.header).join(",");
    const rows = data.map((item) =>
      columns.map((col) => `"${item[col.accessorKey] || ""}"`).join(",")
    );
    return [headers, ...rows].join("\n");
  };

  const downloadCSV = (content, fileName) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const processChartData = (filteredEvents, filteredParticipants) => {
    // Event Types Distribution
    const eventTypeCounts = filteredEvents.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    const eventTypes = Object.entries(eventTypeCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // Participant Type Distribution
    const participantTypeCounts = filteredParticipants.reduce(
      (acc, participant) => {
        const type = participant.participantType || "Unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {}
    );

    const participantTypes = Object.entries(participantTypeCounts).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    // Ethnic Groups Distribution
    const ethnicCounts = filteredParticipants.reduce((acc, participant) => {
      const group = participant.ethnicGroup || "Not Specified";
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});

    const ethnicGroups = Object.entries(ethnicCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // Gender Distribution
    const genderCounts = filteredParticipants.reduce(
      (acc, participant) => {
        const gender = participant.sex || "Not Specified";
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      },
      { Male: 0, Female: 0 }
    );

    const genderDistribution = Object.entries(genderCounts).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    // Add organization distribution
    const organizationCounts = filteredParticipants.reduce(
      (acc, participant) => {
        const org =
          participant.organization ||
          participant.school ||
          participant.department ||
          "Not Specified";
        acc[org] = (acc[org] || 0) + 1;
        return acc;
      },
      {}
    );

    const organizationDistribution = Object.entries(organizationCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Just get top 10

    // Age Groups Distribution
    const ageGroups = filteredParticipants.reduce((acc, participant) => {
      const age = parseInt(participant.age);
      let group;
      if (age < 18) group = "18 and below";
      else if (age < 25) group = "18-24";
      else if (age < 35) group = "25-34";
      else if (age < 45) group = "35-44";
      else group = "45+";

      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});

    const ageGroupsData = Object.entries(ageGroups).map(([name, value]) => ({
      name,
      value,
    }));

    setChartData({
      eventTypes,
      ethnicGroups,
      genderDistribution,
      ageGroups: ageGroupsData,
      participantTypes,
      organizationDistribution,
    });
  };

  const handleSearch = (searchText) => {
    setSearchTerm(searchText);
    const nlpResults = processNaturalLanguage(searchText);
    setProcessedQuery(
      nlpResults || {
        dates: [],
        types: [],
        locations: [],
        names: [],
        keywords: [],
      }
    );
    setHasSearched(true);

    // Process chart data with filtered results
    const filteredEvents = getFilteredEvents();
    const filteredParticipants = getFilteredParticipants();
    processChartData(filteredEvents, filteredParticipants);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    setHasSearched(true);
  };

  const SearchSuggestions = () => {
    if (!searchTerm) return null;

    return (
      <div className="mt-2 text-sm text-gray-500">
        {processedQuery && (
          <div className="space-y-1">
            {processedQuery.dates?.length > 0 && (
              <p>📅 Dates found: {processedQuery.dates.join(", ")}</p>
            )}
            {processedQuery.types?.length > 0 && (
              <p>📋 Event types found: {processedQuery.types.join(", ")}</p>
            )}
            {processedQuery.locations?.length > 0 && (
              <p>📍 Locations found: {processedQuery.locations.join(", ")}</p>
            )}
            {processedQuery.names?.length > 0 && (
              <p>👤 Names found: {processedQuery.names.join(", ")}</p>
            )}
            {processedQuery.keywords?.length > 0 && (
              <p>🔍 Keywords found: {processedQuery.keywords.join(", ")}</p>
            )}
          </div>
        )}
        <div className="mt-2">
          <p className="font-medium">Example searches:</p>
          {activeTab === "events" ? (
            <ul className="list-disc pl-4 space-y-1">
              <li>"Show academic events in January"</li>
              <li>"Find workshops next week"</li>
              <li>"Events at Room 101"</li>
            </ul>
          ) : (
            <ul className="list-disc pl-4 space-y-1">
              <li>"Find participants named John"</li>
              <li>"Show female participants from Tagalog region"</li>
              <li>"Participants over 25 years old"</li>
            </ul>
          )}
        </div>
      </div>
    );
  };

  const processNaturalLanguage = (query) => {
    if (!query) return null;

    // Convert query to lowercase for consistent matching
    const queryLower = query.toLowerCase();

    // Initialize result object
    const result = {
      dates: [],
      types: [],
      locations: [],
      names: [],
      keywords: [],
    };

    // Date patterns
    const datePatterns = {
      months:
        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/,
      timeframes:
        /\b(today|tomorrow|yesterday|next week|last week|this week|next month|last month|this month)\b/,
      dates: /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/,
      years: /\b20\d{2}\b/,
    };

    // Event type patterns
    const typePatterns = {
      academic:
        /\b(academic|lecture|seminar|workshop|conference|training|class)\b/,
      nonAcademic:
        /\b(non-academic|social|gathering|meeting|celebration|party|event)\b/,
    };

    // Location patterns
    const locationPatterns = {
      rooms:
        /\b(room|hall|auditorium|theater|classroom|lab|laboratory)\s*\d*\b/i,
      buildings: /\b(building|campus|center|centre|facility)\s*\d*\b/i,
    };

    // Name patterns (basic)
    const namePatterns = {
      titles: /\b(mr|mrs|ms|dr|prof)\b\.?\s+[a-z]+/i,
      commonNames:
        /\b(john|jane|mary|james|robert|patricia|michael|linda|william|elizabeth)\b/i,
    };

    // Extract dates
    Object.values(datePatterns).forEach((pattern) => {
      const matches = queryLower.match(pattern);
      if (matches) {
        result.dates.push(...matches);
      }
    });

    // Extract event types
    Object.values(typePatterns).forEach((pattern) => {
      const matches = queryLower.match(pattern);
      if (matches) {
        result.types.push(...matches);
      }
    });

    // Extract locations
    Object.values(locationPatterns).forEach((pattern) => {
      const matches = queryLower.match(pattern);
      if (matches) {
        result.locations.push(...matches);
      }
    });

    // Extract names
    Object.values(namePatterns).forEach((pattern) => {
      const matches = queryLower.match(pattern);
      if (matches) {
        result.names.push(...matches);
      }
    });

    // Extract remaining keywords
    const words = queryLower
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 2 &&
          !result.dates.includes(word) &&
          !result.types.includes(word) &&
          !result.locations.includes(word) &&
          !result.names.includes(word)
      );

    result.keywords = [...new Set(words)]; // Remove duplicates

    // Additional context-specific patterns
    if (activeTab === "participants") {
      // Gender patterns
      if (/\b(male|female|man|woman|men|women)\b/i.test(queryLower)) {
        result.keywords.push(
          ...queryLower.match(/\b(male|female|man|woman|men|women)\b/i)
        );
      }

      // Age patterns
      const ageMatch = queryLower.match(/\b(\d+)\s*(years?\s*old|yo)\b/i);
      if (ageMatch) {
        result.keywords.push(ageMatch[1]);
      }

      // Ethnic group patterns
      const ethnicGroups = [
        "tagalog",
        "cebuano",
        "ilocano",
        "bicolano",
        "waray",
      ];
      ethnicGroups.forEach((group) => {
        if (queryLower.includes(group)) {
          result.keywords.push(group);
        }
      });
    }

    // Remove duplicates and empty arrays
    Object.keys(result).forEach((key) => {
      result[key] = [...new Set(result[key])].filter(Boolean);
    });

    return result;
  };

  const DataCharts = () => (
    <div className="grid grid-cols-2 gap-4 mt-8">
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Event Types Distribution</h3>
        <PieChart width={300} height={300}>
          <Pie
            data={hasSearched ? chartData.eventTypes : []}
            cx={150}
            cy={150}
            labelLine={false}
            label={({ name, percent }) =>
              hasSearched ? `${name} (${(percent * 100).toFixed(0)}%)` : ""
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {(hasSearched ? chartData.eventTypes : []).map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
        {!hasSearched && (
          <div className="text-center text-gray-500 mt-4">
            Search to view event type distribution
          </div>
        )}
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
        <PieChart width={300} height={300}>
          <Pie
            data={hasSearched ? chartData.genderDistribution : []}
            cx={150}
            cy={150}
            labelLine={false}
            label={({ name, percent }) =>
              hasSearched ? `${name} (${(percent * 100).toFixed(0)}%)` : ""
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {(hasSearched ? chartData.genderDistribution : []).map(
              (entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              )
            )}
          </Pie>
          <Tooltip />
        </PieChart>
        {!hasSearched && (
          <div className="text-center text-gray-500 mt-4">
            Search to view gender distribution
          </div>
        )}
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Age Distribution</h3>
        <BarChart
          width={300}
          height={300}
          data={hasSearched ? chartData.ageGroups : []}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8">
            {(hasSearched ? chartData.ageGroups : []).map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
        {!hasSearched && (
          <div className="text-center text-gray-500 mt-4">
            Search to view age distribution
          </div>
        )}
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">
          Ethnic Groups Distribution
        </h3>
        <BarChart
          width={300}
          height={300}
          data={hasSearched ? chartData.ethnicGroups : []}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8">
            {(hasSearched ? chartData.ethnicGroups : []).map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
        {!hasSearched && (
          <div className="text-center text-gray-500 mt-4">
            Search to view ethnic group distribution
          </div>
        )}
      </div>
    </div>
  );

  const SearchInput = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="search">Search</Label>
        <Select
          value={searchMode}
          onValueChange={setSearchMode}
          className="w-40"
        >
          <SelectTrigger>
            <SelectValue placeholder="Search mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">Simple Search</SelectItem>
            <SelectItem value="advanced">Advanced Search</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Input
          id="search"
          placeholder={
            searchMode === "simple"
              ? `Search ${activeTab}...`
              : "Enter multiple search terms separated by commas..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchMode === "advanced" && (
          <p className="text-sm text-gray-500">
            Tip: Use commas or spaces to separate multiple search terms.
            Example: "john, meeting, 2024"
          </p>
        )}
      </div>
    </div>
  );

  const CollectionFilters = () => {
    switch (selectedCollection) {
      case "students":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="course">Course</Label>
              <Select
                value={collectionFilters.students.course}
                onValueChange={(value) =>
                  setCollectionFilters((prev) => ({
                    ...prev,
                    students: { ...prev.students, course: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="BSIT">BSIT</SelectItem>
                  <SelectItem value="BSCS">BSCS</SelectItem>
                  <SelectItem value="BSCE">BSCE</SelectItem>
                  {/* Add more courses as needed */}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="yearLevel">Year Level</Label>
              <Select
                value={collectionFilters.students.yearLevel}
                onValueChange={(value) =>
                  setCollectionFilters((prev) => ({
                    ...prev,
                    students: { ...prev.students, yearLevel: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="section">Section</Label>
              <Select
                value={collectionFilters.students.section}
                onValueChange={(value) =>
                  setCollectionFilters((prev) => ({
                    ...prev,
                    students: { ...prev.students, section: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  {/* Add more sections as needed */}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="college">College</Label>
              <Select
                value={collectionFilters.students.college}
                onValueChange={(value) =>
                  setCollectionFilters((prev) => ({
                    ...prev,
                    students: { ...prev.students, college: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select college" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="CET">Engineering & Technology</SelectItem>
                  <SelectItem value="CAS">Arts & Sciences</SelectItem>
                  <SelectItem value="COE">Education</SelectItem>
                  {/* Add more colleges as needed */}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "staffFaculty":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Select
                value={collectionFilters.staffFaculty.department}
                onValueChange={(value) =>
                  setCollectionFilters((prev) => ({
                    ...prev,
                    staffFaculty: { ...prev.staffFaculty, department: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="IT">Information Technology</SelectItem>
                  <SelectItem value="CS">Computer Science</SelectItem>
                  <SelectItem value="MATH">Mathematics</SelectItem>
                  {/* Add more departments */}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="position">Position</Label>
              <Select
                value={collectionFilters.staffFaculty.position}
                onValueChange={(value) =>
                  setCollectionFilters((prev) => ({
                    ...prev,
                    staffFaculty: { ...prev.staffFaculty, position: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  {/* Add more positions */}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="employmentStatus">Employment Status</Label>
              <Select
                value={collectionFilters.staffFaculty.employmentStatus}
                onValueChange={(value) =>
                  setCollectionFilters((prev) => ({
                    ...prev,
                    staffFaculty: {
                      ...prev.staffFaculty,
                      employmentStatus: value,
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="contractual">Contractual</SelectItem>
                  <SelectItem value="partTime">Part Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "community":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="occupation">Occupation</Label>
              <Select
                value={collectionFilters.community.occupation}
                onValueChange={(value) =>
                  setCollectionFilters((prev) => ({
                    ...prev,
                    community: { ...prev.community, occupation: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select occupation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="business">Business Owner</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  {/* Add more occupations */}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="residentialStatus">Residential Status</Label>
              <Select
                value={collectionFilters.community.residentialStatus}
                onValueChange={(value) =>
                  setCollectionFilters((prev) => ({
                    ...prev,
                    community: { ...prev.community, residentialStatus: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="resident">Resident</SelectItem>
                  <SelectItem value="nonResident">Non-Resident</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Search and Filter</h2>

      <Tabs defaultValue="natural" className="w-full">
        <TabsList>
          <TabsTrigger value="natural">Natural Language Search</TabsTrigger>
          <TabsTrigger value="filter">Advanced Filters</TabsTrigger>
        </TabsList>

        <TabsContent value="natural">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Natural Language Search</h2>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Natural Language Search</Label>
                <Input
                  id="search"
                  placeholder={
                    activeTab === "events"
                      ? "Try: 'Show me all academic events in January' or 'Find workshops next week'"
                      : "Try: 'Find participants named John' or 'Show female participants from Tagalog region'"
                  }
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
                <SearchSuggestions />
              </div>

              {activeTab === "events" ? (
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select
                    value={filters.eventType}
                    onValueChange={(value) =>
                      handleFilterChange("eventType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Non-Academic">Non-Academic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="sexAtBirth">Sex at Birth</Label>
                    <Select
                      value={filters.sexAtBirth}
                      onValueChange={(value) =>
                        handleFilterChange("sexAtBirth", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ethnicGroup">Ethnic Group</Label>
                    <Select
                      value={filters.ethnicGroup}
                      onValueChange={(value) =>
                        handleFilterChange("ethnicGroup", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ethnic group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Tagalog">Tagalog</SelectItem>
                        <SelectItem value="Cebuano">Cebuano</SelectItem>
                        <SelectItem value="Ilocano">Ilocano</SelectItem>
                        <SelectItem value="Bicolano">Bicolano</SelectItem>
                        <SelectItem value="Waray">Waray</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {hasSearched && !loading && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  {activeTab === "events"
                    ? getFilteredEvents().length
                    : getFilteredParticipants().length}{" "}
                  results
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {(activeTab === "events"
                          ? eventColumns
                          : participantColumns
                        ).map((column) => (
                          <TableHead key={column.accessorKey}>
                            {column.header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(activeTab === "events"
                        ? getFilteredEvents()
                        : getFilteredParticipants()
                      ).map((row) => (
                        <TableRow key={row.$id}>
                          {(activeTab === "events"
                            ? eventColumns
                            : participantColumns
                          ).map((column) => (
                            <TableCell key={`${row.$id}-${column.accessorKey}`}>
                              {row[column.accessorKey]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button onClick={handleExport}>Export Data</Button>

                <DataCharts />
              </div>
            )}

            {loading && <div className="text-center py-4">Loading...</div>}

            {hasSearched &&
              !loading &&
              (activeTab === "events"
                ? getFilteredEvents()
                : getFilteredParticipants()
              ).length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No results found. Try adjusting your search or filters.
                </div>
              )}
          </div>
        </TabsContent>

        <TabsContent value="filter">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Select Collection</Label>
              <Select
                value={selectedCollection}
                onValueChange={setSelectedCollection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="staffFaculty">Staff/Faculty</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CollectionFilters />

            <div className="flex flex-wrap gap-4 mt-4">
              <Select
                value={filters.participantType}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, participantType: value }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Participant Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="staff/faculty">Staff/Faculty</SelectItem>
                  <SelectItem value="community member">
                    Community Members
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
