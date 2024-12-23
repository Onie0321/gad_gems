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
import { getEvents, getParticipants, getCurrentUser } from "@/lib/appwrite";
import GenderBreakdown from "./gender-breakdown/page";
import AgeDistribution from "./age-distribution/page";
import EducationLevel from "./educational-level/page";
import EthnicGroupAnalysis from "../../admin/demographics/ethnic-group-analysis/page";
import SchoolDistribution from "./school-distribution/page";
import SectionDistribution from "./section-distribution/page";
import GADConnectSimpleLoader from "@/components/loading/simpleLoading";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Filter } from "lucide-react";
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
  const [filters, setFilters] = useState({
    gender: [],
    ageGroups: [],
    educationLevels: [],
    ethnicGroups: [],
    schools: [],
    sections: [],
  });
  const [tempFilters, setTempFilters] = useState({
    gender: [],
    ageGroups: [],
    educationLevels: [],
    ethnicGroups: [],
    schools: [],
    sections: [],
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

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        setCurrentUser(user);
        const fetchedEvents = await getEvents();
        setEvents(fetchedEvents);

        // Set initial event selection
        setSelectedEvents(["all"]);
        setSelectedEventNames(["All Events"]);

        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing data:", error);
        setIsLoading(false);
        setLoadingMessage("Error loading data. Please try again.");
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchDemographicData(selectedEvents);
    }
  }, [selectedEvents, currentUser]);

  const fetchDemographicData = async (eventIds) => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setLoadingMessage("Fetching demographic data...");

      // Update selected event names
      if (!eventIds.includes("all")) {
        const selectedEventObjs = events.filter((event) =>
          eventIds.includes(event.$id)
        );
        setSelectedEventNames(
          selectedEventObjs.map((event) => event.eventName)
        );
      } else {
        setSelectedEventNames(["All Events"]);
      }

      // Fetch participants for selected events
      let fetchedParticipants = [];
      if (eventIds.includes("all")) {
        fetchedParticipants = await getParticipants();
      } else {
        // Fetch and combine participants from all selected events
        const participantPromises = eventIds.map((eventId) =>
          getParticipants(eventId)
        );
        const participantArrays = await Promise.all(participantPromises);
        fetchedParticipants = participantArrays.flat();
      }

      setParticipants(fetchedParticipants);
      setFilteredParticipants(fetchedParticipants);

      if (fetchedParticipants && fetchedParticipants.length > 0) {
        const processedData = {
          genderData: processGenderData(fetchedParticipants),
          ageData: processAgeData(fetchedParticipants),
          educationData: processEducationData(fetchedParticipants),
          ethnicData: processEthnicData(fetchedParticipants),
          schoolData: processSchoolData(fetchedParticipants),
          sectionData: processSectionData(fetchedParticipants),
        };

        setDemographicData(processedData);
      } else {
        setDemographicData({
          genderData: [],
          ageData: [],
          educationData: [],
          ethnicData: [],
          schoolData: [],
          sectionData: [],
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching demographic data:", error);
      setIsLoading(false);
      setLoadingMessage("Error fetching demographic data. Please try again.");
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
    const ethnicCount = participants.reduce((acc, p) => {
      const group =
        p.ethnicGroup === "Other" ? p.otherEthnicGroup : p.ethnicGroup;
      const sex = p.sex.toLowerCase();
      if (!acc[group]) {
        acc[group] = { male: 0, female: 0 };
      }
      acc[group][sex]++;
      return acc;
    }, {});

    return Object.entries(ethnicCount).map(([name, value]) => ({
      name,
      male: value.male,
      female: value.female,
      total: value.male + value.female,
    }));
  };

  const processSchoolData = (participants) => {
    const schoolCount = participants.reduce((acc, p) => {
      const sex = p.sex.toLowerCase();
      if (!acc[p.school]) {
        acc[p.school] = { male: 0, female: 0 };
      }
      acc[p.school][sex]++;
      return acc;
    }, {});

    return Object.entries(schoolCount).map(([name, value]) => ({
      name,
      male: value.male,
      female: value.female,
      total: value.male + value.female,
    }));
  };

  const processSectionData = (participants) => {
    const sectionCount = participants.reduce((acc, p) => {
      const sex = p.sex.toLowerCase();
      if (!acc[p.section]) {
        acc[p.section] = { male: 0, female: 0 };
      }
      acc[p.section][sex]++;
      return acc;
    }, {});

    return Object.entries(sectionCount).map(([name, value]) => ({
      name,
      male: value.male,
      female: value.female,
      total: value.male + value.female,
    }));
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
    let filteredData = [...participants];

    // Apply filters
    if (tempFilters.gender.length > 0) {
      filteredData = filteredData.filter((p) =>
        tempFilters.gender.includes(p.sex)
      );
    }
    if (tempFilters.ageGroups.length > 0) {
      filteredData = filteredData.filter((p) => {
        const age = parseInt(p.age);
        return tempFilters.ageGroups.some((range) => {
          switch (range) {
            case "Below 18":
              return age < 18;
            case "18-24":
              return age >= 18 && age <= 24;
            case "25-34":
              return age >= 25 && age <= 34;
            case "35-44":
              return age >= 35 && age <= 44;
            case "45-54":
              return age >= 45 && age <= 54;
            case "Above 55":
              return age > 55;
            default:
              return false;
          }
        });
      });
    }
    if (tempFilters.educationLevels.length > 0) {
      filteredData = filteredData.filter((p) =>
        tempFilters.educationLevels.includes(p.year)
      );
    }
    if (tempFilters.ethnicGroups.length > 0) {
      filteredData = filteredData.filter((p) =>
        tempFilters.ethnicGroups.includes(p.ethnicGroup)
      );
    }
    if (tempFilters.schools.length > 0) {
      filteredData = filteredData.filter((p) =>
        tempFilters.schools.includes(p.school)
      );
    }
    if (tempFilters.sections.length > 0) {
      filteredData = filteredData.filter((p) =>
        tempFilters.sections.includes(p.section)
      );
    }

    if (filteredData.length === 0) {
      toast.warning("No data matches the selected filters.");
    }

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

  const filterOptions = {
    gender: ["Male", "Female"],
    ageGroups: ["Below 18", "18-24", "25-34", "35-44", "45-54", "Above 55"],
    educationLevels: [
      "First Year",
      "Second Year",
      "Third Year",
      "Fourth Year",
      "Fifth Year",
    ],
    ethnicGroups: [
      "Tagalog",
      "Cebuano",
      "Ilocano",
      "Bicolano",
      "Waray",
      "Other",
    ],
    schools: schoolOptions.map((school) => school.name),
    sections: ["A", "B", "C", "D", "E", "F"],
  };

  if (!currentUser) {
    return <GADConnectSimpleLoader />;
  }

  return (
    <div className="space-y-4 p-4 bg-[#F5F5F5]">
      {isLoading ? (
        <GADConnectSimpleLoader />
      ) : (
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
              <h2 className="text-2xl font-bold text-[#37474F]">
                {selectedEventNames.join(", ")}
              </h2>
              <div className="flex gap-2">
                <Dialog
                  open={showEventSelector}
                  onOpenChange={setShowEventSelector}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      Select Events <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Select Events</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <input
                          type="checkbox"
                          id="all-events"
                          checked={pendingSelectedEvents.includes("all")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPendingSelectedEvents(["all"]);
                            } else if (pendingSelectedEvents.length > 1) {
                              setPendingSelectedEvents(
                                pendingSelectedEvents.filter(
                                  (id) => id !== "all"
                                )
                              );
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label
                          htmlFor="all-events"
                          className="text-sm font-medium"
                        >
                          All Events
                        </Label>
                      </div>
                      {events.map((event) => (
                        <div
                          key={event.$id}
                          className="flex items-center space-x-2 mb-2"
                        >
                          <input
                            type="checkbox"
                            id={event.$id}
                            checked={pendingSelectedEvents.includes(event.$id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPendingSelectedEvents((prev) =>
                                  prev
                                    .filter((id) => id !== "all")
                                    .concat(event.$id)
                                );
                              } else {
                                const newSelection =
                                  pendingSelectedEvents.filter(
                                    (id) => id !== event.$id
                                  );
                                setPendingSelectedEvents(
                                  newSelection.length ? newSelection : ["all"]
                                );
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label
                            htmlFor={event.$id}
                            className="text-sm font-medium"
                          >
                            {event.eventName}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPendingSelectedEvents(selectedEvents);
                          setShowEventSelector(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedEvents(pendingSelectedEvents);
                          const selectedEventObjs = events.filter((event) =>
                            pendingSelectedEvents.includes(event.$id)
                          );
                          setSelectedEventNames(
                            pendingSelectedEvents.includes("all")
                              ? ["All Events"]
                              : selectedEventObjs.map(
                                  (event) => event.eventName
                                )
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
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      Filters <Filter className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Filter Data</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto">
                      {/* Gender Filter */}
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">
                          Gender
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
                                      : prev.gender.filter((g) => g !== gender),
                                  }));
                                }}
                              />
                              <Label>{gender}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Age Groups Filter */}
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">
                          Age Groups
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {filterOptions.ageGroups.map((ageGroup) => (
                            <div
                              key={ageGroup}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                checked={tempFilters.ageGroups.includes(
                                  ageGroup
                                )}
                                onCheckedChange={(checked) => {
                                  setTempFilters((prev) => ({
                                    ...prev,
                                    ageGroups: checked
                                      ? [...prev.ageGroups, ageGroup]
                                      : prev.ageGroups.filter(
                                          (ag) => ag !== ageGroup
                                        ),
                                  }));
                                }}
                              />
                              <Label>{ageGroup}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Education Levels Filter */}
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">
                          Educational Level
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {filterOptions.educationLevels.map((level) => (
                            <div
                              key={level}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                checked={tempFilters.educationLevels.includes(
                                  level
                                )}
                                onCheckedChange={(checked) => {
                                  setTempFilters((prev) => ({
                                    ...prev,
                                    educationLevels: checked
                                      ? [...prev.educationLevels, level]
                                      : prev.educationLevels.filter(
                                          (l) => l !== level
                                        ),
                                  }));
                                }}
                              />
                              <Label>{level}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Schools Filter */}
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">
                          Schools
                        </Label>
                        <div className="grid grid-cols-1 gap-2">
                          {filterOptions.schools.map((school) => (
                            <div
                              key={school}
                              className="flex items-center space-x-2"
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

                      {/* Sections Filter */}
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">
                          Sections
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          {filterOptions.sections.map((section) => (
                            <div
                              key={section}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                checked={tempFilters.sections.includes(section)}
                                onCheckedChange={(checked) => {
                                  setTempFilters((prev) => ({
                                    ...prev,
                                    sections: checked
                                      ? [...prev.sections, section]
                                      : prev.sections.filter(
                                          (s) => s !== section
                                        ),
                                  }));
                                }}
                              />
                              <Label>{section}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ethnic Groups Filter */}
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">
                          Ethnic Groups
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {filterOptions.ethnicGroups.map((group) => (
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
      )}
    </div>
  );
}
