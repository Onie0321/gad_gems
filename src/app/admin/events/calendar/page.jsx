'use client'

import { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getEvents, editEvent, createEvent, deleteEvent, subscribeToRealTimeUpdates, eventCollectionId } from '@/lib/appwrite'

export function Calendar() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const calendarRef = useRef(null)

  useEffect(() => {
    fetchEvents()
    const unsubscribe = subscribeToRealTimeUpdates(eventCollectionId, fetchEvents)
    return () => unsubscribe()
  }, [])

  const fetchEvents = async () => {
    try {
      const fetchedEvents = await getEvents()
      const formattedEvents = fetchedEvents.map(event => ({
        id: event.$id,
        title: event.eventName,
        start: new Date(event.eventDate + 'T' + event.eventTimeFrom),
        end: new Date(event.eventDate + 'T' + event.eventTimeTo),
        extendedProps: {
          venue: event.eventVenue,
          category: event.eventType
        }
      }))
      setEvents(formattedEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const handleEventClick = (info) => {
    setSelectedEvent(info.event)
    setIsDialogOpen(true)
  }

  const handleEventDrop = async (info) => {
    const { event } = info
    try {
      await editEvent(event.id, {
        eventDate: event.start.toISOString().split('T')[0],
        eventTimeFrom: event.start.toTimeString().split(' ')[0],
        eventTimeTo: event.end.toTimeString().split(' ')[0],
      })
      fetchEvents()
    } catch (error) {
      console.error('Error updating event:', error)
      info.revert()
    }
  }

  const handleDateSelect = async (selectInfo) => {
    const title = prompt('Please enter a title for your event')
    if (title) {
      const calendarApi = selectInfo.view.calendar
      calendarApi.unselect()
      try {
        await createEvent({
          eventName: title,
          eventDate: selectInfo.start.toISOString().split('T')[0],
          eventTimeFrom: selectInfo.start.toTimeString().split(' ')[0],
          eventTimeTo: selectInfo.end.toTimeString().split(' ')[0],
          eventVenue: prompt('Please enter the venue for your event') || 'TBD',
          eventType: prompt('Please enter the category for your event') || 'default'
        })
        fetchEvents()
      } catch (error) {
        console.error('Error creating event:', error)
      }
    }
  }

  const handleEventDelete = async () => {
    if (selectedEvent) {
      try {
        await deleteEvent(selectedEvent.id)
        setIsDialogOpen(false)
        fetchEvents()
      } catch (error) {
        console.error('Error deleting event:', error)
      }
    }
  }

  const renderEventContent = (eventInfo) => {
    return (
      <div className="p-1 text-xs">
        <div className="font-bold">{eventInfo.event.title}</div>
        <div>{eventInfo.event.extendedProps.venue}</div>
        <div>{eventInfo.event.extendedProps.category}</div>
      </div>
    )
  }

  return (
    <div className="h-[600px]">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        select={handleDateSelect}
      />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              <p>Start: {selectedEvent?.start.toLocaleString()}</p>
              <p>End: {selectedEvent?.end.toLocaleString()}</p>
              <p>Venue: {selectedEvent?.extendedProps.venue}</p>
              <p>Category: {selectedEvent?.extendedProps.category}</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
            <Button variant="destructive" onClick={handleEventDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

