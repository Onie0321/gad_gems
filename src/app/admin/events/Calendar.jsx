'use client'

import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment-timezone'
import "react-big-calendar/lib/css/react-big-calendar.css"
import { styled } from "@mui/system"
import { ThemeProvider, createTheme } from '@mui/material/styles'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CssBaseline,
  Snackbar,
  Alert,
} from '@mui/material'
import { getEvents, editEvent, createEvent, deleteEvent, subscribeToRealTimeUpdates, eventCollectionId } from '@/lib/appwrite'

const localizer = momentLocalizer(moment)

// Styled components for calendar
const StyledCalendarWrapper = styled("div")(({ theme }) => ({
  "& .rbc-calendar": {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
  },
  "& .rbc-header": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(1),
  },
  "& .rbc-today": {
    backgroundColor: theme.palette.action.selected,
  },
  "& .rbc-event": {
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
  },
}))

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogTitle-root": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  "& .MuiDialogContent-root": {
    padding: theme.spacing(3),
  },
}))

export function EventCalendar() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info"
  })
  const [currentView, setCurrentView] = useState('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Create theme
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#90caf9',
      },
      secondary: {
        main: '#f48fb1',
      },
    },
  })

  useEffect(() => {
    fetchEvents()
    const unsubscribe = subscribeToRealTimeUpdates(eventCollectionId, fetchEvents)
    return () => unsubscribe()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const fetchedEvents = await getEvents()
      const formattedEvents = fetchedEvents.map(event => ({
        id: event.$id,
        title: `${event.eventName} - ${event.eventVenue}`,
        start: new Date(event.eventDate + 'T' + event.eventTimeFrom),
        end: new Date(event.eventDate + 'T' + event.eventTimeTo),
        venue: event.eventVenue,
        eventName: event.eventName,
        category: event.eventType,
        description: event.eventDescription || '',
      }))
      setEvents(formattedEvents)
      showNotification("Events loaded successfully", "success")
    } catch (error) {
      console.error('Error fetching events:', error)
      showNotification("Failed to load events", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleEventClick = (event) => {
    setSelectedEvent(event)
    setIsDialogOpen(true)
  }

  const handleEventDrop = async (info) => {
    try {
      await editEvent(info.event.id, {
        eventDate: info.event.start.toISOString().split('T')[0],
        eventTimeFrom: info.event.start.toTimeString().split(' ')[0],
        eventTimeTo: info.event.end.toTimeString().split(' ')[0],
      })
      showNotification("Event updated successfully", "success")
      fetchEvents()
    } catch (error) {
      console.error('Error updating event:', error)
      showNotification("Failed to update event", "error")
      info.revert()
    }
  }

  const handleDateSelect = async (selectInfo) => {
    const title = prompt('Please enter a title for your event')
    if (title) {
      try {
        await createEvent({
          eventName: title,
          eventDate: selectInfo.start.toISOString().split('T')[0],
          eventTimeFrom: selectInfo.start.toTimeString().split(' ')[0],
          eventTimeTo: selectInfo.end.toTimeString().split(' ')[0],
          eventVenue: prompt('Please enter the venue') || 'TBD',
          eventType: prompt('Please enter the category') || 'default'
        })
        showNotification("Event created successfully", "success")
        fetchEvents()
      } catch (error) {
        console.error('Error creating event:', error)
        showNotification("Failed to create event", "error")
      }
    }
  }

  const handleEventDelete = async () => {
    if (selectedEvent) {
      try {
        await deleteEvent(selectedEvent.id)
        setIsDialogOpen(false)
        showNotification("Event deleted successfully", "success")
        fetchEvents()
      } catch (error) {
        console.error('Error deleting event:', error)
        showNotification("Failed to delete event", "error")
      }
    }
  }

  const showNotification = (message, severity = "info") => {
    setNotification({ open: true, message, severity })
  }

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.category === 'important' ? '#f44336' : '#2196f3',
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: 'none',
      display: 'block'
    }
  })

  // Custom event component to display event details
  const EventComponent = ({ event }) => (
    <div style={{ height: '100%', padding: '2px 4px' }}>
      <strong>{event.eventName}</strong>
      <br />
      <small>{event.venue}</small>
    </div>
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StyledCalendarWrapper>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          onSelectEvent={handleEventClick}
          onEventDrop={handleEventDrop}
          onSelectSlot={handleDateSelect}
          selectable
          eventPropGetter={eventStyleGetter}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          views={['month', 'week', 'day', 'agenda']}
          components={{
            event: EventComponent
          }}
          formats={{
            eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
              `${localizer.format(start, 'h:mm a', culture)} - ${localizer.format(end, 'h:mm a', culture)}`,
          }}
        />

        <StyledDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
          <DialogTitle>Event Details</DialogTitle>
          <DialogContent>
            {selectedEvent && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedEvent.eventName}
                </Typography>
                <Typography variant="body1">
                  <strong>Venue:</strong> {selectedEvent.venue}
                </Typography>
                <Typography variant="body1">
                  <strong>Date:</strong> {moment(selectedEvent.start).format('LL')}
                </Typography>
                <Typography variant="body1">
                  <strong>Time:</strong> {moment(selectedEvent.start).format('LT')} - {moment(selectedEvent.end).format('LT')}
                </Typography>
                {selectedEvent.description && (
                  <Typography variant="body1">
                    <strong>Description:</strong> {selectedEvent.description}
                  </Typography>
                )}
                <Typography variant="body1">
                  <strong>Category:</strong> {selectedEvent.category}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEventDelete} color="error" variant="contained">
              Delete
            </Button>
            <Button onClick={() => setIsDialogOpen(false)} variant="outlined">
              Close
            </Button>
          </DialogActions>
        </StyledDialog>

        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert
            onClose={() => setNotification({ ...notification, open: false })}
            severity={notification.severity}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </StyledCalendarWrapper>
    </ThemeProvider>
  )
}

