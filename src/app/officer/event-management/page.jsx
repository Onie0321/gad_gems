import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EventOverview from "./event-overview/page";
import CreateEvent from "./create-event/page";
import ParticipantManagement from "./participant-management/page";
import EventParticipantLog from "./event-participant-log/page";
import {
  getEvents,
  getParticipants,
  subscribeToRealTimeUpdates,
  getCurrentUser,
} from "@/lib/appwrite";
import GADConnectSimpleLoader from "@/components/loading/simpleLoading";
import { useTabContext, TabProvider } from "@/context/TabContext";

function EventsManagement() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();
  const userIdRef = useRef(null);

  const fetchEvents = useCallback(
    async (accountId) => {
      if (!accountId) {
        console.error("User ID is missing, cannot fetch events");
        return;
      }
      try {
        const fetchedEvents = await getEvents(accountId);
        setEvents(fetchedEvents);
        if (fetchedEvents.length > 0 && !currentEventId) {
          setCurrentEventId(fetchedEvents[0].$id);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error("Failed to fetch events");
      }
    },
    [currentEventId]
  );

  useEffect(() => {
    const initializeUser = async () => {
      try {
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
        toast.error("Failed to initialize user");
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [fetchEvents, router]);

  useEffect(() => {
    let unsubscribe;
    if (userIdRef.current) {
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
  }, [fetchEvents]);

  const handleEventCreated = (newEvent) => {
    fetchEvents(userIdRef.current);
    setCurrentEventId(newEvent.$id);
    setActiveTab("participants");
  };

  if (loading) {
    return <GADConnectSimpleLoader />;
  }

  if (!user) {
    return <div>Please log in to view events</div>;
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
        <TabsContent value="overview">
          <EventOverview
            events={events}
            currentEventId={currentEventId}
            setCurrentEventId={setCurrentEventId}
            user={user}
          />
        </TabsContent>
        <TabsContent value="createEvent">
          <CreateEvent onEventCreated={handleEventCreated} user={user} />
        </TabsContent>
        <TabsContent value="participants">
          <ParticipantManagement
            events={events}
            currentEventId={currentEventId}
            setCurrentEventId={setCurrentEventId}
            user={user}
            setActiveTab={setActiveTab} 
          />
        </TabsContent>
        <TabsContent value="log">
          <EventParticipantLog
            events={events}
            currentEventId={currentEventId}
            user={user}
          />
        </TabsContent>
      </Tabs>
    </TabProvider>
  );
}

export default EventsManagement;
