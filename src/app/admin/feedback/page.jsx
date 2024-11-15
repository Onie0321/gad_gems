import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FeedbackSection() {
  return (
    <Tabs defaultValue="event-feedback">
      <TabsList>
        <TabsTrigger value="event-feedback">Event Feedback</TabsTrigger>
        <TabsTrigger value="system-feedback">System Feedback</TabsTrigger>
      </TabsList>
      <TabsContent value="event-feedback">
        <Card>
          <CardHeader>
            <CardTitle>Event Feedback</CardTitle>
            <CardDescription>Provide feedback for a specific event you attended</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="event">Select Event</Label>
                  <Select>
                    <SelectTrigger id="event">
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="women-in-tech">Women in Tech Summit</SelectItem>
                      <SelectItem value="gender-equality">Gender Equality Workshop</SelectItem>
                      <SelectItem value="diversity-leadership">Diversity in Leadership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="rating">Overall Rating</Label>
                  <Select>
                    <SelectTrigger id="rating">
                      <SelectValue placeholder="Select a rating" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="5">5 - Excellent</SelectItem>
                      <SelectItem value="4">4 - Very Good</SelectItem>
                      <SelectItem value="3">3 - Good</SelectItem>
                      <SelectItem value="2">2 - Fair</SelectItem>
                      <SelectItem value="1">1 - Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea id="comments" placeholder="Share your thoughts about the event" />
                </div>
                <Button type="submit">Submit Feedback</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="system-feedback">
        <Card>
          <CardHeader>
            <CardTitle>System Feedback</CardTitle>
            <CardDescription>Help us improve GADConnect by providing your feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="feedback-type">Feedback Type</Label>
                  <Select>
                    <SelectTrigger id="feedback-type">
                      <SelectValue placeholder="Select feedback type" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="usability">Usability Feedback</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Brief description of your feedback" />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="details">Details</Label>
                  <Textarea id="details" placeholder="Provide detailed information about your feedback" />
                </div>
                <Button type="submit">Submit Feedback</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}