import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"

import { Loader2, Plus, CalendarIcon, HelpCircle, Search, Edit, Trash2, Users, BarChart, ClipboardList, Eye, Save, PlusCircle, ArrowUpDown,  } from 'lucide-react'
import { cn } from "@/lib/utils"

// Simulated database of events and participants
let events = []
let participants = []

// Helper function to simulate server delay
const simulateServerDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// School options and their abbreviations
const schoolOptions = [
  { name: "School of Accountancy and Business Management", abbr: "SABM" },
  { name: "School of Agricultural Science", abbr: "SAS" },
  { name: "School of Arts and Sciences", abbr: "SASc" },
  { name: "School of Education", abbr: "SED" },
  { name: "School of Engineering", abbr: "SOE" },
  { name: "School of Fisheries and Oceanic Science", abbr: "SFOS" },
  { name: "School of Forestry and Environmental Sciences", abbr: "SFES" },
  { name: "School of Industrial Technology", abbr: "SIT" },
  { name: "School of Information Technology", abbr: "SITech" },
]

const questionTypes = [
    { value: 'multiple', label: 'Multiple Choice' },
    { value: 'single', label: 'Single Choice' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'rating', label: 'Rating Scale' },
    { value: 'text', label: 'Text Input' },
  ]

export default function EventsSection() {
    const [step, setStep] = useState('overview')
    const [eventName, setEventName] = useState('')
    const [eventDate, setEventDate] = useState(null)
    const [eventTimeFrom, setEventTimeFrom] = useState('')
    const [eventTimeTo, setEventTimeTo] = useState('')
    const [eventVenue, setEventVenue] = useState('')
    const [eventType, setEventType] = useState('')
    const [eventCategory, setEventCategory] = useState('')
    const [duration, setDuration] = useState('')
    const [loading, setLoading] = useState(false)
    const [currentEventId, setCurrentEventId] = useState(null)
    const [errors, setErrors] = useState({})
    const [searchTerm, setSearchTerm] = useState('')
    const [sortCriteria, setSortCriteria] = useState('dateAdded')
    const [statusFilter, setStatusFilter] = useState('all')
    const [schoolFilter, setSchoolFilter] = useState('all')
    const [yearFilter, setYearFilter] = useState('all')
    const [isEditingParticipant, setIsEditingParticipant] = useState(false)
  
    const [participantData, setParticipantData] = useState({
      studentId: '',
      name: '',
      sex: '',
      age: '',
      school: '',
      year: '',
      section: '',
      ethnicGroup: '',
      otherEthnicGroup: '',
      status: 'Pending',
    })
  
    const [summaryStats, setSummaryStats] = useState({
      total: 0,
      academic: 0,
      nonAcademic: 0,
    })
  
    const [addButtonText, setAddButtonText] = useState('Add Participant')
  
    useEffect(() => {
      if (eventTimeFrom && eventTimeTo) {
        const start = parse(eventTimeFrom, 'HH:mm', new Date())
        const end = parse(eventTimeTo, 'HH:mm', new Date())
        const hours = differenceInHours(end, start)
        const minutes = differenceInMinutes(end, start) % 60
        setDuration(`${hours} hours ${minutes} minutes`)
      }
    }, [eventTimeFrom, eventTimeTo])
  
    useEffect(() => {
      // Update summary statistics
      setSummaryStats({
        total: events.length,
        academic: events.filter(e => e.type === 'Academic').length,
        nonAcademic: events.filter(e => e.type === 'Non-Academic').length,
      })
    }, [events])
  
    const capitalizeWords = (input) => {
      return input.replace(/\b\w/g, (char) => char.toUpperCase())
    }
  
    const formatStudentId = (input) => {
      const numbers = input.replace(/\D/g, '').slice(0, 8)
      if (numbers.length <= 2) return numbers
      if (numbers.length <= 4) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4)}`
    }
  
    const validateEventForm = () => {
      const newErrors = {}
      if (!eventDate) newErrors.eventDate = 'Event date is required'
      if (!eventName.trim()) newErrors.eventName = 'Event name is required'
      if (!eventTimeFrom) newErrors.eventTimeFrom = 'Start time is required'
      if (!eventTimeTo) newErrors.eventTimeTo = 'End time is required'
      if (!eventVenue.trim()) newErrors.eventVenue = 'Venue is required'
      if (!eventType) newErrors.eventType = 'Event type is required'
      if (!eventCategory) newErrors.eventCategory = 'Category is required'
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }
  
    const validateParticipantForm = () => {
      const newErrors = {}
      if (participantData.studentId.length !== 10) newErrors.studentId = 'Student ID must be in the format 00-00-0000'
      if (!participantData.name.trim()) newErrors.name = 'Name is required'
      if (!participantData.sex) newErrors.sex = 'Sex is required'
      if (!participantData.age) newErrors.age = 'Age is required'
      else {
        const age = parseInt(participantData.age)
        if (age < 1 || age > 125) newErrors.age = 'Age must be between 1 and 125'
      }
      if (!participantData.school) newErrors.school = 'School is required'
      if (!participantData.year) newErrors.year = 'Year is required'
      if (!participantData.section.trim()) newErrors.section = 'Section is required'
      if (!participantData.ethnicGroup) newErrors.ethnicGroup = 'Ethnic group is required'
      if (participantData.ethnicGroup === 'Other' && !participantData.otherEthnicGroup.trim()) {
        newErrors.otherEthnicGroup = 'Please specify the ethnic group'
      }
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }
  
    const handleCreateEvent = async (e) => {
      e.preventDefault()
      if (!validateEventForm()) return
  
      // Check for duplicate event name
      if (events.some(event => event.name.toLowerCase() === eventName.toLowerCase())) {
        toast.error("An event with this name already exists. Please choose a unique name.")
        return
      }
  
      setLoading(true)
      await simulateServerDelay(1000) // Simulate server delay
      const newEvent = { 
        id: Date.now(), 
        name: eventName, 
        date: format(eventDate, 'yyyy-MM-dd'),
        timeFrom: eventTimeFrom,
        timeTo: eventTimeTo,
        venue: eventVenue,
        type: eventType,
        category: eventCategory,
        duration: duration,
        createdBy: 'Current User', // Replace with actual user data
        createdAt: new Date(),
      }
      events.push(newEvent)
      setCurrentEventId(newEvent.id)
      setLoading(false)
      toast.success("Event created successfully. You can now add participants.")
      setStep('participants')
  
      // Reset form fields
      setEventName('')
      setEventDate(null)
      setEventTimeFrom('')
      setEventTimeTo('')
      setEventVenue('')
      setEventType('')
      setEventCategory('')
      setDuration('')
    }
  
    const handleAddParticipant = async (e) => {
      e.preventDefault()
      if (!validateParticipantForm()) return
  
      if (!participantData.school || !participantData.year || !participantData.section) {
        toast.error("Please fill in all required fields")
        return
      }
  
      const currentEvent = events.find((e) => e.id === currentEventId)
      if (!currentEvent) {
        toast.error("No event selected")
        return
      }
  
      setLoading(true)
      await simulateServerDelay(1000) // Simulate server delay
  
      const isDuplicate = participants.some(p => 
        p.eventId === currentEventId && (p.studentId === participantData.studentId || p.name === participantData.name)
      )
  
      if (isDuplicate) {
        setLoading(false)
        toast.error("A participant with this Student ID or Name already exists in this event.")
        return
      }
  
      const newParticipant = {
        ...participantData,
        age: parseInt(participantData.age),
        eventId: currentEventId,
        dateAdded: new Date(),
      }
  
      participants.push(newParticipant)
      setLoading(false)
      toast.success(`Participant added to ${currentEvent.name}`)
      setParticipantData({
        studentId: '',
        name: '',
        sex: '',
        age: '',
        school: '',
        year: '',
        section: '',
        ethnicGroup: '',
        otherEthnicGroup: '',
        status: 'Pending',
      })
      setAddButtonText('Add Another Participant')
    }
  
    const handleFinishAddingParticipants = () => {
      setStep('overview')
      setAddButtonText('Add Participant')
      setCurrentEventId(null)
    }
  
    const handleEditParticipant = (participant) => {
      setParticipantData(participant)
      setIsEditingParticipant(true)
    }
  
    const handleUpdateParticipant = () => {
      if (!validateParticipantForm()) return
  
      const updatedParticipants = participants.map(p => 
        p.studentId === participantData.studentId ? {...participantData} : p
      )
      participants = updatedParticipants
      toast.success("Participant updated successfully")
      setIsEditingParticipant(false)
      setParticipantData({
        studentId: '',
        name: '',
        sex: '',
        age: '',
        school: '',
        year: '',
        section: '',
        ethnicGroup: '',
        otherEthnicGroup: '',
        status: 'Pending',
      })
    }
  
    const handleDeleteParticipant = (participantId) => {
      if (window.confirm("Are you sure you want to delete this participant?")) {
        participants = participants.filter(p => p.studentId !== participantId)
        toast.success("Participant deleted successfully")
      }
    }
  
    const handleStatusChange = (participantId, newStatus) => {
      participants = participants.map(p => 
        p.studentId === participantId ? {...p, status: newStatus} : p
      )
      toast.success(`Participant status updated to ${newStatus}`)
    }
  
    const filteredParticipants = participants.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.studentId.includes(searchTerm) ||
                            events.find(e => e.id === p.eventId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      const matchesSchool = schoolFilter === 'all' || p.school === schoolFilter
      const matchesYear = yearFilter === 'all' || p.year === yearFilter
      return matchesSearch && matchesStatus && matchesSchool && matchesYear
    })
  
    const sortedParticipants = [...filteredParticipants].sort((a, b) => {
      if (sortCriteria === 'dateAdded') return b.dateAdded - a.dateAdded
      if (sortCriteria === 'name') return a.name.localeCompare(b.name)
      if (sortCriteria === 'status') return a.status.localeCompare(b.status)
      return 0
    })

    const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState({
    title: '',
    description: '',
    type: '',
    choices: [''],
  })
  const [previewMode, setPreviewMode] = useState(false)

  const handleInputChange = (e) => {
    setCurrentQuestion({ ...currentQuestion, [e.target.name]: e.target.value })
  }

  const handleTypeChange = (value) => {
    setCurrentQuestion({ ...currentQuestion, type: value })
  }

  const handleChoiceChange = (index, value) => {
    const newChoices = [...currentQuestion.choices]
    newChoices[index] = value
    setCurrentQuestion({ ...currentQuestion, choices: newChoices })
  }

  const addChoice = () => {
    setCurrentQuestion({ ...currentQuestion, choices: [...currentQuestion.choices, ''] })
  }

  const removeChoice = (index) => {
    const newChoices = currentQuestion.choices.filter((_, i) => i !== index)
    setCurrentQuestion({ ...currentQuestion, choices: newChoices })
  }

  const moveChoice = (index, direction) => {
    const newChoices = [...currentQuestion.choices]
    const temp = newChoices[index]
    newChoices[index] = newChoices[index + direction]
    newChoices[index + direction] = temp
    setCurrentQuestion({ ...currentQuestion, choices: newChoices })
  }

  const saveQuestion = () => {
    setQuestions([...questions, currentQuestion])
    setCurrentQuestion({ title: '', description: '', type: '', choices: [''] })
  }

  const editQuestion = (index) => {
    setCurrentQuestion(questions[index])
    const newQuestions = questions.filter((_, i) => i !== index)
    setQuestions(newQuestions)
  }

  const deleteQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index)
    setQuestions(newQuestions)
  }

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList>
        <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
        <TabsTrigger value="past">Past Events</TabsTrigger>
        <TabsTrigger value="questionnaire">Questionnaire Creation</TabsTrigger>
        <TabsTrigger value="create">Create Event</TabsTrigger>
        <TabsTrigger value="participants">Participant Management</TabsTrigger>
        <TabsTrigger value="log">Event & Participant Log</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Manage and view details of upcoming events.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Women in Tech Summit</TableCell>
                  <TableCell>2024-03-15</TableCell>
                  <TableCell>Virtual</TableCell>
                  <TableCell>250</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View</Button>
                    <Button variant="outline" size="sm" className="ml-2">Edit</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Gender Equality Workshop</TableCell>
                  <TableCell>2024-04-20</TableCell>
                  <TableCell>New York</TableCell>
                  <TableCell>100</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View</Button>
                    <Button variant="outline" size="sm" className="ml-2">Edit</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="past">
  <Card>
    <CardHeader>
      <CardTitle>Past Events</CardTitle>
      <CardDescription>View and analyze past events.</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Attendees</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Diversity in Leadership</TableCell>
            <TableCell>2023-11-25</TableCell>
            <TableCell>London</TableCell>
            <TableCell>150</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">View Report</Button>
                <Button variant="outline" size="icon" onClick={() => setActiveSection("questionnaire")}>
                  <ClipboardList className="h-4 w-4" />
                  <span className="sr-only">Questionnaire Builder</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>STEM for Girls</TableCell>
            <TableCell>2023-10-10</TableCell>
            <TableCell>Chicago</TableCell>
            <TableCell>200</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">View Report</Button>
                <Button variant="outline" size="icon" onClick={() => setActiveSection("questionnaire")}>
                  <ClipboardList className="h-4 w-4" />
                  <span className="sr-only">Questionnaire Builder</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</TabsContent>
<TabsContent value="questionnaire">
<Card>
        <CardHeader>
          <CardTitle>Create New Question</CardTitle>
          <CardDescription>Design your question and preview how it will appear to users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Question Title</Label>
              <Input id="title" name="title" value={currentQuestion.title} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" name="description" value={currentQuestion.description} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="type">Question Type</Label>
              <Select onValueChange={handleTypeChange} value={currentQuestion.type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(currentQuestion.type === 'multiple' || currentQuestion.type === 'single' || currentQuestion.type === 'dropdown') && (
              <div>
                <Label>Choices</Label>
                {currentQuestion.choices.map((choice, index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <Input value={choice} onChange={(e) => handleChoiceChange(index, e.target.value)} />
                    <Button variant="outline" size="icon" onClick={() => removeChoice(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {index > 0 && (
                      <Button variant="outline" size="icon" onClick={() => moveChoice(index, -1)}>
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addChoice} className="mt-2">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Choice
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button onClick={saveQuestion}>
            <Save className="h-4 w-4 mr-2" />
            Save Question
          </Button>
        </CardFooter>
      </Card>

      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-semibold">{currentQuestion.title}</h3>
            <p className="text-sm text-gray-500">{currentQuestion.description}</p>
            {currentQuestion.type === 'multiple' && (
              <div className="space-y-2 mt-2">
                {currentQuestion.choices.map((choice, index) => (
                  <div key={index} className="flex items-center">
                    <input type="checkbox" id={`choice-${index}`} className="mr-2" />
                    <label htmlFor={`choice-${index}`}>{choice}</label>
                  </div>
                ))}
              </div>
            )}
            {currentQuestion.type === 'single' && (
              <div className="space-y-2 mt-2">
                {currentQuestion.choices.map((choice, index) => (
                  <div key={index} className="flex items-center">
                    <input type="radio" name="single-choice" id={`choice-${index}`} className="mr-2" />
                    <label htmlFor={`choice-${index}`}>{choice}</label>
                  </div>
                ))}
              </div>
            )}
            {currentQuestion.type === 'dropdown' && (
              <select className="mt-2 w-full p-2 border rounded">
                {currentQuestion.choices.map((choice, index) => (
                  <option key={index} value={choice}>{choice}</option>
                ))}
              </select>
            )}
            {currentQuestion.type === 'rating' && (
              <div className="flex space-x-2 mt-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button key={rating} className="p-2 border rounded">{rating}</button>
                ))}
              </div>
            )}
            {currentQuestion.type === 'text' && (
              <textarea className="w-full p-2 border rounded mt-2" rows="3"></textarea>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Saved Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question, index) => (
                <TableRow key={index}>
                  <TableCell>{question.title}</TableCell>
                  <TableCell>{questionTypes.find(t => t.value === question.type)?.label}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => editQuestion(index)}>Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => deleteQuestion(index)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </TabsContent>


      <TabsContent value="create" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <CardDescription>Enter the details for your new event.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateEvent}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventName">Event Name</Label>
                  <Input
                    id="eventName"
                    value={eventName}
                    onChange={(e) => setEventName(capitalizeWords(e.target.value))}
                    placeholder="Enter event name"
                  />
                  {errors.eventName && <p className="text-sm text-red-500">{errors.eventName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !eventDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventDate ? format(eventDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={eventDate}
                        onSelect={setEventDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.eventDate && <p className="text-sm text-red-500">{errors.eventDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventTimeFrom">Start Time</Label>
                  <Input
                    id="eventTimeFrom"
                    type="time"
                    value={eventTimeFrom}
                    onChange={(e) => setEventTimeFrom(e.target.value)}
                  />
                  {errors.eventTimeFrom && <p className="text-sm text-red-500">{errors.eventTimeFrom}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventTimeTo">End Time</Label>
                  <Input
                    id="eventTimeTo"
                    type="time"
                    value={eventTimeTo}
                    onChange={(e) => setEventTimeTo(e.target.value)}
                  />
                  {errors.eventTimeTo && <p className="text-sm text-red-500">{errors.eventTimeTo}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventVenue">Venue</Label>
                  <Input
                    id="eventVenue"
                    value={eventVenue}
                    onChange={(e) => setEventVenue(capitalizeWords(e.target.value))}
                    placeholder="Enter event venue"
                  />
                  {errors.eventVenue && <p className="text-sm text-red-500">{errors.eventVenue}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select onValueChange={setEventType}>
                    <SelectTrigger id="eventType">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Non-Academic">Non-Academic</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.eventType && <p className="text-sm text-red-500">{errors.eventType}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventCategory">Event Category</Label>
                  <Select onValueChange={setEventCategory} disabled={!eventType}>
                    <SelectTrigger id="eventCategory">
                      <SelectValue placeholder={eventType ? "Select category" : "Select event type first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {eventType === 'Academic' && schoolOptions.map((school) => (
                        <SelectItem key={school.abbr} value={school.name}>{school.name}</SelectItem>
                      ))}
                      {eventType === 'Non-Academic' && [
                        "Student Organizations",
                        "Sports",
                        "Cultural",
                        "Community Service",
                        "Career Development",
                        "Other"
                      ].map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.eventCategory && <p className="text-sm text-red-500">{errors.eventCategory}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input id="duration" value={duration} readOnly />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Event'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
      <TabsContent value="participants" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Add Participant</CardTitle>
            <CardDescription>
              {currentEventId 
                ? `Add participants to ${events.find(e => e.id === currentEventId)?.name}`
                : 'No active event selected'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAddParticipant}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Input
                            id="studentId"
                            value={participantData.studentId}
                            onChange={(e) => setParticipantData({...participantData, studentId: formatStudentId(e.target.value)})}
                            placeholder="00-00-0000"
                            maxLength={10}
                            onFocus={(e) => e.target.value = ''}
                          />
                          <HelpCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enter Student ID in the format 00-00-0000</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {errors.studentId && <p className="text-sm text-red-500">{errors.studentId}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={participantData.name}
                    onChange={(e) => setParticipantData({...participantData, name: capitalizeWords(e.target.value)})}
                    placeholder="Enter full name"
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sex">Sex</Label>
                  <Select onValueChange={(value) => setParticipantData({...participantData, sex: value})}>
                    <SelectTrigger id="sex">
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.sex && <p className="text-sm text-red-500">{errors.sex}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Input
                            id="age"
                            type="number"
                            value={participantData.age}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 125)) {
                                setParticipantData({...participantData, age: value})
                              }
                            }}
                            placeholder="Enter age"
                            min="1"
                            max="125"
                          />
                          <HelpCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Age must be between 1 and 125</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Select 
                    onValueChange={(value) => setParticipantData({...participantData, school: value, year: '', section: ''})}
                    value={participantData.school}
                  >
                    <SelectTrigger id="school">
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolOptions.map((school) => (
                        <SelectItem key={school.abbr} value={school.name}>{school.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.school && <p className="text-sm text-red-500">{errors.school}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select 
                    onValueChange={(value) => setParticipantData({...participantData, year: value, section: ''})}
                    value={participantData.year}
                    disabled={!participantData.school}
                  >
                    <SelectTrigger id="year">
                      <SelectValue placeholder={participantData.school ? "Select year" : "Select school first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {["First Year", "Second Year", "Third Year", "Fourth Year", "Fifth Year"].map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.year && <p className="text-sm text-red-500">{errors.year}</p>}
                  {!participantData.school && <p className="text-sm text-gray-500">Please select a school first</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={participantData.section}
                    onChange={(e) => setParticipantData({...participantData, section: capitalizeWords(e.target.value)})}
                    placeholder="Enter section"
                    disabled={!participantData.year}
                  />
                  {errors.section && <p className="text-sm text-red-500">{errors.section}</p>}
                  {!participantData.year && <p className="text-sm text-gray-500">Please select a year first</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ethnicGroup">Ethnic Group</Label>
                  <Select onValueChange={(value) => setParticipantData({...participantData, ethnicGroup: value, otherEthnicGroup: value === 'Other' ? '' : participantData.otherEthnicGroup})}>
                    <SelectTrigger id="ethnicGroup">
                      <SelectValue placeholder="Select ethnic group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tagalog">Tagalog</SelectItem>
                      <SelectItem value="Cebuano">Cebuano</SelectItem>
                      <SelectItem value="Ilocano">Ilocano</SelectItem>
                      <SelectItem value="Bicolano">Bicolano</SelectItem>
                      <SelectItem value="Waray">Waray</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.ethnicGroup && <p className="text-sm text-red-500">{errors.ethnicGroup}</p>}
                </div>
                {participantData.ethnicGroup === 'Other' && (
                  <div className="space-y-2">
                    <Label htmlFor="otherEthnicGroup">Specify Ethnic Group</Label>
                    <Input
                      id="otherEthnicGroup"
                      value={participantData.otherEthnicGroup}
                      onChange={(e) => setParticipantData({...participantData, otherEthnicGroup: capitalizeWords(e.target.value)})}
                      placeholder="Enter ethnic group"
                    />
                    {errors.otherEthnicGroup && <p className="text-sm text-red-500">{errors.otherEthnicGroup}</p>}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep('create')}>
                Back to Events
              </Button>
              <div>
                <Button type="submit" disabled={loading || !currentEventId} className="mr-2">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : addButtonText}
                </Button>
                {addButtonText === 'Add Another Participant' && (
                  <Button type="button" onClick={handleFinishAddingParticipants}>
                    Finish Adding Participants
                  </Button>
                )}
              </div>
            </CardFooter>
          </form>
        </Card>
        <Table>
          <TableCaption>A list of event participants.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Sex</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Ethnic Group</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.filter(p => p.eventId === currentEventId).map((participant) => (
              <TableRow key={participant.studentId}>
                <TableCell>{participant.studentId}</TableCell>
                <TableCell>{participant.name}</TableCell>
                <TableCell>{participant.sex}</TableCell>
                <TableCell>{participant.age}</TableCell>
                <TableCell>{schoolOptions.find(s => s.name === participant.school)?.abbr || participant.school}</TableCell>
                <TableCell>{participant.year}</TableCell>
                <TableCell>{participant.section}</TableCell>
                <TableCell>{participant.ethnicGroup === 'Other' ? participant.otherEthnicGroup : participant.ethnicGroup}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Participant</DialogTitle>
                        <DialogDescription>Make changes to the participant's information here.</DialogDescription>
                      </DialogHeader>
                      {/* Add form fields for editing participant data here */}
                      <DialogFooter>
                        <Button onClick={handleUpdateParticipant}>Save changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="sm" onClick={() => {
                    if (window.confirm("Are you sure you want to delete this participant?")) {
                      handleDeleteParticipant(participant.studentId)
                    }
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
      <TabsContent value="log" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Event & Participant Log</CardTitle>
            <CardDescription>View and manage all events and participants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Total Events: {events.length}</h3>
            </div>
            <div className="flex justify-between mb-4">
              <Input
                placeholder="Search by Student ID, Name, or Event Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-1/3"
              />
              <Select onValueChange={setSortCriteria} defaultValue={sortCriteria}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dateAdded">Date Added</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={setStatusFilter} defaultValue={statusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Declined">Declined</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={setSchoolFilter} defaultValue={schoolFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by School" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {schoolOptions.map((school) => (
                    <SelectItem key={school.abbr} value={school.name}>{school.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={setYearFilter} defaultValue={yearFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {["First Year", "Second Year", "Third Year", "Fourth Year", "Fifth Year"].map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Time Since Creation</TableHead>
                  <TableHead>Total Participants</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedParticipants.map((participant) => {
                  const event = events.find(e => e.id === participant.eventId)
                  return (
                    <TableRow key={`${participant.eventId}-${participant.studentId}`}>
                      <TableCell>{event?.name}</TableCell>
                      <TableCell>{participant.studentId}</TableCell>
                      <TableCell>{participant.name}</TableCell>
                      <TableCell>{schoolOptions.find(s => s.name === participant.school)?.abbr || participant.school}</TableCell>
                      <TableCell>{participant.year}</TableCell>
                      <TableCell>{participant.status}</TableCell>
                      <TableCell>{event?.createdBy}</TableCell>
                      <TableCell>{format(event?.createdAt, 'PPP')}</TableCell>
                      <TableCell>{formatDistanceToNow(event?.createdAt, { addSuffix: true })}</TableCell>
                      <TableCell>{participants.filter(p => p.eventId === event?.id).length}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <BarChart className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}