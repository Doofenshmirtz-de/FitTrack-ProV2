"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send, Sparkles } from "lucide-react"
import { useState } from "react"

export default function CoachPage() {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsLoading(true)
    // TODO: Send to AI API
    setTimeout(() => {
      setIsLoading(false)
      setMessage("")
    }, 1000)
  }

  return (
    <div className="space-y-6 pt-4 h-[calc(100vh-8rem)] flex flex-col">
      <header>
        <h1 className="text-h1">AI Coach</h1>
        <p className="text-foreground-secondary">
          Dein persönlicher Fitness-Assistent
        </p>
      </header>

      {/* Chat Area */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Welcome Message */}
          <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-accent-purple" />
            </div>
            <div className="bg-elevated rounded-lg p-3 max-w-[80%]">
              <p className="text-sm">
                Hallo! Ich bin dein FitTrack Coach. Ich habe Zugriff auf deine 
                Trainingsdaten, Ernährung und Gesundheitsmetriken. Wie kann ich 
                dir heute helfen?
              </p>
            </div>
          </div>

          {/* Context Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {["Heute", "Diese Woche", "Ernährung", "Training", "Schlaf"].map((chip) => (
              <button
                key={chip}
                onClick={() => setMessage(`Was ist mein ${chip.toLowerCase()} Status?`)}
                className="px-3 py-1.5 rounded-full bg-elevated border border-border text-sm text-foreground-secondary hover:text-foreground hover:border-border-focus transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Empty State */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-foreground-secondary">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-foreground-tertiary" />
              <p>Stelle deine erste Frage</p>
              <p className="text-sm mt-1">
                z.B. "Was sollte ich heute trainieren?"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Area */}
      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          placeholder="Frage deinen Coach..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !message.trim()}>
          {isLoading ? (
            <span className="animate-pulse">...</span>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
