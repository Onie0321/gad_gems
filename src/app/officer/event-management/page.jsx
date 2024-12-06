'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import EventOverview from './event-overview/page'
import CreateEvent from './create-event/page'
import ParticipantManagement from './participant-management/page'
import EventParticipantLog from './event-participant-log/page'
import { getEvents, getParticipants, subscribeToRealTimeUpdates } from '@/lib/appwrite'

export default function EventManagement() {
  const [events, setEvents] = useState([])
  const [participants, setParticipants] = useState([])
  const [activeSection, setActiveSection] = useState("overview")
  const [currentEventId, setCurrentEventId] = useState(null)
  const [loading, setLoading] = useState(true)

 
  useEffect(() => {
    fetchEvents()
    const unsubscribe = subscribeToRealTimeUpdates(fetchEvents)
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (currentEventId) {
      fetchParticipants(currentEventId)
    }
  }, [currentEventId])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const fetchedEvents = await getEvents()
      setEvents(fetchedEvents)
      if (fetchedEvents.length > 0 && !currentEventId) {
        setCurrentEventId(fetchedEvents[0].$id)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const fetchParticipants = async (eventId) => {
    try {
      const fetchedParticipants = await getParticipants(eventId)
      setParticipants(fetchedParticipants)
    } catch (error) {
      console.error('Error fetching participants:', error)
      toast.error('Failed to fetch participants')
    }
  }

  const handleEventCreated = (newEvent) => {
    setEvents([...events, newEvent])
    setCurrentEventId(newEvent.$id)
    setActiveSection("participants")
    toast.success("Event created successfully. You can now add participants.")
  }

  const handleParticipantAdded = (newParticipant) => {
    setParticipants([...participants, newParticipant])
    toast.success("Participant added successfully")
  }

  return (
    <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Event Overview</TabsTrigger>
        <TabsTrigger value="create">Create Event</TabsTrigger>
        <TabsTrigger value="participants">Participant Management</TabsTrigger>
        <TabsTrigger value="log">Event & Participant Log</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <EventOverview 
          events={events} 
          participants={participants} 
          setActiveSection={setActiveSection} 
          loading={loading}
        />
      </TabsContent>
      <TabsContent value="create">
        <CreateEvent 
          events={events} 
          setEvents={setEvents} 
          onEventCreated={handleEventCreated} 
          setActiveSection={setActiveSection} 
          setCurrentEventId={setCurrentEventId}
        />
      </TabsContent>
      <TabsContent value="participants">
        <ParticipantManagement 
          events={events} 
          participants={participants} 
          onParticipantAdded={handleParticipantAdded}
          setParticipants={setParticipants}
          currentEventId={currentEventId}
          setActiveSection={setActiveSection}
          loading={loading}
          setCurrentEventId={setCurrentEventId}
        />
      </TabsContent>
      <TabsContent value="log">
        <EventParticipantLog events={events} participants={participants} loading={loading} />
      </TabsContent>
      <ToastContainer position="bottom-right" />
    </Tabs>
  )
}

