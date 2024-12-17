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
        const fetchedEvents = await getEvents(user.$id);
        setEvents(fetchedEvents);
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
    if (events.length > 0 && currentUser) {
      fetchDemographicData(selectedEvent);
    }
  }, [selectedEvent, events, currentUser]);

  const fetchDemographicData = async (eventId) => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setLoadingMessage("Fetching demographic data...");

      let participants;
      if (eventId === "all") {
        // Fetch participants for all events
        const allParticipants = await Promise.all(
          events.map((event) => getParticipants(event.$id, currentUser.$id))
        );
        participants = allParticipants.flat();
        setSelectedEventName("All Events");
      } else {
        // Fetch participants for selected event
        participants = await getParticipants(eventId, currentUser.$id);
        const selectedEventObj = events.find((event) => event.$id === eventId);
        setSelectedEventName(
          selectedEventObj ? selectedEventObj.eventName : "Unknown Event"
        );
      }

      // Process demographic data
      setDemographicData({
        genderData: processGenderData(participants),
        ageData: processAgeData(participants),
        educationData: processEducationData(participants),
        ethnicData: processEthnicData(participants),
        schoolData: processSchoolData(participants),
        sectionData: processSectionData(participants),
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching demographic data:", error);
      setIsLoading(false);
      setLoadingMessage("Error fetching demographic data. Please try again.");
    }
  };

  const processGenderData = (participants) => {
    const genderCount = participants.reduce(
      (acc, p) => {
        acc[p.sex.toLowerCase()]++;
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
    const ageGroups = {
      "Below 18": { male: 0, female: 0 },
      "18-24": { male: 0, female: 0 },
      "25-34": { male: 0, female: 0 },
      "35-44": { male: 0, female: 0 },
      "45-54": { male: 0, female: 0 },
      "Above 55": { male: 0, female: 0 },
    };

    participants.forEach((p) => {
      const age = parseInt(p.age);
      const sex = p.sex.toLowerCase();
      if (age < 18) ageGroups["Below 18"][sex]++;
      else if (age >= 18 && age <= 24) ageGroups["18-24"][sex]++;
      else if (age >= 25 && age <= 34) ageGroups["25-34"][sex]++;
      else if (age >= 35 && age <= 44) ageGroups["35-44"][sex]++;
      else if (age >= 45 && age <= 54) ageGroups["45-54"][sex]++;
      else if (age >= 55) ageGroups["Above 55"][sex]++;
    });

    return Object.entries(ageGroups).map(([name, value]) => ({
      name,
      male: value.male,
      female: value.female,
      total: value.male + value.female,
    }));
  };

  const processEducationData = (participants) => {
    const educationCount = participants.reduce((acc, p) => {
      const sex = p.sex.toLowerCase();
      const year = p.year;

      if (!acc[year]) {
        acc[year] = { male: 0, female: 0 };
      }
      acc[year][sex]++;
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

  const colors = {
    background: "#F5F5F5",
    primary: "#2D89EF",
    secondary: "#4DB6AC",
    heading: "#37474F",
    link: "#FF6F61",
    cta: "#F9A825",
    success: "#A7FFEB",
    chartColors: ["#2D89EF", "#4DB6AC", "#FF6F61", "#9C27B0"], // Blue, Teal, Coral, Violet
  };

  if (!currentUser) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">
          Please sign in to view demographic analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-[#F5F5F5]">
      {isLoading && <GADConnectSimpleLoader />}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="bg-white">
          <TabsTrigger
            value="demographic"
            className="data-[state=active]:bg-[#2D89EF] data-[state=active]:text-white"
          >
            Demographic Overview
          </TabsTrigger>{" "}
        </TabsList>
        <TabsContent value="demographic">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#37474F]">
              {selectedEventName}
            </h2>
            <Select onValueChange={setSelectedEvent} value={selectedEvent}>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
