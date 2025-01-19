import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastContainer, toast } from "react-toastify";
import EventOverview from "./event-overview/page";
import CreateEvent from "./create-event/page";
import ParticipantManagement from "./participant-management/page";
import EventParticipantLog from "./event-participant-log/page";
import {
  subscribeToRealTimeUpdates,
  getCurrentUser,
  fetchOfficerEvents,
} from "@/lib/appwrite";
import GADConnectSimpleLoader from "@/components/loading/simpleLoading";
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
import { Plus, Upload } from "lucide-react";
import { importEventAndParticipants } from "@/utils/importUtils";

export default function EventsManagement() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [currentEventId, setCurrentEventId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: true,
    isLow: false,
    message: "",
  });
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

  const fetchEvents = useCallback(
    async (accountId) => {
      if (!accountId) {
        console.error("User ID is missing, cannot fetch events");
        return;
      }

      try {
        // Only show loading if we already have events
        if (events.length > 0) {
          setLoadingMessage("Fetching events...");
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

        const { events: fetchedEvents } = await fetchOfficerEvents(accountId);

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
        setLoadingMessage("Checking network status...");
        const status = await checkNetworkStatus();
        setNetworkStatus(status);

        if (!status.isOnline) {
          toast.error(status.message);
          setLoading(false);
          return;
        }

        setLoadingMessage("Authenticating user...");
        const currentUser = await getCurrentUser();

        if (currentUser && currentUser.$id) {
          setUser(currentUser);
          userIdRef.current = currentUser.$id;
          await fetchEvents(currentUser.$id);
        } else {
          console.error("No user found or invalid user data");
          router.push("/signin");
        }
      } catch (error) {
        console.error("Error initializing user:", error);
        toast.error(
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
      // Fetch events to update the list
      await fetchEvents(userIdRef.current);

      // Set the current event ID to the newly created event
      setCurrentEventId(newEvent.$id);

      // If this is the first event (events array was empty before)
      if (events.length === 0) {
        // Update events array with the new event
        setEvents([newEvent]);

        // For imported events, go to log tab
        // For created events, go to participant management tab
        setActiveTab(isImported ? "log" : "participants");

        // Show appropriate welcome message
        toast.success(
          isImported
            ? "Event imported successfully! You can now view the participant log."
            : "Event created successfully! You can now add participants to your event.",
          {
            autoClose: 5000,
          }
        );
      } else {
        // If not the first event, go to participant management for created events
        // or log tab for imported events
        setActiveTab(isImported ? "log" : "participants");
      }
    } catch (error) {
      console.error("Error handling event creation:", error);
      toast.error("An error occurred while updating the event list");
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
      const result = await importEventAndParticipants(file);

      if (result.success) {
        toast.success(result.message);
        // Pass true as second argument to indicate this is an imported event
        await handleEventCreated(result.event, true);
      } else {
        toast.error(result.message || "Failed to import event");
      }
    } catch (error) {
      console.error("Error importing event:", error);
      toast.error("Failed to import event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderEmptyState = (activeTab) => (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>{getEmptyStateMessage(activeTab).title}</CardTitle>
        <CardDescription>
          {getEmptyStateMessage(activeTab).description}
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
            id="importFile"
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
            onClick={() => document.getElementById("importFile").click()}
          >
            <Upload className="mr-2 h-4 w-4" /> Import Your First Event
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <GADConnectSimpleLoader />
        <p className="mt-4 text-gray-600">{loadingMessage}</p>
        {networkStatus.isLow && (
          <p className="mt-2 text-yellow-600">{networkStatus.message}</p>
        )}
      </div>
    );
  }

  return (
    <TabProvider value={{ activeTab, setActiveTab }}>
      <ToastContainer />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="createEvent">Create Event</TabsTrigger>
          <TabsTrigger value="participants">Participant Management</TabsTrigger>
          <TabsTrigger value="log">Participant Log</TabsTrigger>
        </TabsList>

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
                {/* ... rest of empty state UI */}
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
              />
            </TabsContent>
            <TabsContent value="createEvent">
              <CreateEvent
                onEventCreated={handleEventCreated}
                user={user}
                networkStatus={networkStatus}
              />
            </TabsContent>
            <TabsContent value="participants">
              <ParticipantManagement
                events={events}
                currentEventId={currentEventId}
                setCurrentEventId={setCurrentEventId}
                user={user}
                setActiveTab={setActiveTab}
                networkStatus={networkStatus}
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
  );
}
