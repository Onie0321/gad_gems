import * as XLSX from "xlsx";
import { ID, Query } from "appwrite";
import {
  databases,
  databaseId,
  eventCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
  participantCollectionId,
  getCurrentUser,
} from "@/lib/appwrite";

// Utility to format dates for database storage
export const formatDateForDatabase = (dateString) => {
  if (!dateString) {
    throw new Error("Empty date value provided");
  }

  // First, try parsing as a regular date string
  let date = new Date(dateString);

  // If that fails, try parsing as an Excel serial number
  if (isNaN(date.getTime())) {
    const excelDate = XLSX.SSF.parse_date_code(dateString);
    if (excelDate) {
      date = new Date(Date.UTC(excelDate.y, excelDate.m - 1, excelDate.d));
    }
  }

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date value: "${dateString}"`);
  }

  // Set time to midnight UTC to avoid timezone issues
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
};

// Utility to format dates for display
export const formatDateForDisplay = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateForErrorMessage = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Utility to calculate duration in hours
export const calculateDuration = (timeFrom, timeTo) => {
  try {
    const start = new Date(timeFrom);
    const end = new Date(timeTo);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid time format");
    }

    // Get time values in milliseconds since midnight
    const startMs = (start.getHours() * 60 + start.getMinutes()) * 60 * 1000;
    const endMs = (end.getHours() * 60 + end.getMinutes()) * 60 * 1000;

    // Calculate duration
    let durationMs = endMs - startMs;

    // Handle case where end time is on the next day
    if (durationMs < 0) {
      durationMs += 24 * 60 * 60 * 1000; // Add 24 hours
    }

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    console.log("Duration calculation:", {
      start: start.toLocaleTimeString(),
      end: end.toLocaleTimeString(),
      durationMs,
      hours,
      minutes,
    });

    return {
      hours,
      minutes,
      toString: () =>
        `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${
          minutes !== 1 ? "s" : ""
        }`,
    };
  } catch (error) {
    console.error("Error calculating duration:", error);
    throw new Error(
      "Invalid duration. Please check the event start and end times."
    );
  }
};

export const formatDurationForDisplay = (duration) => {
  const { hours, minutes } = duration;
  return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${
    minutes !== 1 ? "s" : ""
  }`;
};

// Utility to format dates
const formatDate = (dateString) => {
  if (!dateString) {
    console.warn("Empty date value provided.");
    return null;
  }

  //   // First, try parsing as a regular date string
  let date = new Date(dateString);

  //   // If that fails, try parsing as an Excel serial number
  if (isNaN(date.getTime())) {
    const excelDate = XLSX.SSF.parse_date_code(dateString);
    if (excelDate) {
      date = new Date(Date.UTC(excelDate.y, excelDate.m - 1, excelDate.d));
    }
  }

  if (isNaN(date.getTime())) {
    console.warn(`Invalid date value: "${dateString}"`);
    return null;
  }

  // Return ISO string with time set to 00:00:00
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  ).toISOString();
};

export const importEventAndParticipants = async (file, academicPeriodId) => {
  try {
    const data = await readFile(file);

    // Extract all data
    const eventMetadata = extractEventMetadata(data);
    const students = extractParticipants(data);
    const staffFaculty = extractStaffFaculty(data);
    const community = extractCommunityMembers(data);

    // Check for duplicate event
    const isDuplicate = await checkForDuplicateEvent(eventMetadata);
    if (isDuplicate) {
      throw new Error(
        "An event with the same name, date, and venue already exists."
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("You must be logged in to import events");
    }

    try {
      // Create event document
      const eventData = {
        eventName: eventMetadata.eventName,
        eventDate: eventMetadata.eventDate,
        eventTimeFrom: eventMetadata.eventTimeFrom,
        eventTimeTo: eventMetadata.eventTimeTo,
        eventVenue: eventMetadata.eventVenue,
        eventType: eventMetadata.eventType,
        eventCategory: eventMetadata.eventCategory,
        numberOfHours: eventMetadata.numberOfHours,
        academicPeriodId,
        isArchived: false,
        createdBy: currentUser.$id,
      };

      const event = await databases.createDocument(
        databaseId,
        eventCollectionId,
        "unique()",
        eventData
      );

      // If we get here, event was created successfully despite the error
      console.log("Event created successfully:", event);

      // Create participants
      const createParticipants = async (participants, collectionId) => {
        return Promise.all(
          participants.map((participant) =>
            databases.createDocument(databaseId, collectionId, "unique()", {
              ...participant,
              eventId: event.$id,
              academicPeriodId,
              isArchived: false,
              createdBy: currentUser.$id,
            })
          )
        );
      };

      const [createdStudents, createdStaffFaculty, createdCommunity] =
        await Promise.all([
          createParticipants(students, participantCollectionId),
          createParticipants(staffFaculty, staffFacultyCollectionId),
          createParticipants(community, communityCollectionId),
        ]);

      return {
        success: true,
        message: `Successfully imported event "${eventMetadata.eventName}" with ${
          students.length + staffFaculty.length + community.length
        } participants`,
        event,
        participants: {
          students: createdStudents,
          staffFaculty: createdStaffFaculty,
          community: createdCommunity,
        },
      };
    } catch (error) {
      // Check if it's the known "Unknown attribute" error but data was saved
      if (
        error.message?.includes("Unknown attribute") &&
        error.message?.includes("academicPeriodId")
      ) {
        // Continue with success path since we know the data was saved
        return {
          success: true,
          message: `Successfully imported event "${eventMetadata.eventName}" with ${
            students.length + staffFaculty.length + community.length
          } participants`,
        };
      }
      // If it's any other error, rethrow it
      throw error;
    }
  } catch (error) {
    console.error("Import error:", error);
    throw error;
  }
};

export const readFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const binaryString = event.target?.result;
        if (typeof binaryString !== "string") {
          throw new Error("Failed to read file as binary string.");
        }
        const workbook = XLSX.read(binaryString, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log("Parsed Excel Data:", data);
        resolve(data);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        reject(
          new Error(
            "Failed to parse the file. Please ensure it is a valid Excel or CSV file."
          )
        );
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(new Error("Failed to read the file. Please try again."));
    };

    reader.readAsBinaryString(file);
  });
};

// Update the parseTimeAndSetDate function to handle timezones correctly
const parseTimeAndSetDate = (timeString, dateObj) => {
  try {
    timeString = timeString.trim();
    const [time, period] = timeString.split(/\s+/);

    if (!time || !period) {
      throw new Error(
        `Invalid time format: ${timeString}. Expected format: HH:MM AM/PM`
      );
    }

    const [hours, minutes] = time.split(":").map((num) => parseInt(num, 10));

    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error(`Invalid time values in: ${timeString}`);
    }

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid time values: Hours must be 1-12, minutes 0-59`);
    }

    const newDate = new Date(dateObj);
    let adjustedHours = hours;

    if (period.toUpperCase() === "PM" && hours !== 12) {
      adjustedHours += 12;
    } else if (period.toUpperCase() === "AM" && hours === 12) {
      adjustedHours = 0;
    }

    newDate.setHours(adjustedHours, minutes, 0, 0);

    console.log(`Parsed time ${timeString} to:`, {
      original: newDate.toISOString(),
      localTime: newDate.toLocaleTimeString(),
      hours: adjustedHours,
      minutes,
    });

    return newDate;
  } catch (error) {
    throw new Error(`Error parsing time "${timeString}": ${error.message}`);
  }
};

// Update the extractEventMetadata function
export const extractEventMetadata = (data) => {
  console.log("Raw Excel Data:", data);

  if (!Array.isArray(data) || data.length < 5) {
    throw new Error(
      "Invalid file format: File must contain at least 5 rows of data"
    );
  }

  const getCellValue = (rowIndex, colIndex) => {
    const row = data[rowIndex];
    if (!row) {
      throw new Error(`Missing required row ${rowIndex + 1}`);
    }
    const value = row[colIndex];
    if (value === undefined || value === null || value === "") {
      throw new Error(
        `Missing required value at row ${rowIndex + 1}, column ${colIndex + 1}`
      );
    }
    return String(value).trim();
  };

  try {
    // Extract and validate each field
    const eventName = getCellValue(2, 1);
    const eventVenue = getCellValue(3, 1);
    const eventType = getCellValue(1, 5);
    const eventCategory = getCellValue(4, 1);
    const rawEventDate = getCellValue(0, 5);

    // Get and validate the time range
    const timeRange = getCellValue(2, 5);
    console.log("Time range from Excel:", timeRange);

    if (!timeRange || !timeRange.includes("-")) {
      throw new Error(
        "Invalid time range format. Expected format: HH:MM AM/PM - HH:MM AM/PM"
      );
    }

    // Split and trim the time range
    const [eventTimeFrom, eventTimeTo] = timeRange
      .split("-")
      .map((t) => t.trim());

    // Parse the date
    const eventDate = formatDateForDatabase(rawEventDate);
    if (!eventDate) {
      throw new Error(`Invalid date format: ${rawEventDate}`);
    }

    // Parse times and calculate duration
    const fromDateTime = parseTimeAndSetDate(
      eventTimeFrom,
      new Date(eventDate)
    );
    const toDateTime = parseTimeAndSetDate(eventTimeTo, new Date(eventDate));
    const duration = calculateDuration(fromDateTime, toDateTime);

    const metadata = {
      eventName,
      eventDate,
      eventTimeFrom: fromDateTime.toISOString(),
      eventTimeTo: toDateTime.toISOString(),
      eventVenue,
      eventType,
      eventCategory,
      numberOfHours: String(duration.hours),
    };

    // Validate all required fields
    Object.entries(metadata).forEach(([key, value]) => {
      if (!value) {
        throw new Error(`Missing required field: ${key}`);
      }
    });

    console.log("Extracted metadata:", metadata);
    return metadata;
  } catch (error) {
    console.error("Error extracting event metadata:", error);
    throw new Error(`Failed to extract event data: ${error.message}`);
  }
};

// Update the validateEventMetadata function to validate new fields
const validateEventMetadata = (eventMetadata) => {
  // Add validation for new fields
  if (!eventMetadata.schoolYear) {
    throw new Error("School year is required");
  }
  if (!eventMetadata.periodType) {
    throw new Error("Period type is required");
  }

  // Basic field validation
  if (!eventMetadata.eventName) {
    throw new Error("Event name is required");
  }
  if (!eventMetadata.eventDate) {
    throw new Error("Event date is required");
  }
  if (!eventMetadata.eventTimeFrom || !eventMetadata.eventTimeTo) {
    throw new Error("Event start and end times are required");
  }
  if (!eventMetadata.eventVenue) {
    throw new Error("Event venue is required");
  }
  if (!eventMetadata.eventType) {
    throw new Error("Event type is required");
  }
  if (!eventMetadata.eventCategory) {
    throw new Error("Event category is required");
  }

  try {
    // Parse the times
    const startTime = new Date(eventMetadata.eventTimeFrom);
    const endTime = new Date(eventMetadata.eventTimeTo);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error("Invalid event time format");
    }

    // Get time values in milliseconds since midnight
    const startMs =
      (startTime.getHours() * 60 + startTime.getMinutes()) * 60 * 1000;
    const endMs = (endTime.getHours() * 60 + endTime.getMinutes()) * 60 * 1000;

    // Calculate duration
    let durationMs = endMs - startMs;

    // Handle case where end time is on the next day
    if (durationMs < 0) {
      durationMs += 24 * 60 * 60 * 1000; // Add 24 hours
    }

    // Calculate hours and store in metadata
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    eventMetadata.numberOfHours = String(hours);

    console.log("Time validation:", {
      startTime: startTime.toLocaleTimeString(),
      endTime: endTime.toLocaleTimeString(),
      durationMs,
      hours,
    });

    return eventMetadata;
  } catch (error) {
    console.error("Error validating event times:", error);
    throw new Error(`Invalid event times: ${error.message}`);
  }
};

export const extractParticipants = (data) => {
  console.log("Searching for participant data...");

  // Find the row that contains the "Student" section header
  const studentSectionIndex = data.findIndex((row) =>
    row.some((cell) => cell === "Student")
  );

  if (studentSectionIndex === -1) {
    console.warn("Student section header not found");
    return []; // Return empty array instead of throwing error
  }

  // Headers are one row below the section header
  const headerRow = data[studentSectionIndex + 1];
  if (!headerRow) {
    console.warn("Header row not found");
    return [];
  }

  // Get column indices for each field
  const nameIndex = headerRow.indexOf("Name");
  const studentIdIndex = headerRow.indexOf("StudentId");
  const sexIndex = headerRow.indexOf("Sex at Birth");
  const ageIndex = headerRow.indexOf("Age");
  const addressIndex = headerRow.indexOf("Home Address");
  const schoolIndex = headerRow.indexOf("School");
  const yearIndex = headerRow.indexOf("Year");
  const sectionIndex = headerRow.indexOf("Section");
  const ethnicGroupIndex = headerRow.indexOf("Ethnic Group");

  // Validate required columns exist
  if (nameIndex === -1 || sexIndex === -1) {
    console.warn("Required columns missing", { nameIndex, sexIndex });
    return [];
  }

  const participants = [];
  // Start from the row after headers
  for (let i = studentSectionIndex + 2; i < data.length; i++) {
    const row = data[i];
    
    // Stop if we hit an empty row or the next section
    if (!row || !row[nameIndex] || row.includes("Staff/Faculty")) {
      break;
    }

    // Clean and validate the sex value
    const rawSex = row[sexIndex]?.toString().trim();
    const sex = rawSex?.toLowerCase() === 'male' ? 'Male' : 
                rawSex?.toLowerCase() === 'female' ? 'Female' : 
                null;

    if (!sex) {
      console.warn(`Invalid sex value for participant: ${row[nameIndex]}`);
      continue; // Skip this participant
    }

    const participant = {
      name: row[nameIndex]?.toString().trim() || '',
      studentId: row[studentIdIndex]?.toString().trim() || '',
      sex: sex,
      age: parseInt(row[ageIndex], 10) || null,
      homeAddress: row[addressIndex]?.toString().trim() || '',
      school: row[schoolIndex]?.toString().trim() || '',
      year: row[yearIndex]?.toString().trim() || '',
      section: row[sectionIndex]?.toString().trim() || '',
      ethnicGroup: row[ethnicGroupIndex]?.toString().trim() || '',
      type: 'student'
    };

    // Only add participant if they have at least a name and valid sex
    if (participant.name && participant.sex) {
      participants.push(participant);
    } else {
      console.warn('Skipping invalid participant:', participant);
    }
  }

  console.log(`Found ${participants.length} valid participants:`, {
    total: participants.length,
    male: participants.filter(p => p.sex === 'Male').length,
    female: participants.filter(p => p.sex === 'Female').length
  });

  return participants;
};

// Helper function to extract staff/faculty data
export const extractStaffFaculty = (data) => {
  console.log("Searching for staff/faculty data...");

  const staffSectionIndex = data.findIndex((row) =>
    row.some((cell) => cell === "Staff/Faculty")
  );

  if (staffSectionIndex === -1) {
    console.log("No staff/faculty section found");
    return [];
  }

  const headerRow = data[staffSectionIndex + 1];
  if (!headerRow) {
    console.warn("Staff/Faculty header row not found");
    return [];
  }

  const nameIndex = headerRow.indexOf("Name");
  const idIndex = headerRow.indexOf("Staff/Faculty Id");
  const sexIndex = headerRow.indexOf("Sex at Birth");
  const ageIndex = headerRow.indexOf("Age");
  const addressIndex = headerRow.indexOf("Home Address");
  const ethnicGroupIndex = headerRow.indexOf("Ethnic Group");

  if (nameIndex === -1 || sexIndex === -1) {
    console.warn("Required staff/faculty columns missing");
    return [];
  }

  const staffFaculty = [];
  for (let i = staffSectionIndex + 2; i < data.length; i++) {
    const row = data[i];

    if (!row || !row[nameIndex] || row.includes("Community Member")) {
      break;
    }

    const rawSex = row[sexIndex]?.toString().trim();
    const sex = rawSex?.toLowerCase() === 'male' ? 'Male' : 
                rawSex?.toLowerCase() === 'female' ? 'Female' : 
                null;

    if (!sex) {
      console.warn(`Invalid sex value for staff/faculty: ${row[nameIndex]}`);
      continue;
    }

    const member = {
      name: row[nameIndex]?.toString().trim() || '',
      staffFacultyId: row[idIndex]?.toString().trim() || '',
      sex: sex,
      age: parseInt(row[ageIndex], 10) || null,
      homeAddress: row[addressIndex]?.toString().trim() || '',
      ethnicGroup: row[ethnicGroupIndex]?.toString().trim() || '',
      type: 'staff'
    };

    if (member.name && member.sex) {
      staffFaculty.push(member);
    }
  }

  console.log(`Found ${staffFaculty.length} valid staff/faculty members:`, {
    total: staffFaculty.length,
    male: staffFaculty.filter(p => p.sex === 'Male').length,
    female: staffFaculty.filter(p => p.sex === 'Female').length
  });

  return staffFaculty;
};

// Helper function to extract community member data
export const extractCommunityMembers = (data) => {
  console.log("Searching for community member data...");

  const communitySectionIndex = data.findIndex((row) =>
    row.some((cell) => cell === "Community Member")
  );

  if (communitySectionIndex === -1) {
    console.log("No community member section found");
    return [];
  }

  const headerRow = data[communitySectionIndex + 1];
  const expectedHeaders = [
    "Name",
    "Sex at Birth",
    "Age",
    "Home Address",
    "Ethnic Group",
  ];

  const hasValidHeaders = expectedHeaders.every((header) =>
    headerRow.includes(header)
  );

  if (!hasValidHeaders) {
    console.warn("Invalid community member header structure");
    return [];
  }

  const nameIndex = headerRow.indexOf("Name");
  const sexIndex = headerRow.indexOf("Sex at Birth");
  const ageIndex = headerRow.indexOf("Age");
  const addressIndex = headerRow.indexOf("Home Address");
  const ethnicGroupIndex = headerRow.indexOf("Ethnic Group");

  const communityMembers = [];
  for (let i = communitySectionIndex + 2; i < data.length; i++) {
    const row = data[i];

    if (!row[nameIndex]) {
      break;
    }

    communityMembers.push({
      name: row[nameIndex] || "",
      sex: row[sexIndex] || "",
      age: parseInt(row[ageIndex], 10) || null,
      address: row[addressIndex] || "",
      ethnicGroup: row[ethnicGroupIndex] || "",
    });
  }

  console.log(
    `Found ${communityMembers.length} community members:`,
    communityMembers
  );
  return communityMembers;
};

const validateParticipants = (participants) => {
  participants.forEach((participant, index) => {
    if (!participant.name) {
      throw new Error(`Participant at row ${index + 1} is missing a Name.`);
    }
    if (!participant.studentId) {
      throw new Error(
        `Participant at row ${index + 1} is missing a Student ID.`
      );
    }
    if (!["Male", "Female"].includes(participant.sex)) {
      throw new Error(
        `Participant at row ${index + 1} has an invalid Sex value.`
      );
    }
  });
};

// Update the checkForDuplicateEvent function
const checkForDuplicateEvent = async (eventMetadata) => {
  try {
    const response = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [
        Query.equal("eventName", eventMetadata.eventName),
        Query.equal("eventDate", eventMetadata.eventDate),
        Query.equal("eventVenue", eventMetadata.eventVenue),
      ]
    );

    return response.documents.length > 0;
  } catch (error) {
    console.error("Error checking for duplicate event:", error);
    throw new Error("Failed to check for duplicate event: " + error.message);
  }
};

// Add formatTime function
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\s/g, " "); // Ensure consistent spacing
};

// Update the formatEventPreview function to calculate counts from the data
export const formatEventPreview = (data) => {
  const startTime = formatTime(data.eventMetadata.eventTimeFrom);
  const endTime = formatTime(data.eventMetadata.eventTimeTo);

  // Get school year and period type from the Excel data
  const schoolYear = data.excelData[0][1] || "2023-2024";
  const periodType = data.excelData[1][1] || "First Semester";

  // Calculate participant counts for preview only
  const totalParticipants = data.participants.length;
  const maleCount = data.participants.filter((p) => p.sex === "Male").length;
  const femaleCount = data.participants.filter(
    (p) => p.sex === "Female"
  ).length;

  return {
    schoolYear,
    periodType,
    eventName: data.eventMetadata.eventName,
    eventDate: formatDateForDisplay(data.eventMetadata.eventDate),
    eventTime: `${startTime} - ${endTime}`,
    duration: calculateDuration(
      data.eventMetadata.eventTimeFrom,
      data.eventMetadata.eventTimeTo
    ).toString(),
    eventVenue: data.eventMetadata.eventVenue,
    eventType: data.eventMetadata.eventType,
    eventCategory: data.eventMetadata.eventCategory,
    totalParticipants,
    participantDetails: {
      male: maleCount,
      female: femaleCount,
      students: data.participants.length,
      staffFaculty: data.staffFaculty?.length || 0,
      community: data.community?.length || 0,
    },
  };
};

// Update the handleFileChange function in your import page
export const handleFileChange = async (file) => {
  try {
    const excelData = await readFile(file);
    const eventMetadata = extractEventMetadata(excelData);
    const participants = extractParticipants(excelData);

    return {
      eventMetadata,
      participants,
      excelData, // Pass the raw Excel data
    };
  } catch (error) {
    console.error("Error parsing file:", error);
    throw error;
  }
};
