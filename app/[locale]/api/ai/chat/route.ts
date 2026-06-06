import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildAnonymizedContext } from "@/lib/ai/contextBuilder"
import { z } from "zod"

/**
 * AI Coach Chat API
 *
 * Handles chat requests to Gemini AI with anonymized user context.
 * Server-side only - API key never exposed to client.
 *
 * POST /api/ai/chat
 * Body: { message: string, conversationHistory?: Message[] }
 */

const RequestSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(10)
    .optional(),
})

// Gemini API configuration
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      )
    }

    // 2. Validate request body
    const body = await request.json()
    const parsed = RequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { message, conversationHistory = [] } = parsed.data

    // 3. Build anonymized context
    const context = await buildAnonymizedContext(user.id)

    // 4. Check Gemini API key
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      console.error("Gemini API key not configured")
      return NextResponse.json(
        {
          error: "Service unavailable",
          message: "AI service temporarily unavailable",
        },
        { status: 503 }
      )
    }

    // 5. Build system prompt with context
    const systemPrompt = buildSystemPrompt(context)

    // 6. Prepare conversation for Gemini
    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [
          {
            text: "Understood. I'm ready to act as FitTrack Pro AI Coach with the user's anonymized health context.",
          },
        ],
      },
      // Include conversation history (limited to last 10 messages)
      ...conversationHistory.slice(-10).map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
      // Current user message
      {
        role: "user",
        parts: [{ text: message }],
      },
    ]

    // 7. Call Gemini API
    const geminiResponse = await fetch(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            topP: 0.8,
            topK: 40,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      console.error("Gemini API error:", errorData)

      // Return fallback response
      return NextResponse.json({
        reply: getFallbackResponse(message),
        fallback: true,
        timestamp: new Date().toISOString(),
      })
    }

    const geminiData = await geminiResponse.json()

    // Extract response text
    const reply =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      getFallbackResponse(message)

    // 8. Save conversation to database
    await supabase.from("ai_conversations").insert([
      {
        user_id: user.id,
        role: "user",
        content: message,
        context_snapshot: context,
      },
      {
        user_id: user.id,
        role: "assistant",
        content: reply,
        context_snapshot: null,
      },
    ])

    // 9. Return response
    return NextResponse.json({
      reply,
      contextUsed: {
        hasHealthData: !!context.todayMetrics.stepsToday,
        hasWorkoutData: context.recentTraining.workoutsCompleted > 0,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("AI chat error:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to process request",
        reply: getFallbackResponse(""),
      },
      { status: 500 }
    )
  }
}

/**
 * Build system prompt with user context
 */
function buildSystemPrompt(context: any): string {
  return `You are FitTrack Pro AI Coach, a knowledgeable and encouraging fitness coach.

USER CONTEXT (anonymized, no PII):
${JSON.stringify(context, null, 2)}

GUIDELINES:
- Provide evidence-based fitness and nutrition advice
- Be encouraging but realistic
- Reference user's actual data when relevant
- Keep responses concise (2-4 paragraphs)
- If data is limited, ask clarifying questions
- Never provide medical advice - always suggest consulting professionals
- Format numbers with proper units (kg, kcal, minutes)
- Use German language for responses

SPECIALIZED CAPABILITIES:
- Training program recommendations based on recovery score
- Nutrition guidance based on macro targets
- Workout suggestions based on muscle map status
- Sleep and recovery optimization tips
- Exercise form and progression advice

Always consider the user's fitness goal (${context.userProfile.fitnessGoal}) and activity level (${context.userProfile.activityLevel}) in your recommendations.`
}

/**
 * Fallback response when AI is unavailable
 */
function getFallbackResponse(message: string): string {
  const fallbacks = [
    "Der AI-Coach ist momentan nicht verfügbar. Bitte versuche es später erneut oder konsultiere andere Fitness-Ressourcen.",
    "Ich habe gerade technische Schwierigkeiten. Deine Frage war: \"" + message + "\" - bitte stelle sie später noch einmal.",
    "Entschuldigung, der KI-Service ist überlastet. Versuche es in wenigen Minuten erneut!",
  ]
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}
