import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import debounce from "lodash/debounce";
import {
  databases,
  databaseId,
  participantCollectionId,
  eventCollectionId,
} from "@/lib/appwrite";
import {
  parseNaturalLanguageQuery,
  buildAppwriteQueries,
} from "@/utils/nlpUtils";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { Query } from "appwrite";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function AdvancedSearch({ onFilterChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchFilteredData = useCallback(
    debounce(async (query) => {
      setIsLoading(true);
      setError("");

      try {
        console.log("Search query:", query);
        const parsedQuery = parseNaturalLanguageQuery(query);
        console.log("Parsed query:", parsedQuery);
        const appwriteQueries = buildAppwriteQueries(parsedQuery);
        console.log("Appwrite queries:", appwriteQueries);

        if (!appwriteQueries || appwriteQueries.length === 0) {
          console.warn("No valid queries generated from the search input.");
          setFilteredData([]);
          return;
        }

        const response = await databases.listDocuments(
          databaseId,
          participantCollectionId,
          appwriteQueries
        );

        console.log("Response:", response);

        setFilteredData(response.documents);
        onFilterChange(response.documents);
      } catch (error) {
        console.error("Error fetching filtered data:", error);
        setError("An error occurred while fetching data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );
  
  useEffect(() => {
    if (searchQuery) {
      fetchFilteredData(searchQuery);
    }
  }, [searchQuery, fetchFilteredData]);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const formatEventDate = (dateString) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const renderCharts = () => {
    const genderData = filteredData.reduce(
      (acc, participant) => {
        acc[participant.sex.toLowerCase()]++;
        return acc;
      },
      { male: 0, female: 0 }
    );

    const ageData = filteredData.reduce(
      (acc, participant) => {
        const age = parseInt(participant.age);
        if (age <= 18) acc["18-"]++;
        else if (age < 25) acc["18-24"]++;
        else if (age < 35) acc["25-34"]++;
        else if (age < 45) acc["35-44"]++;
        else if (age < 55) acc["45-54"]++;
        else acc["55+"]++;
        return acc;
      },
      { "18-": 0, "18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55+": 0 }
    );

    return (
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              options={{
                labels: ["Male", "Female"],
                colors: ["#4299E1", "#ED64A6"],
              }}
              series={[genderData.male, genderData.female]}
              type="pie"
              width="100%"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              options={{
                xaxis: {
                  categories: Object.keys(ageData),
                },
              }}
              series={[
                {
                  name: "Participants",
                  data: Object.values(ageData),
                },
              ]}
              type="bar"
              width="100%"
            />
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Search</CardTitle>
        <CardDescription>
          Search using natural language (e.g., "Male attendees in IT Week aged
          21-35 between March 2022 and May 2024")
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="search">Search Query</Label>
          <Input
            id="search"
            type="text"
            placeholder="Enter your search query..."
            value={searchQuery}
            onChange={handleInputChange}
          />
        </div>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {filteredData.length > 0 && (
          <>
            <p>Found {filteredData.length} results</p>
            {renderCharts()}
            <div className="mt-4 h-96 overflow-hidden">
              <div className="overflow-auto h-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Event Date</TableHead>
                      <TableHead>Event Time</TableHead>
                      <TableHead>Event Venue</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Event Category</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Ethnic Group</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.$id}>
                        <TableCell>{item.eventDetails?.eventName}</TableCell>
                        <TableCell>
                          {item.eventDetails?.eventDate
                            ? formatEventDate(item.eventDetails.eventDate)
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {item.eventDetails?.eventTimeFrom &&
                          item.eventDetails?.eventTimeTo
                            ? `${format(
                                new Date(item.eventDetails.eventTimeFrom),
                                "HH:mm"
                              )} - ${format(
                                new Date(item.eventDetails.eventTimeTo),
                                "HH:mm"
                              )}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>{item.eventDetails?.eventVenue}</TableCell>
                        <TableCell>{item.eventDetails?.eventType}</TableCell>
                        <TableCell>
                          {item.eventDetails?.eventCategory}
                        </TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.sex}</TableCell>
                        <TableCell>{item.age}</TableCell>
                        <TableCell>{item.school}</TableCell>
                        <TableCell>{item.year}</TableCell>
                        <TableCell>{item.section}</TableCell>
                        <TableCell>{item.ethnicGroup}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
        {filteredData.length === 0 && searchQuery && !isLoading && (
          <p>No results found for your search query.</p>
        )}
      </CardContent>
    </Card>
  );
}
