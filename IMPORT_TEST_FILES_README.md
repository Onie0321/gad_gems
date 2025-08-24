# Test Import Files for GADConnect

This directory contains CSV files that you can use to test the import functionality in your GADConnect application.

## Files Included

### 1. `test_events_import.csv`
This file contains sample event data with 15 different events covering various GAD-related activities.

### 2. `test_events_simple.csv`
A simplified version with only 3 events for testing basic import functionality.

### 3. `test_events_24hour.csv`
A test file using 24-hour time format (HH:MM - HH:MM) instead of 12-hour format.

### 4. `test_events_exact_format.csv`
A test file with the exact format expected by the import function.

### 5. `test_events_multiple_formats.csv`
A test file demonstrating all supported time formats (12-hour, 24-hour, military, etc.).

### 6. `test_events_csv_import.csv`
A test file specifically formatted for the new CSV import functionality with multiple time formats.

**Columns included:**
- Event Name
- Event Date
- Event Time (Multiple formats supported - see Time Format section below)
- Event Location
- Event Description
- Event Type
- Max Participants
- Registration Deadline
- Event Status
- Organizer Name
- Contact Email
- Contact Phone
- Academic Period ID
- Is Archived

### 7. `test_participants_import.csv`
This file contains sample participant data with 20 participants including students, staff/faculty, and community members.

**Columns included:**
- Name
- Sex
- Age
- Student ID (for students)
- School
- Year
- Section
- Address
- Ethnic Group
- Other Ethnic Group
- Participant Type
- Event ID
- Academic Period ID
- Is Archived

## How to Use These Files

### Converting to Excel Format
1. Open Microsoft Excel
2. Go to File → Open
3. Select the CSV file you want to convert
4. Excel will automatically detect the CSV format
5. Save the file as `.xlsx` format

### Testing Import Functionality

#### For Events Import:
1. Go to Admin → Events → Data Import
2. Select the "Import Events" option
3. Upload any of the test CSV files:
   - `test_events_csv_import.csv` (recommended for testing)
   - `test_events_multiple_formats.csv` (shows all time formats)
   - `test_events_import.csv` (original format)
4. Verify that all events are imported correctly
5. Check that the data appears in the Events list

**Note:** The system now supports both Excel (.xlsx) and CSV (.csv) files with enhanced time format flexibility.

#### For Participants Import:
1. Go to Admin → Events → Data Import
2. Select the "Import Participants" option
3. Upload the `test_participants_import.csv` file
4. Verify that all participants are imported correctly
5. Check that the data appears in the Participant List

## Important Notes

### Academic Period ID
- The files use `"current_period_id"` as a placeholder
- You may need to replace this with the actual academic period ID from your system
- To get the current academic period ID:
  1. Go to Admin → Academic Period
  2. Copy the ID of the active period
  3. Replace `"current_period_id"` in the CSV files with the actual ID

### Event IDs
- The participant file uses `"event_id_1"`, `"event_id_2"`, etc. as placeholders
- You may need to replace these with actual event IDs after importing events
- To get event IDs:
  1. Import the events first
  2. Go to Admin → Events
  3. Copy the actual event IDs
  4. Update the participant file with real event IDs

### Time Format Support
The import system now supports multiple time formats for maximum flexibility:

**Supported Time Formats:**
1. **12-hour format**: `09:00 AM - 05:00 PM`
2. **24-hour format**: `09:00 - 17:00`
3. **Single digit hours**: `9:00 AM - 5:00 PM`
4. **Military time**: `0900 - 1700`
5. **Dot separator**: `09.00 AM - 05.00 PM`

**Examples:**
- `09:00 AM - 12:00 PM` (standard 12-hour)
- `14:00 - 17:00` (24-hour)
- `10:00 AM - 3:00 PM` (single digit)
- `0900 - 1630` (military)
- `15.30 PM - 18.30 PM` (dot separator)

### Data Validation
Before importing, ensure that:
- All required fields are filled
- Date formats are correct (YYYY-MM-DD)
- Time format follows one of the supported patterns above
- Email addresses are valid
- Phone numbers are in the correct format
- Ethnic groups match your system's predefined options

## Sample Data Overview

### Events Included:
1. GAD Orientation 2024
2. Gender Sensitivity Training
3. Women Empowerment Workshop
4. LGBTQ+ Awareness Seminar
5. Gender Equality Forum
6. Men's Health Awareness
7. Gender-Based Violence Prevention
8. Youth Leadership Summit
9. Parenting Workshop
10. Career Development for Women
11. Mental Health Awareness
12. Sports for All Genders
13. Art and Gender Expression
14. Technology and Gender Gap
15. Environmental Leadership

### Participants Included:
- **10 Students** from various colleges and years
- **5 Staff/Faculty** members from different departments
- **5 Community Members** from different areas

## Troubleshooting

### Common Issues:
1. **Date Format Errors**: Ensure dates are in YYYY-MM-DD format
2. **Time Format Errors**: Ensure time follows one of the supported formats (see Time Format Support section)
3. **Missing Required Fields**: Check that all required columns are filled
4. **Invalid Email Format**: Verify email addresses are properly formatted
5. **Academic Period Not Found**: Make sure the academic period ID exists in your system
6. **Event ID Not Found**: Import events before importing participants

### Error Messages:
- If you get "Invalid date format" errors, check the date columns
- If you get "Invalid time range format" errors, try different time formats:
  - Try `test_events_csv_import.csv` for the new CSV import functionality
  - Try `test_events_multiple_formats.csv` to see all supported formats
  - Try `test_events_24hour.csv` for 24-hour format (HH:MM - HH:MM)
  - Try `test_events_exact_format.csv` for exact 12-hour format (HH:MM AM/PM - HH:MM AM/PM)
  - The system now supports single digit hours, military time, and dot separators
- If you get "Required field missing" errors, ensure all required fields are filled
- If you get "Academic period not found" errors, update the academic period ID
- If you get "Event not found" errors, import events first or update event IDs
- If you get "Required column not found" errors, ensure your CSV has the correct column headers

## Customization

You can modify these files to:
- Add more events or participants
- Change event types, locations, or descriptions
- Modify participant information
- Add different ethnic groups or schools
- Test different date ranges

Remember to maintain the same column structure and data types when making modifications.
