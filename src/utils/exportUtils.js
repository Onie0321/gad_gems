import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import {
  getEvents,
  getParticipants,
  getStaffFaculty,
  getCommunityMembers,
} from "@/lib/appwrite";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calculateDuration = (timeFrom, timeTo) => {
  const start = new Date(timeFrom);
  const end = new Date(timeTo);
  const durationMs = end - start;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} hours ${minutes} minutes`;
};

export const exportEventsToExcel = async (
  selectedEventIds,
  fileName = "events.xlsx"
) => {
  try {
    const finalFileName = fileName.endsWith(".xlsx")
      ? fileName
      : `${fileName}.xlsx`;

    const allEvents = await getEvents();
    const selectedEvents = allEvents.filter((event) =>
      selectedEventIds.includes(event.$id)
    );

    const workbook = XLSX.utils.book_new();

    for (const event of selectedEvents) {
      const [participants, staffFaculty, community] = await Promise.all([
        getParticipants(event.$id),
        getStaffFaculty(event.$id),
        getCommunityMembers(event.$id),
      ]);

      // Calculate totals
      const totalParticipants =
        participants.length + staffFaculty.length + community.length;
      const totalMale = [
        ...participants.filter((p) => p.sex === "Male"),
        ...staffFaculty.filter((p) => p.sex === "Male"),
        ...community.filter((p) => p.sex === "Male"),
      ].length;
      const totalFemale = [
        ...participants.filter((p) => p.sex === "Female"),
        ...staffFaculty.filter((p) => p.sex === "Female"),
        ...community.filter((p) => p.sex === "Female"),
      ].length;

      // Process event metadata with adjusted layout
      const eventMetadata = [
        [
          "School Year:",
          "2023-2024",
          "",
          "",
          "Event Date:",
          formatDate(event.eventDate),
          "",
          "Student:",

          participants.length,
        ],
        [
          "Period Type:",
          "First Semester",
          "",
          "",
          "Event Type:",
          event.eventType,
          "",
          "Staff/Faculty:",

          staffFaculty.length,
        ],
        [
          "Event Name:",
          event.eventName,
          "",
          "",
          "Event Time:",
          `${formatTime(event.eventTimeFrom)} - ${formatTime(
            event.eventTimeTo
          )}`,
          "",
          "Community Member:",

          community.length,
        ],
        [
          "Event Venue:",
          event.eventVenue,
          "",
          "",
          "Total Participants:",
          totalParticipants,
        ],
        ["Event Category:", event.eventCategory, "", "", "Male:", totalMale],
        [
          "Duration:",
          calculateDuration(event.eventTimeFrom, event.eventTimeTo),
          "",
          "",
          "Female:",
          totalFemale,
        ],
      ];

      // Add empty row
      const emptyRow = [""];

      // Process sections horizontally
      const sectionHeaders = [
        "Student",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Staff/Faculty",
        "",
        "",
        "",
        "",
        "",
        "",
        "Community Member",
      ];

      const headers = [
        // Student headers
        "Name",
        "StudentId",
        "Sex at Birth",
        "Age",
        "Home Address",
        "School",
        "Year",
        "Section",
        "Ethnic Group",
        "", // Blank column after Student section
        // Staff/Faculty headers
        "Name",
        "Staff/Faculty Id",
        "Sex at Birth",
        "Age",
        "Home Address",
        "Ethnic Group",
        "", // Blank column after Staff/Faculty section
        // Community headers
        "Name",
        "Sex at Birth",
        "Age",
        "Home Address",
        "Ethnic Group",
      ];

      // Prepare data rows
      const maxRows = Math.max(
        participants.length,
        staffFaculty.length,
        community.length
      );

      const dataRows = Array.from({ length: maxRows }, (_, index) => [
        // Student data
        participants[index]?.name ?? "",
        participants[index]?.studentId ?? "",
        participants[index]?.sex ?? "",
        participants[index]?.age ?? "",
        participants[index]?.homeAddress ?? "",
        participants[index]?.school ?? "",
        participants[index]?.year ?? "",
        participants[index]?.section ?? "",
        participants[index]?.ethnicGroup ?? "",
        "", // Blank column after Student section
        // Staff/Faculty data
        staffFaculty[index]?.name ?? "",
        staffFaculty[index]?.staffFacultyId ?? "",
        staffFaculty[index]?.sex ?? "",
        staffFaculty[index]?.age ?? "",
        staffFaculty[index]?.address ?? "",
        staffFaculty[index]?.ethnicGroup ?? "",
        "", // Blank column after Staff/Faculty section
        // Community data
        community[index]?.name ?? "",
        community[index]?.sex ?? "",
        community[index]?.age ?? "",
        community[index]?.address ?? "",
        community[index]?.ethnicGroup ?? "",
      ]);

      // Combine all data
      const combinedData = [
        ...eventMetadata,
        emptyRow,
        sectionHeaders,
        headers,
        ...dataRows,
      ];

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(combinedData);

      // Add merge cells configuration
      ws["!merges"] = [
        // Merge "Student" header across columns A-I
        { s: { r: 6, c: 0 }, e: { r: 6, c: 8 } },
        // Merge "Staff/Faculty" header across columns K-P
        { s: { r: 6, c: 10 }, e: { r: 6, c: 15 } },
        // Merge "Community Member" header across columns R-V
        { s: { r: 6, c: 17 }, e: { r: 6, c: 21 } },
      ];

      // Style section headers with merge and center
      ["A7", "K7", "R7"].forEach((cell) => {
        if (ws[cell]) {
          ws[cell].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } }, // Blue background
            alignment: { horizontal: "center", vertical: "center" },
          };
        }
      });

      // Style data headers
      [
        "A8:I8", // Student headers
        "K8:P8", // Staff/Faculty headers
        "R8:V8", // Community headers
      ].forEach((range) => {
        const [start, end] = range.split(":");
        for (
          let col = start[0];
          col <= end[0];
          col = String.fromCharCode(col.charCodeAt(0) + 1)
        ) {
          const cellRef = `${col}${start.slice(1)}`;
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: "FFEB9C" } }, // Light yellow background
              alignment: { horizontal: "center" },
            };
          }
        }
      });

      // Update column widths for horizontal layout
      ws["!cols"] = [
        // Student columns
        { width: 20 }, // Name
        { width: 15 }, // StudentId
        { width: 12 }, // Sex
        { width: 8 }, // Age
        { width: 30 }, // Address
        { width: 20 }, // School
        { width: 10 }, // Year
        { width: 10 }, // Section
        { width: 15 }, // Ethnic Group
        { width: 5 }, // Blank column
        // Staff/Faculty columns
        { width: 20 }, // Name
        { width: 15 }, // Staff/Faculty Id
        { width: 12 }, // Sex
        { width: 8 }, // Age
        { width: 30 }, // Address
        { width: 15 }, // Ethnic Group
        { width: 5 }, // Blank column
        // Community columns
        { width: 20 }, // Name
        { width: 12 }, // Sex
        { width: 8 }, // Age
        { width: 30 }, // Address
        { width: 15 }, // Ethnic Group
      ];

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, ws, event.eventName.slice(0, 31));
    }

    // Write to file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, finalFileName);

    return true;
  } catch (error) {
    console.error("Error exporting events to Excel:", error);
    throw new Error("Failed to export events to Excel");
  }
};
