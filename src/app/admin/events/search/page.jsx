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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function SearchFilter({ activeTab }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    eventType: "all",
    sexAtBirth: "all",
    ethnicGroup: "all",
  });
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    eventTypes: [],
    ethnicGroups: [],
    genderDistribution: [],
    ageGroups: [],
  });
  const [searchTerms, setSearchTerms] = useState([]);
  const [searchMode, setSearchMode] = useState("simple");
  const [hasSearched, setHasSearched] = useState(false);
  const [processedQuery, setProcessedQuery] = useState(null);

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

    return participants.filter((participant) => {
      if (searchMode === "simple") {
        return (
          participant.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (filters.sexAtBirth === "all" ||
            participant.sex === filters.sexAtBirth) &&
          (filters.ethnicGroup === "all" ||
            participant.ethnicGroup === filters.ethnicGroup)
        );
      }

      const fieldsToSearch = [
        participant.name,
        participant.ethnicGroup,
        participant.sex,
        participant.age?.toString(),
      ];

      return (
        fieldsToSearch.some((field) => matchesSearchTerms(field, terms)) &&
        (filters.sexAtBirth === "all" ||
          participant.sex === filters.sexAtBirth) &&
        (filters.ethnicGroup === "all" ||
          participant.ethnicGroup === filters.ethnicGroup)
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

    // Ethnic Groups Distribution
    const ethnicCounts = filteredParticipants.reduce((acc, participant) => {
      acc[participant.ethnicGroup] = (acc[participant.ethnicGroup] || 0) + 1;
      return acc;
    }, {});

    const ethnicGroups = Object.entries(ethnicCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // Gender Distribution
    const genderCounts = filteredParticipants.reduce((acc, participant) => {
      acc[participant.sex] = (acc[participant.sex] || 0) + 1;
      return acc;
    }, { Male: 0, Female: 0 });

    const genderDistribution = Object.entries(genderCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // Age Groups Distribution
    const ageGroups = filteredParticipants.reduce((acc, participant) => {
      const age = parseInt(participant.age);
      let group;
      if (age < 18) group = "Under 18";
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
    });
  };

  const handleSearch = (searchText) => {
    setSearchTerm(searchText);
    const nlpResults = processNaturalLanguage(searchText);
    setProcessedQuery(nlpResults || {
      dates: [],
      types: [],
      locations: [],
      names: [],
      keywords: [],
    });
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
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            {(hasSearched ? chartData.genderDistribution : []).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
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
        <BarChart width={300} height={300} data={hasSearched ? chartData.ageGroups : []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8">
            {(hasSearched ? chartData.ageGroups : []).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        <h3 className="text-lg font-semibold mb-4">Ethnic Groups Distribution</h3>
        <BarChart width={300} height={300} data={hasSearched ? chartData.ethnicGroups : []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8">
            {(hasSearched ? chartData.ethnicGroups : []).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
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
              onValueChange={(value) => handleFilterChange("eventType", value)}
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
  );
}
