"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Sparkles, Loader2, Calendar, Dumbbell, Utensils, Moon, Activity } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { createClient } from "@/lib/supabase/client"

interface Message {
  id: string
  role: "user" | "assistant" | "system_daily"
  content: string
  timestamp: Date
}

const CONTEXT_CHIPS = [
  { label: "Heute", icon: Calendar, context: "Wie sieht mein heutiger Status aus?" },
  { label: "Training", icon: Dumbbell, context: "Was sollte ich heute trainieren?" },
  { label: "Ernährung", icon: Utensils, context: "Was sollte ich heute essen?" },
  { label: "Schlaf", icon: Moon, context: "Wie war mein Schlaf?" },
  { label: "Recovery", icon: Activity, context: "Wie ist mein Recovery Score?" },
]

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hallo! Ich bin dein FitTrack Coach. Ich habe Zugriff auf deine Trainingsdaten, Ernährung und Gesundheitsmetriken. Wie kann ich dir heute helfen?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (messageText?: string) => {
    const text = messageText || input
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error("Du bist nicht eingeloggt. Bitte logge dich erneut ein.")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-coach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.slice(-10).map((m) => ({
            role: m.role === "system_daily" ? "assistant" : m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error("Coach API error:", response.status, errorBody)
        throw new Error(`Coach-Fehler (${response.status}): ${errorBody}`)
      }
      
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullResponse = "";

      // Create an empty message that we will stream into
      const assistantMessageId = crypto.randomUUID();
      setMessages((prev) => [...prev, {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        
        fullResponse += chunkValue;
        
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === assistantMessageId 
              ? { ...msg, content: fullResponse }
              : msg
          )
        );
      }
    } catch {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Entschuldigung, ich habe gerade technische Schwierigkeiten. Bitte versuche es später erneut.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleChipClick = (context: string) => {
    setInput(context)
    handleSend(context)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend()
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col pt-4">
      <header className="mb-4">
        <h1 className="text-h1">AI Coach</h1>
        <p className="text-foreground-secondary">Dein persönlicher Fitness-Assistent</p>
      </header>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === "user"
                    ? "bg-accent-secondary/10"
                    : "bg-accent-purple/10"
                )}
              >
                {message.role === "user" ? (
                  <span className="text-accent-secondary text-sm font-medium">Du</span>
                ) : (
                  <Sparkles className="w-4 h-4 text-accent-purple" />
                )}
              </div>

              {/* Message */}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-accent-secondary/10 text-foreground"
                    : "bg-elevated text-foreground"
                )}
              >
                <p className="text-body-sm whitespace-pre-wrap">{message.content}</p>
                <span className="text-caption text-foreground-tertiary mt-1 block">
                  {message.timestamp.toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-purple/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent-purple" />
              </div>
              <div className="bg-elevated rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-foreground-secondary" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Context Chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        {CONTEXT_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => handleChipClick(chip.context)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated border border-border text-sm text-foreground-secondary hover:text-foreground hover:border-border-focus transition-colors disabled:opacity-50"
          >
            <chip.icon className="w-4 h-4" />
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <Input
          placeholder="Frage deinen Coach..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
