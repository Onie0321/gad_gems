"use auth";
import { useState } from "react";
import {
  db,
  COLLECTIONS,
  query,
  collection,
  where,
  getDocs,
} from "@/lib/firebase";

export const useParticipantSearch = (selectedPeriod) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    students: [],
    staffFaculty: [],
    community: [],
  });

  const buildWhereConditions = (filters) => {
    const conditions = [where("academicPeriodId", "==", selectedPeriod)];

    // Use equal for exact matches
    if (filters.name) {
      conditions.push(where("name", "==", filters.name));
    }
    if (filters.sex && filters.sex !== "all") {
      conditions.push(where("sex", "==", filters.sex));
    }
    if (filters.age) {
      conditions.push(where("age", "==", parseInt(filters.age)));
    }
    if (filters.ethnicGroup && filters.ethnicGroup !== "all") {
      conditions.push(where("ethnicGroup", "==", filters.ethnicGroup));
    }
    if (filters.address) {
      conditions.push(where("address", "==", filters.address));
    }
    if (filters.isArchived !== null) {
      conditions.push(where("isArchived", "==", filters.isArchived));
    }

    return conditions;
  };

  const handleSearch = async (filters) => {
    setLoading(true);
    try {
      const baseConditions = buildWhereConditions(filters);
      const searchResults = {};

      if (
        !filters.participantType ||
        filters.participantType === "all" ||
        filters.participantType === "students"
      ) {
        const studentConditions = [...baseConditions];
        if (filters.school && filters.school !== "all") {
          studentConditions.push(where("school", "==", filters.school));
        }
        if (filters.year && filters.year !== "all") {
          studentConditions.push(where("year", "==", filters.year));
        }
        if (filters.section) {
          studentConditions.push(where("section", "==", filters.section));
        }
        if (filters.id) {
          studentConditions.push(where("studentId", "==", filters.id));
        }

        const studentsQuery = query(collection(db, COLLECTIONS.STUDENTS), ...studentConditions);
        const studentsSnapshot = await getDocs(studentsQuery);
        searchResults.students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      if (
        !filters.participantType ||
        filters.participantType === "all" ||
        filters.participantType === "staffFaculty"
      ) {
        const staffConditions = [...baseConditions];
        if (filters.id) {
          staffConditions.push(where("staffFacultyId", "==", filters.id));
        }

        const staffQuery = query(collection(db, COLLECTIONS.STAFF_FACULTY), ...staffConditions);
        const staffSnapshot = await getDocs(staffQuery);
        searchResults.staffFaculty = staffSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      if (
        !filters.participantType ||
        filters.participantType === "all" ||
        filters.participantType === "community"
      ) {
        const communityQuery = query(collection(db, COLLECTIONS.COMMUNITY), ...baseConditions);
        const communitySnapshot = await getDocs(communityQuery);
        searchResults.community = communitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Error searching participants:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    results,
    handleSearch,
    setResults,
  };
};
