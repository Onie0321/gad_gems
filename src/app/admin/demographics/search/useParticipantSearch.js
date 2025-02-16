import { useState } from "react";
import { databases, databaseId, studentsCollectionId, staffFacultyCollectionId, communityCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";

export const useParticipantSearch = (selectedPeriod) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    students: [],
    staffFaculty: [],
    community: [],
  });

  const buildQueries = (filters) => {
    const queries = [Query.equal("academicPeriodId", selectedPeriod)];

    // Use equal for exact matches
    if (filters.name) {
      queries.push(Query.equal("name", filters.name));
    }
    if (filters.sex && filters.sex !== "all") {
      queries.push(Query.equal("sex", filters.sex));
    }
    if (filters.age) {
      queries.push(Query.equal("age", parseInt(filters.age)));
    }
    if (filters.ethnicGroup && filters.ethnicGroup !== "all") {
      queries.push(Query.equal("ethnicGroup", filters.ethnicGroup));
    }
    if (filters.address) {
      queries.push(Query.equal("address", filters.address));
    }
    if (filters.isArchived !== null) {
      queries.push(Query.equal("isArchived", filters.isArchived));
    }

    return queries;
  };

  const handleSearch = async (filters) => {
    setLoading(true);
    try {
      const queries = buildQueries(filters);
      const searchResults = {};

      if (
        !filters.participantType ||
        filters.participantType === "all" ||
        filters.participantType === "students"
      ) {
        const studentQueries = [...queries];
        if (filters.school && filters.school !== "all") {
          studentQueries.push(Query.equal("school", filters.school));
        }
        if (filters.year && filters.year !== "all") {
          studentQueries.push(Query.equal("year", filters.year));
        }
        if (filters.section) {
          studentQueries.push(Query.equal("section", filters.section));
        }
        if (filters.id) {
          studentQueries.push(Query.equal("studentId", filters.id));
        }

        const students = await databases.listDocuments(
          databaseId,
          studentsCollectionId,
          studentQueries
        );
        searchResults.students = students.documents;
      }

      if (
        !filters.participantType ||
        filters.participantType === "all" ||
        filters.participantType === "staffFaculty"
      ) {
        const staffQueries = [...queries];
        if (filters.id) {
          staffQueries.push(Query.equal("staffFacultyId", filters.id));
        }

        const staffFaculty = await databases.listDocuments(
          databaseId,
          staffFacultyCollectionId,
          staffQueries
        );
        searchResults.staffFaculty = staffFaculty.documents;
      }

      if (
        !filters.participantType ||
        filters.participantType === "all" ||
        filters.participantType === "community"
      ) {
        const community = await databases.listDocuments(
          databaseId,
          communityCollectionId,
          queries
        );
        searchResults.community = community.documents;
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