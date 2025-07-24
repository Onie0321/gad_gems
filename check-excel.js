import xlsx from "xlsx";

const excelFilePath = "public/Student Data 24-2- request of GAD (1).xlsx";

try {
  console.log("Reading Excel file...");
  const workbook = xlsx.readFile(excelFilePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  // Get the range of the worksheet
  const range = xlsx.utils.decode_range(worksheet["!ref"]);
  console.log("Sheet range:", range);

  // Read the first few rows to understand the structure
  const rows = [];
  for (let R = range.s.r; R <= Math.min(range.e.r, 10); ++R) {
    const row = {};
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = xlsx.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cell_address];
      if (cell) {
        row[C] = cell.v;
      }
    }
    rows.push(row);
  }

  console.log("\nFirst few rows:");
  console.log(rows);

  // Try to read with different options
  const data = xlsx.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  console.log("\nFirst row with header option:");
  console.log(data[0]);

  console.log("\nTotal rows:", data.length);
} catch (error) {
  console.error("Error reading Excel file:", error);
}
