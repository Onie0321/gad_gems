"use client";
import { useState } from "react";
import {
  databases,
  databaseId,
  studentCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";
import { Query } from "appwrite";

// Helper to fetch all documents from a collection (cursor-based pagination for >5000 records)
async function fetchAllDocuments(collectionId, queries = []) {
  const limit = 100;
  let allDocs = [];
  let cursor = undefined;
  let hasMore = true;
  let batch = 0;

  console.log(
    `🔄 Fetching documents from ${collectionId} with queries:`,
    queries
  );

  while (hasMore) {
    try {
      const batchQueries = [...queries, Query.limit(limit)];
      if (cursor) batchQueries.push(Query.cursorAfter(cursor));

      const response = await databases.listDocuments(
        databaseId,
        collectionId,
        batchQueries
      );

      console.log(
        `📦 Fetched batch ${batch + 1}: ${response.documents.length} documents`
      );

      allDocs = allDocs.concat(response.documents);

      if (response.documents.length < limit) {
        hasMore = false;
      } else {
        cursor = response.documents[response.documents.length - 1].$id;
        batch++;
      }
    } catch (error) {
      console.error(`❌ Error fetching batch ${batch + 1}:`, error);
      throw error;
    }
  }

  console.log(
    `✅ Total documents fetched from ${collectionId}: ${allDocs.length}`
  );
  return allDocs;
}

export const useParticipantSearch = (selectedPeriod) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    students: [],
    staffFaculty: [],
    community: [],
  });

  const buildQueries = (filters) => {
    const queries = [];

    // Remove academic period restriction to search all data
    // if (selectedPeriod) {
    //   queries.push(Query.equal("academicPeriodId", selectedPeriod));
    // }

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
      console.log("🔍 Starting search with filters:", filters);
      const queries = buildQueries(filters);
      const searchResults = {};

      // Search Students
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

        console.log("📚 Searching students with queries:", studentQueries);
        const students = await fetchAllDocuments(
          studentCollectionId,
          studentQueries
        );
        searchResults.students = students;
        console.log(`✅ Found ${students.length} students`);
      }

      // Search Staff/Faculty
      if (
        !filters.participantType ||
        filters.participantType === "all" ||
        filters.participantType === "staffFaculty"
      ) {
        const staffQueries = [...queries];
        if (filters.id) {
          staffQueries.push(Query.equal("staffFacultyId", filters.id));
        }

        console.log("👥 Searching staff/faculty with queries:", staffQueries);
        const staffFaculty = await fetchAllDocuments(
          staffFacultyCollectionId,
          staffQueries
        );
        searchResults.staffFaculty = staffFaculty;
        console.log(`✅ Found ${staffFaculty.length} staff/faculty`);
      }

      // Search Community
      if (
        !filters.participantType ||
        filters.participantType === "all" ||
        filters.participantType === "community"
      ) {
        console.log("🏘️ Searching community with queries:", queries);
        const community = await fetchAllDocuments(
          communityCollectionId,
          queries
        );
        searchResults.community = community;
        console.log(`✅ Found ${community.length} community members`);
      }

      console.log("🎯 Search completed. Total results:", {
        students: searchResults.students?.length || 0,
        staffFaculty: searchResults.staffFaculty?.length || 0,
        community: searchResults.community?.length || 0,
      });

      setResults(searchResults);
    } catch (error) {
      console.error("❌ Error searching participants:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    results,
    handleSearch,
  };
};
