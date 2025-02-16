export const truncateText = (text, maxLength = 20) => {
  if (!text) return ""; // Handle null/undefined values
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const getEthnicGroupDisplay = (participant) => {
  if (!participant?.ethnicGroup) return "";
  if (participant.ethnicGroup.toLowerCase() === "other") {
    return participant.otherEthnicGroup || "Other";
  }
  return participant.ethnicGroup;
}; 