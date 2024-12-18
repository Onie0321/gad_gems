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

export default function DemographicAnalysis() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedEventName, setSelectedEventName] = useState("All Events");
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
        setSelectedEvent("all");
        setSelectedEventName("All Events");
        
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
      fetchDemographicData(selectedEvent);
    }
  }, [selectedEvent, currentUser]);

  const fetchDemographicData = async (eventId) => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setLoadingMessage("Fetching demographic data...");

      // Update selected event name
      if (eventId !== "all") {
        const selectedEventObj = events.find((event) => event.$id === eventId);
        setSelectedEventName(selectedEventObj?.eventName || "Unknown Event");
      } else {
        setSelectedEventName("All Events");
      }

      // Fetch participants
      const participants = await getParticipants(eventId);
      console.log('Fetched participants:', participants);

      if (participants && participants.length > 0) {
        const processedData = {
          genderData: processGenderData(participants),
          ageData: processAgeData(participants),
          educationData: processEducationData(participants),
          ethnicData: processEthnicData(participants),
          schoolData: processSchoolData(participants),
          sectionData: processSectionData(participants),
        };

        console.log('Processed demographic data:', processedData);
        setDemographicData(processedData);
      } else {
        // Reset data if no participants
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
          if (gender === 'male' || gender === 'female' || gender === 'intersex') {
            acc[gender]++;
          }
        }
        return acc;
      },
      { male: 0, female: 0, intersex: 0 }
    );

    return Object.entries(genderCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  };

  const processAgeData = (participants) => {
    if (!participants || !Array.isArray(participants)) return [];

    const ageGroups = {
      "Below 18": { male: 0, female: 0, intersex: 0 },
      "18-24": { male: 0, female: 0, intersex: 0 },
      "25-34": { male: 0, female: 0, intersex: 0 },
      "35-44": { male: 0, female: 0, intersex: 0 },
      "45-54": { male: 0, female: 0, intersex: 0 },
      "Above 55": { male: 0, female: 0, intersex: 0 },
    };

    participants.forEach((p) => {
      if (p && p.age && p.sex) {
        const age = parseInt(p.age);
        const sex = p.sex.toLowerCase();
        if (!isNaN(age) && (sex === 'male' || sex === 'female' || sex === 'intersex')) {
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
      intersex: value.intersex,
      total: value.male + value.female + value.intersex,
    }));
  };

  const processEducationData = (participants) => {
    if (!participants || !Array.isArray(participants)) return [];

    const educationCount = participants.reduce((acc, p) => {
      if (p && p.sex && p.year) {
        const sex = p.sex.toLowerCase();
        const year = p.year;

        if (!acc[year]) {
          acc[year] = { male: 0, female: 0, intersex: 0 };
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
      const value = educationCount[year] || { male: 0, female: 0, intersex: 0 };
      return {
        name: year,
        male: value.male,
        female: value.female,
        intersex: value.intersex,
        total: value.male + value.female + value.intersex,
      };
    });
  };

  const processEthnicData = (participants) => {
    const ethnicCount = participants.reduce((acc, p) => {
      const group = p.ethnicGroup === "Other" ? p.otherEthnicGroup : p.ethnicGroup;
      const sex = p.sex.toLowerCase();
      if (!acc[group]) {
        acc[group] = { male: 0, female: 0, intersex: 0 };
      }
      acc[group][sex]++;
      return acc;
    }, {});

    return Object.entries(ethnicCount).map(([name, value]) => ({
      name,
      male: value.male,
      female: value.female,
      intersex: value.intersex,
      total: value.male + value.female + value.intersex,
    }));
  };

  const processSchoolData = (participants) => {
    const schoolCount = participants.reduce((acc, p) => {
      const sex = p.sex.toLowerCase();
      if (!acc[p.school]) {
        acc[p.school] = { male: 0, female: 0, intersex: 0 };
      }
      acc[p.school][sex]++;
      return acc;
    }, {});

    return Object.entries(schoolCount).map(([name, value]) => ({
      name,
      male: value.male,
      female: value.female,
      intersex: value.intersex,
      total: value.male + value.female + value.intersex,
    }));
  };

  const processSectionData = (participants) => {
    const sectionCount = participants.reduce((acc, p) => {
      const sex = p.sex.toLowerCase();
      if (!acc[p.section]) {
        acc[p.section] = { male: 0, female: 0, intersex: 0 };
      }
      acc[p.section][sex]++;
      return acc;
    }, {});

    return Object.entries(sectionCount).map(([name, value]) => ({
      name,
      male: value.male,
      female: value.female,
      intersex: value.intersex,
      total: value.male + value.female + value.intersex,
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
                {selectedEventName}
              </h2>
              <Select 
                onValueChange={(value) => {
                  setSelectedEvent(value);
                  const event = events.find(e => e.$id === value);
                  setSelectedEventName(event ? event.eventName : "All Events");
                }} 
                value={selectedEvent}
              >
                <SelectTrigger className="w-[200px] bg-white border-[#4DB6AC]">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.$id} value={event.$id}>
                      {event.eventName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
