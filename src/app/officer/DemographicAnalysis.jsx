"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getEvents,
  getParticipants,
  getCurrentUser,
  getCurrentAcademicPeriod,
} from "@/lib/appwrite";
import GenderBreakdown from "./demographic-analysis/GenderBreakdown";
import AgeDistribution from "./demographic-analysis/AgeDistribution";
import EducationLevel from "./demographic-analysis/EducationalLevel";
import EthnicGroupAnalysis from "./demographic-analysis/EthnicGroupAnalysis";
import SchoolDistribution from "./demographic-analysis/SchoolDistribution";
import SectionDistribution from "./demographic-analysis/SectionDistribution";
import { ColorfulSpinner } from "@/components/ui/loader";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Filter, Calendar } from "lucide-react";
import { schoolOptions } from "@/utils/participantUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-toastify";
import { checkNetworkStatus } from "@/utils/networkUtils";
import { format } from "date-fns";
import {
  databases,
  databaseId,
  eventCollectionId,
  studentsCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
  academicPeriodCollectionId,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import { Input } from "@/components/ui/input";

const getEventNames = async (eventIds) => {
  if (eventIds.includes("all")) {
    return ["All Events"];
  }

  try {
    const response = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [Query.equal("$id", eventIds), Query.equal("isArchived", false)]
    );

    return response.documents.map((event) => event.eventName);
  } catch (error) {
    return eventIds.map((id) => `Event ${id}`); // Fallback names
  }
};

export default function DemographicAnalysis() {
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState(["all"]);
  const [selectedEventNames, setSelectedEventNames] = useState(["All Events"]);
  const [demographicData, setDemographicData] = useState({
    genderData: [],
    ageData: [],
    educationData: [],
    ethnicData: [],
    schoolData: [],
    sectionData: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("demographic");
  const [loadingMessage, setLoadingMessage] = useState(
    "Loading data, please wait..."
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [currentAcademicPeriod, setCurrentAcademicPeriod] = useState(null);
  const [filters, setFilters] = useState({
    gender: [],
    ageGroups: [],
    educationLevels: [],
    ethnicGroups: [],
    schools: [],
    sections: [],
    participantType: [],
    semester: [],
    academicPeriod: [],
  });
  const [tempFilters, setTempFilters] = useState({
    gender: [],
    ageGroups: [],
    educationLevels: [],
    ethnicGroups: [],
    schools: [],
    sections: [],
    participantType: [],
    semester: [],
    academicPeriod: [],
  });
  const [pendingSelectedEvents, setPendingSelectedEvents] = useState(["all"]);
  const [pendingFilters, setPendingFilters] = useState({
    gender: [],
    ageGroups: [],
    educationLevels: [],
    ethnicGroups: [],
    schools: [],
    sections: [],
  });
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: true,
    isLow: false,
    message: "",
  });

  // Move filterOptions to component state so it can be updated
  const [filterOptions, setFilterOptions] = useState({
    gender: ["Male", "Female"],
    ageGroups: ["Below 18", "18-24", "25-34", "35-44", "45-54", "Above 55"],
    educationLevels: [
      "First Year",
      "Second Year",
      "Third Year",
      "Fourth Year",
      "Fifth Year",
    ],
    ethnicGroup: [], // Will be populated dynamically
    school: schoolOptions.map((school) => school.name),
    section: [], // Will be populated dynamically
    participantType: ["Student", "Staff/Faculty", "Community Member"],
    semester: ["First Semester", "Second Semester", "Summer"],
    academicPeriod: [], // Will be populated from API
  });

  // Add new state for custom age range
  const [customAgeRange, setCustomAgeRange] = useState({ min: "", max: "" });
  const [pendingEventSelection, setPendingEventSelection] = useState(["all"]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        setLoadingMessage("Checking user and academic period...");

        const [user, academicPeriod] = await Promise.all([
          getCurrentUser(),
          getCurrentAcademicPeriod(),
        ]);

        if (!user) {
          setIsLoading(false);
          return;
        }

        if (!academicPeriod || !academicPeriod.isActive) {
          toast.error("No active academic period found");
          setIsLoading(false);
          return;
        }

        setCurrentUser(user);
        setCurrentAcademicPeriod(academicPeriod);

        // Fetch all required data in parallel
        const [eventsResponse, academicPeriodsResponse] = await Promise.all([
          databases.listDocuments(databaseId, eventCollectionId, [
            Query.equal("createdBy", user.$id),
            Query.equal("academicPeriodId", academicPeriod.$id),
            Query.equal("isArchived", false),
            Query.orderDesc("$createdAt"),
          ]),
          databases.listDocuments(databaseId, academicPeriodCollectionId, [
            Query.orderDesc("startDate"),
          ]),
        ]);

        setEvents(eventsResponse.documents);
        setFilterOptions((prev) => ({
          ...prev,
          academicPeriod: academicPeriodsResponse.documents,
        }));

        setSelectedEvents(["all"]);
        setSelectedEventNames(["All Events"]);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        setLoadingMessage("Error loading data. Please try again.");
        toast.error("Failed to load data. Please try again.");
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchDemographicData(selectedEvents);
    }
  }, [selectedEvents, currentUser]);

  useEffect(() => {
    const checkNetwork = async () => {
      const status = await checkNetworkStatus();
      setNetworkStatus(status);
    };

    // Check initially
    checkNetwork();

    // Set up listeners for network changes
    const handleOnline = () => {
      setNetworkStatus((prev) => ({ ...prev, isOnline: true, message: "" }));
      // Refresh data if needed
      if (currentUser) {
        fetchDemographicData(selectedEvents);
      }
    };

    const handleOffline = () => {
      setNetworkStatus({
        isOnline: false,
        message:
          "No internet connection detected. Please check your network connection.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set up periodic network checks
    const networkCheckInterval = setInterval(checkNetwork, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(networkCheckInterval);
    };
  }, [currentUser, selectedEvents]);

  const fetchDemographicData = async (eventIds) => {
    if (!currentUser || !currentAcademicPeriod?.isActive) return;

    try {
      setIsLoading(true);
      setLoadingMessage("Checking network status...");

      const networkStatus = await checkNetworkStatus();
      setNetworkStatus(networkStatus);

      if (!networkStatus.isOnline) {
        toast.error(networkStatus.message);
        setIsLoading(false);
        return;
      }

      if (networkStatus.isLow) {
        toast.warning(networkStatus.message);
      }

      setLoadingMessage("Fetching demographic data...");

      // Add academic period filtering to the query
      const [participantsData, eventNames] = await Promise.all([
        eventIds.includes("all")
          ? getParticipants(null, currentUser.$id, currentAcademicPeriod.$id)
          : getParticipants(
              eventIds,
              currentUser.$id,
              currentAcademicPeriod.$id
            ),
        getEventNames(eventIds),
      ]);

      // Apply semester filter if selected
      const filteredParticipants = participantsData.filter((participant) => {
        const matchesSemester =
          filters.semester.length === 0 ||
          filters.semester.includes(participant.semester);

        return matchesSemester;
      });

      setSelectedEventNames(eventNames);
      setParticipants(filteredParticipants);
      setFilteredParticipants(filteredParticipants);

      if (filteredParticipants?.length > 0) {
        // Process data in chunks to avoid blocking the main thread
        const processDataInChunks = async (data) => {
          const chunkSize = 100;
          const chunks = [];

          for (let i = 0; i < data.length; i += chunkSize) {
            chunks.push(data.slice(i, i + chunkSize));
          }

          const processedData = {
            genderData: [],
            ageData: [],
            educationData: [],
            ethnicData: [],
            schoolData: [],
            sectionData: [],
          };

          for (const chunk of chunks) {
            await new Promise((resolve) => setTimeout(resolve, 0)); // Allow UI updates
            processedData.genderData.push(...processGenderData(chunk));
            processedData.ageData.push(...processAgeData(chunk));
            processedData.educationData.push(...processEducationData(chunk));
            processedData.ethnicData.push(...processEthnicData(chunk));
            processedData.schoolData.push(...processSchoolData(chunk));
            processedData.sectionData.push(...processSectionData(chunk));
          }

          return processedData;
        };

        const processedData = await processDataInChunks(filteredParticipants);
        setDemographicData(processedData);

        // Cache the results
        sessionStorage.setItem(
          `demographic-data-${eventIds.join("-")}`,
          JSON.stringify({
            data: processedData,
            timestamp: Date.now(),
          })
        );
      }

      setIsLoading(false);
    } catch (error) {
      toast.error("Failed to fetch demographic data");
      setIsLoading(false);
    }
  };

  const processGenderData = (participants) => {
    if (!participants || !Array.isArray(participants)) return [];

    const genderCount = participants.reduce(
      (acc, p) => {
        if (p && p.sex) {
          const gender = p.sex.toLowerCase();
          if (gender === "male" || gender === "female") {
            acc[gender]++;
          }
        }
        return acc;
      },
      { male: 0, female: 0 }
    );

    return Object.entries(genderCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  };

  const processAgeData = (participants) => {
    if (!participants || !Array.isArray(participants)) return [];

    const ageGroups = {
      "Below 18": { male: 0, female: 0 },
      "18-24": { male: 0, female: 0 },
      "25-34": { male: 0, female: 0 },
      "35-44": { male: 0, female: 0 },
      "45-54": { male: 0, female: 0 },
      "Above 55": { male: 0, female: 0 },
    };

    participants.forEach((p) => {
      if (p && p.age && p.sex) {
        const age = parseInt(p.age);
        const sex = p.sex.toLowerCase();
        if (!isNaN(age) && (sex === "male" || sex === "female")) {
          if (age < 18) ageGroups["Below 18"][sex]++;
          else if (age <= 24) ageGroups["18-24"][sex]++;
          else if (age <= 34) ageGroups["25-34"][sex]++;
          else if (age <= 44) ageGroups["35-44"][sex]++;
          else if (age <= 54) ageGroups["45-54"][sex]++;
          else ageGroups["Above 55"][sex]++;
        }
      }
    });

    return Object.entries(ageGroups).map(([name, value]) => ({
      name,
      male: value.male,
      female: value.female,
      total: value.male + value.female,
    }));
  };

  const processEducationData = (participants) => {
    if (!participants || !Array.isArray(participants)) return [];

    const educationCount = participants.reduce((acc, p) => {
      if (p && p.sex && p.year) {
        const sex = p.sex.toLowerCase();
        const year = p.year;

        if (!acc[year]) {
          acc[year] = { male: 0, female: 0 };
        }
        acc[year][sex]++;
      }
      return acc;
    }, {});

    const orderedYears = [
      "First Year",
      "Second Year",
      "Third Year",
      "Fourth Year",
      "Fifth Year",
    ];

    return orderedYears.map((year) => {
      const value = educationCount[year] || { male: 0, female: 0 };
      return {
        name: year,
        male: value.male,
        female: value.female,
        total: value.male + value.female,
      };
    });
  };

  const processEthnicData = (participants) => {
    if (!participants || !Array.isArray(participants)) return [];

    // First, collect all unique ethnic groups from participants
    const uniqueEthnicGroups = new Set(
      participants
        .filter((p) => p.ethnicGroup && p.ethnicGroup.trim() !== "")
        .map((p) => p.ethnicGroup)
    );

    // Update the filterOptions by adding new ethnic groups while keeping existing ones
    setFilterOptions((prev) => {
      const existingGroups = new Set(prev.ethnicGroup);
      const newGroups = Array.from(uniqueEthnicGroups);
      newGroups.forEach((group) => existingGroups.add(group));
      return {
        ...prev,
        ethnicGroup: Array.from(existingGroups).sort(),
      };
    });

    // Process the data for the chart
    const ethnicCount = {};
    participants.forEach((p) => {
      if (p.ethnicGroup && p.sex) {
        if (!ethnicCount[p.ethnicGroup]) {
          ethnicCount[p.ethnicGroup] = {
            name: p.ethnicGroup,
            male: 0,
            female: 0,
          };
        }
        const gender = p.sex.toLowerCase();
        if (gender === "male" || gender === "female") {
          ethnicCount[p.ethnicGroup][gender]++;
        }
      }
    });

    return Object.values(ethnicCount);
  };

  const processSchoolData = (participants) => {
    if (!participants || !Array.isArray(participants)) return [];

    // First, collect all unique schools
    const uniqueSchools = new Set(
      participants
        .filter((p) => p.school) // Filter out undefined/null values
        .map((p) => p.school)
    );

    // Process the data for the chart
    const schoolCount = {};
    participants.forEach((p) => {
      if (p.school && p.sex) {
        if (!schoolCount[p.school]) {
          schoolCount[p.school] = { name: p.school, male: 0, female: 0 };
        }
        const gender = p.sex.toLowerCase();
        if (gender === "male" || gender === "female") {
          schoolCount[p.school][gender]++;
        }
      }
    });

    return Object.values(schoolCount);
  };

  const processSectionData = (participants) => {
    if (!participants || !Array.isArray(participants)) return [];

    // First, collect all unique sections from participants
    const uniqueSections = new Set(
      participants
        .filter((p) => p.section && p.section.trim() !== "")
        .map((p) => p.section)
    );

    // Update the filterOptions by adding new sections while keeping existing ones
    setFilterOptions((prev) => {
      const existingSections = new Set(prev.section);
      const newSections = Array.from(uniqueSections);
      newSections.forEach((section) => existingSections.add(section));
      return {
        ...prev,
        section: Array.from(existingSections).sort(),
      };
    });

    // Process the data for the chart
    const sectionCount = {};
    participants.forEach((p) => {
      if (p.section && p.sex) {
        if (!sectionCount[p.section]) {
          sectionCount[p.section] = { name: p.section, male: 0, female: 0 };
        }
        const gender = p.sex.toLowerCase();
        if (gender === "male" || gender === "female") {
          sectionCount[p.section][gender]++;
        }
      }
    });

    return Object.values(sectionCount);
  };

  const handleFilterChange = (filteredData) => {
    const processedData = {
      genderData: processGenderData(filteredData),
      ageData: processAgeData(filteredData),
      educationData: processEducationData(filteredData),
      ethnicData: processEthnicData(filteredData),
      schoolData: processSchoolData(filteredData),
      sectionData: processSectionData(filteredData),
    };
    setDemographicData(processedData);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    const filteredData = participants.filter((participant) => {
      // ... existing filtering logic ...
    });
    setFilteredParticipants(filteredData);
    handleFilterChange(filteredData);
  };

  const colors = {
    background: "#F5F5F5",
    primary: "#2D89EF",
    secondary: "#4DB6AC",
    heading: "#37474F",
    link: "#FF6F61",
    cta: "#F9A825",
    success: "#A7FFEB",
    chartColors: ["#2D89EF", "#4DB6AC", "#FF6F61", "#9C27B0"], // Blue, Teal, Coral, Purple
  };

  const handleEventSelectionChange = (eventId) => {
    // If "all" is selected, select or deselect all events
    if (eventId === "all") {
      if (pendingEventSelection.includes("all")) {
        // If "all" is already selected, deselect everything
        setPendingEventSelection([]);
      } else {
        // If "all" is not selected, select all events
        const allIds = ["all", ...events.map((event) => event.$id)];
        setPendingEventSelection(allIds);
      }
      return;
    }

    // Handle individual event selection
    setPendingEventSelection((prev) => {
      // Remove "all" when deselecting any individual event
      if (prev.includes("all")) {
        prev = prev.filter((id) => id !== "all");
      }

      const newSelection = prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId];

      // If all individual events are selected, add "all"
      if (newSelection.length === events.length) {
        return ["all", ...newSelection];
      }

      return newSelection;
    });
  };

  if (!currentUser) {
    return <ColorfulSpinner />;
  }

  if (!currentAcademicPeriod?.isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demographic Analysis</CardTitle>
          <CardDescription>
            View and analyze participant demographics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                No Active Academic Period
              </h3>
              <p className="text-muted-foreground">
                Demographic analysis will be available once an administrator
                sets up the current academic period.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <ColorfulSpinner />;
  }

  return (
    <div className="space-y-4 p-4 bg-[#F5F5F5]">
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="bg-white">
          <TabsTrigger
            value="demographic"
            className="data-[state=active]:bg-[#2D89EF] data-[state=active]:text-white"
          >
            Demographic Overview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="demographic">
          <div className="flex justify-between items-center mb-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#37474F]">
                {selectedEventNames.join(", ")}
              </h2>
              {currentAcademicPeriod && (
                <div className="text-sm text-muted-foreground">
                  Academic Period: {currentAcademicPeriod.schoolYear} -{" "}
                  {currentAcademicPeriod.periodType}
                  <br />
                  {format(
                    new Date(currentAcademicPeriod.startDate),
                    "MMM d, yyyy"
                  )}{" "}
                  -{" "}
                  {format(
                    new Date(currentAcademicPeriod.endDate),
                    "MMM d, yyyy"
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Dialog
                open={showEventSelector}
                onOpenChange={setShowEventSelector}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    Select Events <ChevronDown className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="max-w-[500px]"
                  aria-describedby="event-selector-description"
                >
                  <DialogHeader>
                    <DialogTitle>Select Events</DialogTitle>
                    <DialogDescription id="event-selector-description">
                      Choose the events you want to analyze
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="all-events"
                        checked={pendingEventSelection.includes("all")}
                        onCheckedChange={() =>
                          handleEventSelectionChange("all")
                        }
                      />
                      <label htmlFor="all-events">All Events</label>
                    </div>
                    <div className="space-y-2">
                      {events.map((event) => (
                        <div
                          key={event.$id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={event.$id}
                            checked={
                              pendingEventSelection.includes(event.$id) ||
                              pendingEventSelection.includes("all")
                            }
                            onCheckedChange={() =>
                              handleEventSelectionChange(event.$id)
                            }
                          />
                          <label htmlFor={event.$id}>{event.eventName}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPendingEventSelection(selectedEvents);
                        setShowEventSelector(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedEvents(pendingEventSelection);
                        setSelectedEventNames(
                          pendingEventSelection.includes("all")
                            ? ["All Events"]
                            : events
                                .filter((event) =>
                                  pendingEventSelection.includes(event.$id)
                                )
                                .map((event) => event.eventName)
                        );
                        setShowEventSelector(false);
                      }}
                    >
                      Apply
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showFilters} onOpenChange={setShowFilters}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="max-w-[800px]"
                  aria-describedby="filters-dialog-description"
                >
                  <DialogHeader>
                    <DialogTitle>Filter Data</DialogTitle>
                    <DialogDescription id="filters-dialog-description">
                      Select filters to analyze specific demographic data
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-base font-semibold">
                            Participant Type
                          </Label>
                          <div className="grid grid-cols-1 gap-2">
                            {filterOptions.participantType.map((type) => (
                              <div
                                key={type}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  checked={tempFilters.participantType.includes(
                                    type
                                  )}
                                  onCheckedChange={(checked) => {
                                    setTempFilters((prev) => ({
                                      ...prev,
                                      participantType: checked
                                        ? [...prev.participantType, type]
                                        : prev.participantType.filter(
                                            (t) => t !== type
                                          ),
                                    }));
                                  }}
                                />
                                <Label>{type}</Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-base font-semibold">
                            Age Groups
                          </Label>
                          <div className="grid grid-cols-1 gap-2">
                            {filterOptions.ageGroups.map((age) => (
                              <div
                                key={age}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  checked={tempFilters.ageGroups.includes(age)}
                                  onCheckedChange={(checked) => {
                                    setTempFilters((prev) => ({
                                      ...prev,
                                      ageGroups: checked
                                        ? [...prev.ageGroups, age]
                                        : prev.ageGroups.filter(
                                            (a) => a !== age
                                          ),
                                    }));
                                  }}
                                />
                                <Label>{age}</Label>
                              </div>
                            ))}
                            <div className="pt-2 space-y-2">
                              <Label className="text-sm">
                                Custom Age Range
                              </Label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  placeholder="Min"
                                  className="w-20"
                                  value={customAgeRange.min}
                                  onChange={(e) =>
                                    setCustomAgeRange((prev) => ({
                                      ...prev,
                                      min: e.target.value,
                                    }))
                                  }
                                />
                                <span>to</span>
                                <Input
                                  type="number"
                                  placeholder="Max"
                                  className="w-20"
                                  value={customAgeRange.max}
                                  onChange={(e) =>
                                    setCustomAgeRange((prev) => ({
                                      ...prev,
                                      max: e.target.value,
                                    }))
                                  }
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      customAgeRange.min &&
                                      customAgeRange.max
                                    ) {
                                      const customRange = `${customAgeRange.min}-${customAgeRange.max}`;
                                      setTempFilters((prev) => ({
                                        ...prev,
                                        ageGroups: [
                                          ...prev.ageGroups,
                                          customRange,
                                        ],
                                      }));
                                      setCustomAgeRange({ min: "", max: "" });
                                    }
                                  }}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-base font-semibold">
                            Schools
                          </Label>
                          <div className="max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {filterOptions.school.map((school) => (
                              <div
                                key={school}
                                className="flex items-center space-x-2 py-1"
                              >
                                <Checkbox
                                  checked={tempFilters.schools.includes(school)}
                                  onCheckedChange={(checked) => {
                                    setTempFilters((prev) => ({
                                      ...prev,
                                      schools: checked
                                        ? [...prev.schools, school]
                                        : prev.schools.filter(
                                            (s) => s !== school
                                          ),
                                    }));
                                  }}
                                />
                                <Label>{school}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-base font-semibold">
                            Academic Period
                          </Label>
                          <div className="max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {filterOptions.academicPeriod.map((period) => (
                              <div
                                key={period.$id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  checked={tempFilters.academicPeriod.includes(
                                    period.$id
                                  )}
                                  onCheckedChange={(checked) => {
                                    setTempFilters((prev) => ({
                                      ...prev,
                                      academicPeriod: checked
                                        ? [...prev.academicPeriod, period.$id]
                                        : prev.academicPeriod.filter(
                                            (p) => p !== period.$id
                                          ),
                                    }));
                                  }}
                                />
                                <Label className="text-sm">
                                  {period.schoolYear}
                                  <span className="block text-xs text-muted-foreground">
                                    {format(
                                      new Date(period.startDate),
                                      "MMM d, yyyy"
                                    )}{" "}
                                    -{" "}
                                    {format(
                                      new Date(period.endDate),
                                      "MMM d, yyyy"
                                    )}
                                  </span>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-base font-semibold">
                            Sex at Birth
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            {filterOptions.gender.map((gender) => (
                              <div
                                key={gender}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  checked={tempFilters.gender.includes(gender)}
                                  onCheckedChange={(checked) => {
                                    setTempFilters((prev) => ({
                                      ...prev,
                                      gender: checked
                                        ? [...prev.gender, gender]
                                        : prev.gender.filter(
                                            (g) => g !== gender
                                          ),
                                    }));
                                  }}
                                />
                                <Label>{gender}</Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-base font-semibold">
                            Ethnic Groups
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            {filterOptions.ethnicGroup.map((group) => (
                              <div
                                key={group}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  checked={tempFilters.ethnicGroups.includes(
                                    group
                                  )}
                                  onCheckedChange={(checked) => {
                                    setTempFilters((prev) => ({
                                      ...prev,
                                      ethnicGroups: checked
                                        ? [...prev.ethnicGroups, group]
                                        : prev.ethnicGroups.filter(
                                            (g) => g !== group
                                          ),
                                    }));
                                  }}
                                />
                                <Label>{group}</Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-base font-semibold">
                            Semester
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            {filterOptions.semester.map((sem) => (
                              <div
                                key={sem}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  checked={tempFilters.semester.includes(sem)}
                                  onCheckedChange={(checked) => {
                                    setTempFilters((prev) => ({
                                      ...prev,
                                      semester: checked
                                        ? [...prev.semester, sem]
                                        : prev.semester.filter(
                                            (s) => s !== sem
                                          ),
                                    }));
                                  }}
                                />
                                <Label>{sem}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTempFilters(filters);
                        setShowFilters(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        applyFilters();
                        setShowFilters(false);
                      }}
                    >
                      Apply Filters
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demographicData.genderData.length > 0 ? (
              <>
                <GenderBreakdown
                  data={demographicData.genderData}
                  colors={colors.chartColors}
                />
                <AgeDistribution
                  data={demographicData.ageData}
                  colors={colors.chartColors}
                />
                <EducationLevel
                  data={demographicData.educationData}
                  colors={colors.chartColors}
                />
                <EthnicGroupAnalysis
                  data={demographicData.ethnicData}
                  colors={colors.chartColors}
                />
                <SchoolDistribution
                  data={demographicData.schoolData}
                  colors={colors.chartColors}
                />
                <SectionDistribution
                  data={demographicData.sectionData}
                  colors={colors.chartColors}
                />
              </>
            ) : (
              <div className="col-span-2 text-center py-4">
                <p>No data available for the selected event.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
