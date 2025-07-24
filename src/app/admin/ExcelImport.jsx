"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import {
  databases,
  databaseId,
  personalCollectionId,
  demographicsCollectionId,
  employmentDetailsCollectionId,
  genderAwarenessCollectionId,
  familyFinancialCollectionId,
  childFamPlanCollectionId,
  healthMedInfoCollectionId,
  lifestyleCollectionId,
  workplaceCollectionId,
  accessCollectionId,
  physicalCollectionId,
} from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { tr } from "date-fns/locale";

export default function ExcelImport() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState(null);
  const [currentOperation, setCurrentOperation] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const { toast } = useToast();

  const processExcelData = (data) => {
    const currentYear = new Date().getFullYear();

    // Helper function to truncate strings to max length
    const truncateString = (str, maxLength = 1000) => {
      if (!str) return "";
      return str.toString().substring(0, maxLength);
    };

    // Helper function to convert to boolean
    const toBoolean = (value, returnString = false) => {
      let boolValue;

      if (typeof value === "boolean") {
        boolValue = value;
      } else if (typeof value === "string") {
        const lowered = value.toLowerCase();
        boolValue = lowered === "yes" || lowered === "true" || lowered === "1";
      } else {
        boolValue = Boolean(value);
      }

      return returnString ? (boolValue ? "Yes" : "No") : boolValue;
    };

    // Helper function to properly capitalize words
    const capitalizeWords = (str) => {
      if (!str) return "";

      // Convert to lowercase first to handle all-caps input
      return str
        .toLowerCase()
        .split(" ")
        .map((word) => {
          // Skip empty strings
          if (!word) return word;

          // Don't capitalize certain words in addresses (like "de", "of", "and")
          const lowercaseWords = ["de", "of", "and", "the"];
          if (lowercaseWords.includes(word)) return word;

          // Handle hyphenated words
          if (word.includes("-")) {
            return word
              .split("-")
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join("-");
          }

          // Handle words with periods (like St.)
          if (word.includes(".")) {
            return word
              .split(".")
              .map((part) =>
                part ? part.charAt(0).toUpperCase() + part.slice(1) : ""
              )
              .join(".");
          }

          // Regular capitalization
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
    };

    // Helper function to format date to "Month DD, YYYY" format
    const formatDateToLongString = (dateValue) => {
      if (!dateValue) return "";

      try {
        let date;

        // If it's a number (Excel serial date)
        if (typeof dateValue === "number") {
          // Convert Excel serial date to JS Date (Excel starts from 1900-01-01)
          date = new Date((dateValue - 25569) * 86400 * 1000);
        }
        // If it's a string (e.g., "02/03/1994" or "4/25/1997")
        else if (typeof dateValue === "string") {
          // First, try parsing as a regular date string
          date = new Date(dateValue);

          // If that fails, try manual parsing
          if (isNaN(date.getTime())) {
            const parts = dateValue.split("/");
            if (parts.length === 3) {
              // Parse each part as integer to remove leading zeros
              const month = parseInt(parts[0], 10);
              const day = parseInt(parts[1], 10);
              const year = parseInt(parts[2], 10);

              // Create date object (month is 0-based in JS Date)
              date = new Date(year, month - 1, day);
            }
          }
        }

        // Check if we have a valid date
        if (!date || isNaN(date.getTime())) {
          console.error("Invalid date value:", dateValue);
          return "";
        }

        // Format the date as "Month DD, YYYY"
        return date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      } catch (error) {
        console.error("Error formatting date:", error, "Value:", dateValue);
        return "";
      }
    };

    return data.map((row) => ({
      personal: {
        timestamp: new Date().toISOString(),
        emailAddress: truncateString(row["Email Address"], 255),
        employeeId: String(row["Employee Id"] || ""),
        fullName: capitalizeWords(
          truncateString(row["Fullname (Ex. Juan A. Dela Cruz)"], 255)
        ),
        age: parseInt(row["Age"]) || 0,
        dateOfBirth: formatDateToLongString(
          row["Date of Birth (Ex. January 1, 2024)"]
        ),
        address: capitalizeWords(truncateString(row["Address"], 500)),
        contactNumber: String(row["CP No. of Employee"] || ""),
        year: currentYear,
        isArchived: false,
      },
      demographics: {
        civilStatus: capitalizeWords(truncateString(row["Civil Status"], 100)),
        sexAtBirth: capitalizeWords(truncateString(row["Sex (at birth)"], 50)),
        gender: capitalizeWords(truncateString(row["Gender"], 100)),
        nonHeterosexual: capitalizeWords(
          truncateString(row["Gender, if non-heterosexual"], 255)
        ),
        pwd: toBoolean(row["PWD"]),
        pwdSpecify: capitalizeWords(
          truncateString(row["If Yes, Please Specify (PWD)"], 255)
        ),
        soloParent: capitalizeWords(truncateString(row["Solo Parent"], 100)),
        ip: toBoolean(row["Indigenous People"]),
        ipSpecify: capitalizeWords(
          truncateString(row["If Yes, Please specify."], 255)
        ),
        year: currentYear,
        isArchived: false,
      },
      employment: {
        eStatus: truncateString(row["Status of Employment"], 500),
        assignment: truncateString(row["Assignment"], 500),
        office: truncateString(row["Offices"], 500),
        year: currentYear,
        isArchived: false,
      },
      genderAwareness: {
        awareGadAct: toBoolean(row["a.) Are you aware of GAD activities"]),
        awareGadSpecify: truncateString(row["If yes, state examples"], 255),
        participateGadAct: toBoolean(
          row["b.) Do you Participate in GAD activities"]
        ),
        awareGadFbPage: toBoolean(
          row["c.) Are you aware of the GAD Facebook Page"]
        ),
        visitedGadFbPage: toBoolean(
          row["d.) Have you visited the GAD Facebook Page"]
        ),
        awareLaws: truncateString(
          row[
            "Are you aware of the following laws (put a check mark when applicable)"
          ],
          2000
        ),
        year: currentYear,
        isArchived: false,
      },
      familyFinancial: {
        totalIncome: truncateString(
          row[
            "Total Net Monthly Family Income (Combined Net Income of all living in the householde)"
          ],
          500
        ),
        householdSize: truncateString(
          row["How many people are in the household?"],
          100
        ),
        outsideSupport: truncateString(
          row["How many outside of your household does your family support?"],
          100
        ),
        incomeSources: truncateString(row["Sources of Family Income"], 255),
        majorContributor: toBoolean(
          row[
            "Do you contribute to majority of the total monthly family income?"
          ]
        ),
        majorContributorSpecify: truncateString(
          row["If no, who contributes to the majority of the monthly income?"],
          255
        ),
        soleFinanceManager: toBoolean(
          row["Do you solely manage the family finances?"]
        ),
        soleFinanceManagerSpecify: truncateString(
          row["If no, who manages family income?"],
          255
        ),
        hasSavings: truncateString(
          row["Does your family set aside financial savings?"],
          100
        ),
        year: currentYear,
        isArchived: false,
      },
      childFamPlan: {
        hasChildren: toBoolean(row["Do you have children"]),
        childrenAge0to6: parseInt(
          row["No. of Children with Age Range 0-6 old"] || "0"
        ),
        childrenAge7to18: parseInt(
          row["No. of Children with Age Range 7-18 old"] || "0"
        ),
        childrenAge18Plus: parseInt(
          row["No. of Children with Age more than 18 years old"] || "0"
        ),
        considerHavingChild: toBoolean(
          row["If No, are you considering having a child?"]
        ),
        wantMoreChildren: toBoolean(
          row["If Yes, do you want to have more children?"]
        ),
        waitingPeriodNextChild: truncateString(
          row[
            "How long do you prefer to wait before the birth of your next child?"
          ],
          100
        ),
        averageAgeGapChildren: truncateString(
          row["What is the average age gap of your children?"],
          100
        ),
        useDayCareServices: toBoolean(
          row[
            "For those with children below 5 years old, do you avail of the Day Care Services?"
          ]
        ),
        needDayCareFacility: toBoolean(
          row["Is there a need for a Day Care facility in your Institution?"]
        ),
        needLactationRoom: toBoolean(
          row["Is there a need for a Lactation Room in your Institution?"]
        ),
        year: currentYear,
        isArchived: false,
      },
      healthMedInfo: {
        familyPlanning: toBoolean(row["Do you practice family planning?"]),
        contraceptiveMethod: truncateString(
          row[
            "If yes, what is/are the contraceptive family planning method/s you have been regularly using?"
          ],
          255
        ),
        needFamilyPlanningInfo: toBoolean(
          row[
            "Do you see the need for family planning information in your Institution?"
          ]
        ),
        performHouseholdActivities: toBoolean(
          row[
            "Do you perform household activities (such as cleaning, washing dishes, laundrying, ironing, child rearing)?"
          ]
        ),
        householdChoreHours: truncateString(
          row[
            "If Yes, approximately how many hours in a week do you spend in household chores?"
          ],
          100
        ),
        householdMembersParticipate: truncateString(
          row[
            "Do the other members of the household participate in the household tasks?"
          ],
          100
        ),
        ownHouseProperty: toBoolean(
          row[
            "Do you personally own the house/property you are currently living in?"
          ]
        ),
        houseOwnershipDetails: truncateString(
          row["If No, check applicable answer (If others, specify)"],
          255
        ),
        regularCheckup: toBoolean(
          row[
            "Do you perform household activities (such as cleaning, washing dishes, laundrying, ironing, child rearing)?"
          ]
        ),
        familyCheckup: toBoolean(row["How about your family?"]),
        annualCheckup: toBoolean(
          row["Would you like to have scheduled annual check-up?"]
        ),
        bloodType: truncateString(row["Blood type:"], 50),
        hasMedicalIllness: toBoolean(
          row["Do you need medical attention or has known medical illness?"]
        ),
        hasMedicalIllnessSpecify: truncateString(
          row[
            "Please check the following boxes that apply and give more information as needed. (other, please specify)"
          ],
          255
        ),
        hospitalizedBefore: toBoolean(row["Previous Hospitalization "]),
        hospitalizationYear: parseInt(row["If Yes, what year?"] || "0"),
        hadSurgery: toBoolean(row["Operation/Surgery"]),
        surgeryYear: truncateString(row["If Yes, what year of surgery?"], 50),
        foodAllergies: truncateString(
          row["History of Allergies to the following: (Food)"],
          255
        ),
        medicineAllergies: truncateString(
          row["History of Allergies to the following: (Medicines)"],
          255
        ),
        familyMedicalHistory: truncateString(
          row["Family History (Others, please specify)"],
          255
        ),
        year: currentYear,
        isArchived: false,
      },
      lifestyle: {
        isSmoker: toBoolean(row["Cigarette Smoking/Vaping/E-cigarette?"]),
        isDrinker: toBoolean(row["Alcohol Drinking?"]),
        hasWorkLifeBalance: truncateString(
          row[
            "Do you think you have a balanced work-life relationship/activity?"
          ],
          50
        ),
        leisureActivities: truncateString(
          row["How do you spend your leisure time? (If others, specify)"],
          255
        ),
        getsEnoughSleep: toBoolean(row["Do you sleep 7-9 hours a day?"]),
        sleepDeficiencyReason: truncateString(row["If No, Why?"], 255),
        experiencesStress: toBoolean(row["Do you experience stress?"]),
        stressors: truncateString(
          row["If Yes, Identify stressors: (If others, specify)"],
          255
        ),
        stressManagement: truncateString(
          row["How do you manage stress? (If others, specify)"],
          255
        ),
        year: currentYear,
        isArchived: false,
      },
      workplace: {
        awareSecurityLaws: toBoolean(
          row[
            "Are you aware of the Constitutional provisions on Security, Justice, and Peace?"
          ]
        ),
        experiencedAbuse: truncateString(
          row["Have you experienced any of the following:"],
          255
        ),
        abuseSource: truncateString(
          row[
            "Who are the sources of the experiences above? (If others, specify)"
          ],
          255
        ),
        abuseAge: truncateString(
          row["What age did you experience these events?"],
          50
        ),
        abuseOngoing: truncateString(
          row["Is the abuse/harassment still currently happening?"],
          50
        ),
        abuseReaction: truncateString(
          row[
            "What is your reaction to the abuse/harassment? (If others, specify)"
          ],
          255
        ),
        abuseCauses: truncateString(
          row[
            "What are the causes of abuse in your family/office: (If others, specify)"
          ],
          255
        ),
        willingForCounseling: truncateString(
          row[
            "Are you willing to discuss this/these experience/s with a guide counsellor/medical expert/ lawyer?"
          ],
          50
        ),
        needsCrisisRoom: truncateString(
          row[
            "How do you see the need for a crisis/counseling room manned by a guidance counselor/medical expert/lawyer in your Institution?"
          ],
          50
        ),
        awareVAWDesk: toBoolean(
          row[
            "Are you aware if ASCOT has a Violence Against Women (VAW) Help Desk of Crisis/Counseling Service at the Guidance Office?"
          ]
        ),
        hasLegalAssistance: truncateString(
          row["Is legal assistance provided by your Institution?"],
          50
        ),
        awareRA9262Leave: toBoolean(
          row[
            "Do you know you have a right to a 10-day paid leave if you are a victim of violence under RA 9262?"
          ]
        ),
        year: currentYear,
        isArchived: false,
      },
      access: {
        hasOfficeAccess: toBoolean(
          row[
            "Do you have access to the resources of your office? (i.e. office supplies, laptop, etc.)"
          ]
        ),
        controlsOfficeResources: toBoolean(
          row["If Yes, do you have control over the use/utilization?"]
        ),
        involvedInDecisions: toBoolean(
          row["Are you involve in decision-making process by your office?"]
        ),
        memberOfCommittee: toBoolean(
          row[
            "Are you a member of any Committee/the  GAD Focal Point System in the College/Institution?"
          ]
        ),
        consultedOnPolicies: truncateString(
          row["At the workplace, are you consulted regarding:"],
          500
        ),
        superiorRespectsRights: toBoolean(
          row[
            "Is your immediate superior considerate of your personal circumstance and respects your basic rights?"
          ]
        ),
        superiorDisrespectReason: truncateString(
          row["If No, why is that?"],
          255
        ),
        treatedWithRespect: toBoolean(
          row[
            "As a subordinate/peer, are you treated with respect and dignity as a person in your day to day dealings?"
          ]
        ),
        respectIssueReason: truncateString(row["If No, why is it no?"], 255),
        awareOfGADAuditGuidelines: toBoolean(
          row["Are you aware of the guidelines in the audit of GAD funds?"]
        ),
        auditedGADFunds: toBoolean(row["Have you audited GAD funds?"]),
        gadFundsCompliance: toBoolean(
          row[
            "Is your audited agency compliant on the requirement and rules and regulations on the use or disposition of GAD funds?"
          ]
        ),
        year: currentYear,
        isArchived: false,
      },
      physical: {
        hasSportsSkills: toBoolean(
          row["Do you have skills in any kind of sports?"]
        ),
        sportsSkills: truncateString(
          row[
            "If yes, please specify the sports you are interested to play: (If others, specify)"
          ],
          255
        ),
        joinedSCUFAR: toBoolean(
          row[
            "Have you participated in annual sports competitions during SCUFAR?"
          ]
        ),
        SCUFARNoReason: truncateString(row["If No, why?"], 255),
        hasFitnessProgram: truncateString(
          row[
            "Do your office have regular weekly physical fitness program?"
          ],
          50
        ),
        availsHealthProgram: truncateString(
          row[
            "Do you avail of the 2-hour program of the Civil Service Commission re:Health Info?"
          ],
          50
        ),
        hasFitnessGuidelines: truncateString(
          row["Does your office have physical fitness program guidelines?"],
          50
        ),
        fitnessProgramManaged: toBoolean(
          row["Does the regular weekly physical program being managed well?"],
          50
        ),
        GADImprovementComments: truncateString(
          row[
            "Do you have any comments and recommendations to improve GAD mainstreaming in ASCOT?"
          ],
          1000
        ),
        year: currentYear,
        isArchived: false,
      },
    }));
  };

  const isDuplicate = async (record) => {
    try {
      // Check for duplicates based on multiple fields
      const queries = [
        Query.equal("emailAddress", record.emailAddress),
        Query.equal("employeeId", record.employeeId),
        Query.equal("fullName", record.fullName),
      ];

      // Check each field individually to provide detailed feedback
      const duplicateChecks = await Promise.all([
        databases.listDocuments(databaseId, personalCollectionId, [queries[0]]),
        databases.listDocuments(databaseId, personalCollectionId, [queries[1]]),
        databases.listDocuments(databaseId, personalCollectionId, [queries[2]]),
      ]);

      const duplicateFields = [];
      if (duplicateChecks[0].documents.length > 0)
        duplicateFields.push("Email Address");
      if (duplicateChecks[1].documents.length > 0)
        duplicateFields.push("Employee Id");
      if (duplicateChecks[2].documents.length > 0)
        duplicateFields.push("Fullname (Ex. Juan A. Dela Cruz)");

      // If a duplicate Employee ID is found, get the existing record for reference
      const existingRecord =
        duplicateChecks[1].documents.length > 0
          ? duplicateChecks[1].documents[0]
          : duplicateChecks.find((check) => check.documents.length > 0)
              ?.documents[0] || null;

      return {
        isDuplicate: duplicateFields.length > 0,
        duplicateFields,
        existingRecord,
        employeeId: existingRecord?.employeeId,
      };
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      return {
        isDuplicate: false,
        duplicateFields: [],
        existingRecord: null,
        employeeId: null,
      };
    }
  };

  const saveToAppwrite = async (data) => {
    try {
      // Create personal information document first
      const personalDoc = await databases.createDocument(
        databaseId,
        personalCollectionId,
        ID.unique(),
        {
          ...data.personal,
          employeeId: data.personal.employeeId || ID.unique(),
        }
      );

      // Store the employee ID for linking
      const employeeId = personalDoc.employeeId;

      // Add delay between requests to avoid rate limiting
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      // Create all other documents with reference to the personal document
      const collections = [
        {
          id: demographicsCollectionId,
          data: {
            ...data.demographics,
            employeeId: employeeId, // Link to personal record
          },
        },
        {
          id: employmentDetailsCollectionId,
          data: {
            ...data.employment,
            employeeId: employeeId,
          },
        },
        {
          id: genderAwarenessCollectionId,
          data: {
            ...data.genderAwareness,
            employeeId: employeeId,
          },
        },
        {
          id: familyFinancialCollectionId,
          data: {
            ...data.familyFinancial,
            employeeId: employeeId,
          },
        },
        {
          id: childFamPlanCollectionId,
          data: {
            ...data.childFamPlan,
            employeeId: employeeId,
          },
        },
        {
          id: healthMedInfoCollectionId,
          data: {
            ...data.healthMedInfo,
            employeeId: employeeId,
          },
        },
        {
          id: lifestyleCollectionId,
          data: {
            ...data.lifestyle,
            employeeId: employeeId,
          },
        },
        {
          id: workplaceCollectionId,
          data: {
            ...data.workplace,
            employeeId: employeeId,
          },
        },
        {
          id: accessCollectionId,
          data: {
            ...data.access,
            employeeId: employeeId,
          },
        },
        {
          id: physicalCollectionId,
          data: {
            ...data.physical,
            employeeId: employeeId,
          },
        },
      ];

      // Create each related document with proper error handling
      for (const collection of collections) {
        try {
          await databases.createDocument(
            databaseId,
            collection.id,
            ID.unique(),
            collection.data
          );

          // Add a 500ms delay between requests to avoid rate limiting
          await delay(500);
        } catch (error) {
          console.error(
            `Error creating document in collection ${collection.id}:`,
            error.message
          );
          // Log the failed collection and employeeId for debugging
          console.error("Failed to create document for:", {
            collectionId: collection.id,
            employeeId: employeeId,
            error: error.message,
          });
          throw error;
        }
      }

      return true;
    } catch (error) {
      console.error("Error saving record:", error);
      throw error; // Propagate the error to handle it in the calling function
    }
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (
        selectedFile.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel" ||
        selectedFile.type === "text/csv"
      ) {
        setFile(selectedFile);
        // Generate preview
        try {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const workbook = XLSX.read(e.target.result, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            setTotalRecords(jsonData.length);
            // Show first 5 records as preview
            setPreviewData(jsonData.slice(0, 5));
          };
          reader.readAsArrayBuffer(selectedFile);
        } catch (error) {
          console.error("Error generating preview:", error);
          toast({
            title: "Preview generation failed",
            description: "Could not generate preview for the selected file",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an Excel or CSV file",
          variant: "destructive",
        });
        event.target.value = null;
        setFile(null);
        setPreviewData(null);
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(0);
    setCurrentOperation("Reading file...");
    setImportStats(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          setCurrentOperation("Processing Excel data...");
          const workbook = XLSX.read(e.target.result, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const processedData = processExcelData(jsonData);
          setCurrentOperation("Starting import...");

          let successful = 0;
          let failed = 0;
          let skipped = 0;
          const failedRecords = [];
          const duplicateRecords = [];
          const totalRecords = processedData.length;

          for (let i = 0; i < processedData.length; i++) {
            const record = processedData[i];
            const currentRecord = i + 1;

            setProgress((currentRecord / totalRecords) * 100);
            setCurrentOperation(
              `Checking record ${currentRecord} of ${totalRecords}`
            );

            try {
              const duplicateCheck = await isDuplicate(record.personal);

              if (duplicateCheck.isDuplicate) {
                duplicateRecords.push({
                  record: record.personal,
                  duplicateFields: duplicateCheck.duplicateFields,
                  existingRecord: duplicateCheck.existingRecord,
                });
                skipped++;
                continue;
              }

              const saved = await saveToAppwrite(record);
              if (saved) {
                successful++;
              } else {
                failed++;
                failedRecords.push({
                  record: record.personal,
                  error: "Failed to save to database",
                });
              }

              await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (error) {
              failed++;
              failedRecords.push({
                record: record.personal,
                error: error.message,
              });
            }
          }

          setCurrentOperation("Import completed");
          setImportStats({
            total: totalRecords,
            successful,
            failed,
            skipped,
            failedRecords,
            duplicateRecords,
            completedAt: new Date().toLocaleString(),
          });

          toast({
            title: "Import completed",
            description: `Successfully imported ${successful} records. Failed: ${failed}. Skipped duplicates: ${skipped}`,
            variant: successful > 0 ? "default" : "destructive",
          });
        } catch (error) {
          setCurrentOperation("Import failed");
          toast({
            title: "Import failed",
            description: error.message,
            variant: "destructive",
          });
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      setCurrentOperation("Import failed");
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Excel Import</CardTitle>
          <CardDescription>
            Import employee data from Excel or CSV files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Excel or CSV File</label>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={importing}
            />
            <p className="text-sm text-gray-500">
              Accepted formats: .xlsx, .xls, .csv
            </p>
          </div>

          {file && (
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                Selected file: {file.name}
              </div>

              {totalRecords > 0 && (
                <Alert>
                  <AlertTitle>File Summary</AlertTitle>
                  <AlertDescription>
                    Total records to import: {totalRecords}
                  </AlertDescription>
                </Alert>
              )}

              {previewData && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">
                    Preview (First 5 Records)
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Office</TableHead>
                          <TableHead>Position</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {row["Fullname (Ex. Juan A. Dela Cruz)"]}
                            </TableCell>
                            <TableCell>{row["Email Address"]}</TableCell>
                            <TableCell>{row["Offices"]}</TableCell>
                            <TableCell>{row["Status of Employment"]}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          {importing && (
            <div className="mt-4 space-y-4 p-6 border rounded-lg bg-muted/50">
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-lg font-semibold text-primary">
                    Importing data... Please do not close or refresh the page
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {currentOperation}
                    </span>
                    <span className="text-sm font-medium text-primary">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="flex flex-col items-center justify-center space-y-3 text-sm text-muted-foreground bg-background p-4 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Important Notes:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Large files may take several minutes to process</li>
                    <li>Your browser window must remain open</li>
                    <li>
                      The system is checking for duplicates and validating data
                    </li>
                  </ul>
                  {progress > 0 && progress < 100 && (
                    <div className="text-sm mt-2">
                      Estimated time remaining: ~
                      {Math.ceil((100 - progress) / 20)} minutes
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {importStats && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import Results</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>Completed at: {importStats.completedAt}</p>
                  <p>Total records processed: {importStats.total}</p>
                  <p className="text-green-600">
                    Successfully imported: {importStats.successful}
                  </p>
                  {importStats.skipped > 0 && (
                    <p className="text-yellow-600">
                      Skipped duplicates: {importStats.skipped}
                    </p>
                  )}
                  {importStats.failed > 0 && (
                    <p className="text-red-600">Failed: {importStats.failed}</p>
                  )}

                  {importStats.duplicateRecords.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium">Duplicate Records:</p>
                      <div className="max-h-40 overflow-y-auto mt-2">
                        {importStats.duplicateRecords.map((record, index) => (
                          <div
                            key={index}
                            className="text-sm text-yellow-600 mt-1"
                          >
                            {record.record.fullName} - Duplicate fields:{" "}
                            {record.duplicateFields.join(", ")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {importStats.failed > 0 && (
                    <div className="mt-4">
                      <p className="font-medium">Failed Records:</p>
                      <div className="max-h-40 overflow-y-auto mt-2">
                        {importStats.failedRecords.map((record, index) => (
                          <div
                            key={index}
                            className="text-sm text-red-600 mt-1"
                          >
                            {record.record.fullName ||
                              record.record.emailAddress}
                            : {record.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {progress === 0 ? (
                  "Preparing Import..."
                ) : progress === 100 ? (
                  "Finalizing..."
                ) : (
                  <>
                    Importing... {Math.round(progress)}%
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({currentOperation})
                    </span>
                  </>
                )}
              </>
            ) : (
              "Import Data"
            )}
          </Button>

          <div className="mt-4">
            <h3 className="font-medium mb-2">Import Guidelines:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>
                Make sure your Excel file follows the required template format
              </li>
              <li>All required columns must be filled</li>
              <li>Maximum file size: 10MB</li>
              <li>For large datasets, the import may take a few minutes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
