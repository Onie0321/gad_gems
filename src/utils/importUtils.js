import * as XLSX from "xlsx";
import { ID, Query } from "appwrite";
import {
  databases,
  databaseId,
  eventCollectionId,
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
      throw new Error("An event with the same name, date, and venue already exists.");
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("You must be logged in to import events");
    }

    // Create event document with required fields (without createdAt)
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
      createdBy: currentUser.$id
    };

    // Create the event
    const event = await databases.createDocument(
      databaseId,
      eventCollectionId,
      "unique()",
      eventData
    );

    // Create participants documents
    const createParticipants = async (participants, collectionId) => {
      return Promise.all(
        participants.map(participant =>
          databases.createDocument(
            databaseId,
            collectionId,
            "unique()",
            {
              ...participant,
              eventId: event.$id,
              academicPeriodId,
              isArchived: false,
              createdBy: currentUser.$id
            }
          )
        )
      );
    };

    // Create all participants in parallel
    const [createdStudents, createdStaffFaculty, createdCommunity] = await Promise.all([
      createParticipants(students, participantCollectionId),
      createParticipants(staffFaculty, staffFacultyCollectionId),
      createParticipants(community, communityCollectionId)
    ]);

    return {
      success: true,
      message: `Successfully imported event "${eventMetadata.eventName}" with ${students.length + staffFaculty.length + community.length} participants`,
      event,
      participants: {
        students: createdStudents,
        staffFaculty: createdStaffFaculty,
        community: createdCommunity
      }
    };
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
    // Remove any extra whitespace
    timeString = timeString.trim();

    // Split into time and period (AM/PM)
    const [time, period] = timeString.split(/\s+/);
    if (!time || !period) {
      throw new Error(
        `Invalid time format: ${timeString}. Expected format: HH:MM AM/PM`
      );
    }

    // Split hours and minutes
    const [hours, minutes] = time.split(":").map((num) => parseInt(num, 10));
    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error(`Invalid time values: ${timeString}`);
    }

    // Validate hours and minutes
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid time values: Hours must be 1-12, minutes 0-59`);
    }

    // Create a new date object using the input date's year, month, and day
    const newDate = new Date(dateObj);

    // Convert to 24-hour format
    let adjustedHours = hours;
    if (period.toUpperCase() === "PM" && hours !== 12) {
      adjustedHours += 12;
    } else if (period.toUpperCase() === "AM" && hours === 12) {
      adjustedHours = 0;
    }

    // Set the time components in local timezone
    newDate.setHours(adjustedHours, minutes, 0, 0);

    console.log(`Parsed time ${timeString} to:`, {
      original: newDate.toISOString(),
      localTime: newDate.toLocaleTimeString(),
      hours: adjustedHours,
      minutes,
    });

    return newDate;
  } catch (error) {
    console.error("Error parsing time:", error);
    throw error;
  }
};

// Update the extractEventMetadata function
export const extractEventMetadata = (data) => {
  console.log("Raw Excel Data:", data);

  const getCellValue = (rowIndex, colIndex) => {
    const value = data[rowIndex]?.[colIndex];
    return value !== undefined ? String(value).trim() : null;
  };

  try {
    // Get event name and venue
    const eventName = getCellValue(2, 1);
    const eventVenue = getCellValue(3, 1);

    // Get event type from the correct position
    const eventType = getCellValue(1, 5);

    // Get event category
    const eventCategory = getCellValue(4, 1);

    // Get event date
    const rawEventDate = getCellValue(0, 5);
    if (!rawEventDate) {
      throw new Error("Event date is missing");
    }

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

    // Parse times using the same base date
    const fromDateTime = parseTimeAndSetDate(
      eventTimeFrom,
      new Date(rawEventDate)
    );
    const toDateTime = parseTimeAndSetDate(eventTimeTo, new Date(rawEventDate));

    // Calculate duration
    const duration = calculateDuration(fromDateTime, toDateTime);

    // Only include fields that are in the database schema
    const metadata = {
      eventName,
      eventDate: formatDateForDatabase(rawEventDate),
      eventTimeFrom: fromDateTime.toISOString(),
      eventTimeTo: toDateTime.toISOString(),
      eventVenue,
      eventType,
      eventCategory,
      numberOfHours: String(duration.hours),
    };

    // Validate required fields
    if (!metadata.eventName) throw new Error("Event name is required");
    if (!metadata.eventVenue) throw new Error("Event venue is required");
    if (!metadata.eventType) throw new Error("Event type is required");
    if (!metadata.eventCategory) throw new Error("Event category is required");

    console.log("Final metadata:", metadata);
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
    throw new Error("Unable to locate student section in the file.");
  }

  // Headers are one row below the section header
  const headerRow = data[studentSectionIndex + 1];

  // Validate header structure
  const expectedHeaders = [
    "Name",
    "StudentId",
    "Sex at Birth",
    "Age",
    "Home Address",
    "School",
    "Year",
    "Section",
    "Ethnic Group",
  ];

  const hasValidHeaders = expectedHeaders.every((header) =>
    headerRow.includes(header)
  );

  if (!hasValidHeaders) {
    console.warn("Invalid header structure:", headerRow);
    throw new Error(
      "Invalid participant data format. Please check the file structure."
    );
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

  // Extract participant data starting from the row after headers
  const participants = [];
  for (let i = studentSectionIndex + 2; i < data.length; i++) {
    const row = data[i];

    // Stop if we hit an empty row or the next section
    if (!row[nameIndex] || row.includes("Staff/Faculty")) {
      break;
    }

    participants.push({
      name: row[nameIndex] || "",
      studentId: row[studentIdIndex] || "",
      sex: row[sexIndex] || "",
      age: parseInt(row[ageIndex], 10) || null,
      homeAddress: row[addressIndex] || "",
      school: row[schoolIndex] || "",
      year: row[yearIndex] || "",
      section: row[sectionIndex] || "",
      ethnicGroup: row[ethnicGroupIndex] || "",
    });
  }

  console.log(`Found ${participants.length} participants:`, participants);

  if (participants.length === 0) {
    throw new Error("No valid participant data found in the file.");
  }

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
  const expectedHeaders = [
    "Name",
    "Staff/Faculty Id",
    "Sex at Birth",
    "Age",
    "Home Address",
    "Ethnic Group",
  ];

  const hasValidHeaders = expectedHeaders.every((header) =>
    headerRow.includes(header)
  );

  if (!hasValidHeaders) {
    console.warn("Invalid staff/faculty header structure");
    return [];
  }

  const nameIndex = headerRow.indexOf("Name");
  const idIndex = headerRow.indexOf("Staff/Faculty Id");
  const sexIndex = headerRow.indexOf("Sex at Birth");
  const ageIndex = headerRow.indexOf("Age");
  const addressIndex = headerRow.indexOf("Home Address");
  const ethnicGroupIndex = headerRow.indexOf("Ethnic Group");

  const staffFaculty = [];
  for (let i = staffSectionIndex + 2; i < data.length; i++) {
    const row = data[i];

    if (!row[nameIndex] || row.includes("Community Member")) {
      break;
    }

    staffFaculty.push({
      name: row[nameIndex] || "",
      staffFacultyId: row[idIndex] || "",
      sex: row[sexIndex] || "",
      age: parseInt(row[ageIndex], 10) || null,
      address: row[addressIndex] || "",
      ethnicGroup: row[ethnicGroupIndex] || "",
    });
  }

  console.log(
    `Found ${staffFaculty.length} staff/faculty members:`,
    staffFaculty
  );
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
        Query.equal("eventVenue", eventMetadata.eventVenue)
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
