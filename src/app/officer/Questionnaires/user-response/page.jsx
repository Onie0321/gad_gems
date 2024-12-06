'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { listQuestions, createResponse } from '@/lib/appwrite'

export default function UserResponses({ user }) {
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState({})
  const { toast } = useToast()

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const response = await listQuestions()
      setQuestions(response.documents)
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast({
        title: "Error",
        description: "Failed to fetch questions. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmitResponses = async () => {
    try {
      await createResponse({
        userId: user.$id,
        responses: responses,
        timestamp: new Date().toISOString(),
      })
      setResponses({})
      toast({
        title: "Success",
        description: "Responses submitted successfully.",
      })
    } catch (error) {
      console.error('Error submitting responses:', error)
      toast({
        title: "Error",
        description: "Failed to submit responses. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">User Responses</h2>
      {questions.map((question) => (
        <div key={question.$id} className="mb-4">
          <p className="font-medium">{question.text}</p>
          {question.type === 'multiple_choice' && (
            <RadioGroup
              value={responses[question.$id]}
              onValueChange={(value) => setResponses({ ...responses, [question.$id]: value })}
            >
              {question.choices.map((choice, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={choice} id={`${question.$id}-${index}`} />
                  <Label htmlFor={`${question.$id}-${index}`}>{choice}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
          {question.type === 'true_false' && (
            <RadioGroup
              value={responses[question.$id]}
              onValueChange={(value) => setResponses({ ...responses, [question.$id]: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`${question.$id}-true`} />
                <Label htmlFor={`${question.$id}-true`}>True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`${question.$id}-false`} />
                <Label htmlFor={`${question.$id}-false`}>False</Label>
              </div>
            </RadioGroup>
          )}
          {question.type === 'fill_in_the_blank' && (
            <Input
              value={responses[question.$id] || ''}
              onChange={(e) => setResponses({ ...responses, [question.$id]: e.target.value })}
            />
          )}
        </div>
      ))}
      <Button onClick={handleSubmitResponses}>Submit Responses</Button>
    </div>
  )
}

