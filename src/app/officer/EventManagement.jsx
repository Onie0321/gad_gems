"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastContainer, toast } from "react-toastify";
import EventOverview from "./event-management/EventOverview";
import CreateEvent from "./event-management/CreateEvent";
import ParticipantManagement from "./event-management/ParticipantManagement";
import EventParticipantLog from "./event-management/event-participant-log/EventParticipantLog";
import {
  subscribeToRealTimeUpdates,
  getCurrentUser,
  fetchOfficerEvents,
  getCurrentAcademicPeriod,
} from "@/lib/appwrite";
import { useTabContext, TabProvider } from "@/context/TabContext";
import { checkNetworkStatus } from "@/utils/networkUtils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Plus, Upload, Loader2 } from "lucide-react";
import { importEventAndParticipants } from "@/utils/importUtils";
import { ColorfulSpinner } from "@/components/ui/loader";
import { NetworkStatus } from "@/components/ui/network-status";

export default function EventsManagement() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: true,
    isLow: false,
    message: "",
  });
  const [currentAcademicPeriod, setCurrentAcademicPeriod] = useState(null);
  const router = useRouter();
  const userIdRef = useRef(null);
  const eventsCache = useRef(new Map());

  // Network status monitoring
  useEffect(() => {
    const checkNetwork = async () => {
      const status = await checkNetworkStatus();
      setNetworkStatus(status);

      if (!status.isOnline) {
        toast.error(status.message);
      } else if (status.isLow) {
        toast.warning(status.message);
      }
    };

    checkNetwork();

    const handleOnline = () => {
      setNetworkStatus((prev) => ({ ...prev, isOnline: true, message: "" }));
      if (userIdRef.current) {
        fetchEvents(userIdRef.current);
      }
    };

    const handleOffline = () => {
      setNetworkStatus({
        isOnline: false,
        message:
          "No internet connection detected. Some features may be unavailable.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const networkCheckInterval = setInterval(checkNetwork, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(networkCheckInterval);
    };
  }, []);

  // Add useEffect for fetching academic period
  useEffect(() => {
    const fetchAcademicPeriod = async () => {
      try {
        const period = await getCurrentAcademicPeriod();
        setCurrentAcademicPeriod(period);
      } catch (error) {
        toast.error("Failed to fetch academic period");
      }
    };

    fetchAcademicPeriod();
  }, []);

  const fetchEvents = useCallback(
    async (accountId) => {
      if (!accountId) {
        console.error("User ID is missing, cannot fetch events");
        return;
      }

      try {
        // Only show loading if we already have events
        if (events.length > 0) {
          setLoading(true);
        }

        // Check cache first
        const cacheKey = `events-${accountId}`;
        const cachedData = eventsCache.current.get(cacheKey);
        const now = Date.now();

        if (cachedData && now - cachedData.timestamp < 5 * 60 * 1000) {
          setEvents(cachedData.data);
          if (cachedData.data.length > 0 && !currentEventId) {
            setCurrentEventId(cachedData.data[0].$id);
          }
          return;
        }

        const { events: fetchedEvents, currentPeriod } =
          await fetchOfficerEvents(accountId);

        // Update the academic period if it's returned
        if (currentPeriod) {
          setCurrentAcademicPeriod(currentPeriod);
        }

        // Cache the results
        eventsCache.current.set(cacheKey, {
          data: fetchedEvents,
          timestamp: now,
        });

        setEvents(fetchedEvents);
        if (fetchedEvents.length > 0 && !currentEventId) {
          setCurrentEventId(fetchedEvents[0].$id);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error("Failed to fetch events");
      } finally {
        setLoading(false);
      }
    },
    [currentEventId, events.length]
  );

  useEffect(() => {
    const initializeUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const status = await checkNetworkStatus();
        setNetworkStatus(status);

        if (!status.isOnline) {
          setError(status.message);
          return;
        }

        const currentUser = await getCurrentUser();

        if (currentUser && currentUser.$id) {
          setUser(currentUser);
          userIdRef.current = currentUser.$id;
          await fetchEvents(currentUser.$id);
        } else {
          setError("No user found or invalid user data");
          router.push("/signin");
        }
      } catch (error) {
        console.error("Error initializing user:", error);
        setError(
          networkStatus.isOnline
            ? "Failed to initialize user. Please try again."
            : networkStatus.message
        );
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [fetchEvents, router]);

  useEffect(() => {
    let unsubscribe;
    if (userIdRef.current && networkStatus.isOnline) {
      unsubscribe = subscribeToRealTimeUpdates(() => {
        if (userIdRef.current) {
          fetchEvents(userIdRef.current);
        } else {
          console.error("User ID is not available for real-time updates");
        }
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchEvents, networkStatus.isOnline]);

  const handleEventCreated = async (newEvent, isImported = false) => {
    try {
      // Update events list
      setEvents((prevEvents) => [...prevEvents, newEvent]);

      // Set the current event
      setCurrentEvent(newEvent);
      setCurrentEventId(newEvent.$id);

      // Navigate to participant management if not imported
      if (!isImported) {
        setActiveTab("participants");
      }

      console.log("Event created and selected:", {
        newEvent,
        currentEventId: newEvent.$id,
        isImported,
      });
    } catch (error) {
      console.error("Error in handleEventCreated:", error);
      toast.error("Error setting up new event");
    }
  };

  const getEmptyStateMessage = (tab) => {
    switch (tab) {
      case "overview":
        return {
          title: "No Events Overview Available",
          description: "There are no events in the current academic period",
        };
      case "participants":
        return {
          title: "No Events Available",
          description: "There are no events in the current academic period",
        };
      case "log":
        return {
          title: "No Event Logs Available",
          description: "There are no events in the current academic period",
        };
      default:
        return {
          title: "No Events Available",
          description: "There are no events in the current academic period",
        };
    }
  };

  const handleImportEvent = async (file) => {
    try {
      setLoading(true);

      if (!currentAcademicPeriod || !currentAcademicPeriod.$id) {
        toast.error(
          "No active academic period found. Please set up an academic period first."
        );
        return;
      }

      const result = await importEventAndParticipants(
        file,
        currentAcademicPeriod.$id
      );

      if (result.success) {
        toast.success(result.message);
        await handleEventCreated(result.event, true);
      } else {
        toast.error(result.message || "Failed to import event");
      }
    } catch (error) {
      toast.error(error.message || "Failed to import event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === "log") {
      setCurrentEventId(null);
      setCurrentEvent(null);
    }
  };

  if (!networkStatus.isOnline) {
    return (
      <NetworkStatus
        title="No Internet Connection"
        message="Please check your internet connection and try again."
        onRetry={() => window.location.reload()}
        isOffline={true}
      />
    );
  }

  if (error) {
    return (
      <NetworkStatus
        title="Connection Error"
        message={error}
        onRetry={() => fetchEvents(userIdRef.current)}
        isOffline={false}
      />
    );
  }

  return (
    <>
      {/* Loading state */}
      {loading && (
        <div className="flex h-screen items-center justify-center">
          <ColorfulSpinner />
        </div>
      )}

      {/* No user state */}
      {!loading && !error && !user && (
        <div className="flex h-screen flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Main content */}
      {!loading && !error && user && (
        <TabProvider value={{ activeTab, setActiveTab }}>
          <ToastContainer />
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="createEvent">Create Event</TabsTrigger>
              <TabsTrigger value="participants">
                Participant Management
              </TabsTrigger>
              <TabsTrigger value="log">Event Participant Log</TabsTrigger>
            </TabsList>

            {/* Show welcome card if no events exist and not on createEvent tab */}
            {events.length === 0 && activeTab !== "createEvent" ? (
              <div className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome to Event Management</CardTitle>
                    <CardDescription>
                      Get started by creating your first event or importing an
                      existing one.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <Button onClick={() => setActiveTab("createEvent")}>
                      <Plus className="mr-2 h-4 w-4" /> Create Your First Event
                    </Button>
                    <div className="flex items-center gap-2">
                      <div className="bg-border h-px w-12"></div>
                      <span className="text-sm text-muted-foreground">or</span>
                      <div className="bg-border h-px w-12"></div>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        id="welcomeImportFile"
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImportEvent(e.target.files[0]);
                          }
                        }}
                      />
                      <Button
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() =>
                          document.getElementById("welcomeImportFile").click()
                        }
                      >
                        <Upload className="mr-2 h-4 w-4" /> Import Your First
                        Event
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <TabsContent value="overview">
                  <EventOverview
                    events={events}
                    currentEventId={currentEventId}
                    setCurrentEventId={setCurrentEventId}
                    user={user}
                    networkStatus={networkStatus}
                    currentAcademicPeriod={currentAcademicPeriod}
                  />
                </TabsContent>
                <TabsContent value="createEvent">
                  <CreateEvent
                    user={user}
                    currentAcademicPeriod={currentAcademicPeriod}
                    onEventCreated={handleEventCreated}
                    setActiveTab={setActiveTab}
                  />
                </TabsContent>
                <TabsContent value="participants">
                  <ParticipantManagement
                    events={events}
                    currentEventId={currentEventId}
                    setCurrentEventId={setCurrentEventId}
                    currentEvent={currentEvent}
                    setCurrentEvent={setCurrentEvent}
                    user={user}
                    setActiveTab={setActiveTab}
                    networkStatus={networkStatus}
                    currentAcademicPeriod={currentAcademicPeriod}
                  />
                </TabsContent>
                <TabsContent value="log">
                  <EventParticipantLog
                    events={events}
                    currentEventId={currentEventId}
                    user={user}
                    networkStatus={networkStatus}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </TabProvider>
      )}
    </>
  );
}
