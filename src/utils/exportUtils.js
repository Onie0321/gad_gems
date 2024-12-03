import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { getEvents, getParticipants } from "@/lib/appwrite";

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

export const exportEventsToExcel = async (selectedEventIds, fileName) => {
  try {
    const allEvents = await getEvents();
    const selectedEvents = allEvents.filter((event) =>
      selectedEventIds.includes(event.$id)
    );

    const workbook = XLSX.utils.book_new();

    for (const event of selectedEvents) {
      const participants = await getParticipants(event.$id);

      // Process event metadata
      const eventMetadata = [
        [
          "Event Name:",
          event.eventName,
          "",
          "",
          "Event Date:",
          formatDate(event.eventDate),
        ],
        [
          "Event Venue:",
          event.eventVenue,
          "",
          "",
          "Event Type:",
          event.eventType,
        ],
        [
          "Event Category:",
          event.eventCategory,
          "",
          "",
          "Event Time:",
          `${formatTime(event.eventTimeFrom)} - ${formatTime(event.eventTimeTo)}`,
        ],
        [
          "Duration:",
          calculateDuration(event.eventTimeFrom, event.eventTimeTo),
          "",
          "",
          "Total Participants:",
          participants.length,
        ],
        [
          "",
          "",
          "",
          "",
          "Male:",
          participants.filter((p) => p.sex === "Male").length,
        ],
        [
          "",
          "",
          "",
          "",
          "Female:",
          participants.filter((p) => p.sex === "Female").length,
        ],
      ];

      // Process participant details
      const participantHeader = [
        "Name",
        "StudentId",
        "Sex",
        "Age",
        "School",
        "Year",
        "Section",
        "Ethnic Group",
      ];
      const participantDetails = participants.map((participant) => [
        participant.name,
        participant.studentId,
        participant.sex,
        participant.age,
        participant.school,
        participant.year,
        participant.section,
  participant.ethnicGroup === "Other" ? participant.otherEthnicGroup : participant.ethnicGroup,
      ]);

      // Combine all data into one sheet
      const combinedData = [
        ...eventMetadata,
        [],
        participantHeader,
        ...participantDetails,
      ];

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(combinedData);

      // Style headers to be bold
      const boldHeaders = [
        "A1",
        "A2",
        "A3",
        "A4",
        "A5",
        "E1",
        "E2",
        "E3",
        "E4",
        "E5",
        "A7", // Participant Header Row
        "B7",
        "C7",
        "D7",
        "E7",
        "F7",
        "G7",
        "H7",
        "I7",
      ];

      boldHeaders.forEach((cell) => {
        if (ws[cell]) {
          ws[cell].s = {
            font: { bold: true },
          };
        }
      });

      // Generate unique sheet name
      let sheetName = event.eventName || "Event";
      let counter = 1;
      while (workbook.SheetNames.includes(sheetName)) {
        sheetName = `${event.eventName} (${counter})`;
        counter++;
      }

      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    }

    // Write workbook to file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, fileName);

    return true;
  } catch (error) {
    console.error("Error exporting events to Excel:", error);
    throw new Error("Failed to export events to Excel");
  }
};
