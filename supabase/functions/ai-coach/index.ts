import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.1";
import { corsHeaders } from "../_shared/cors.ts";
import { buildAnonymizedContext } from "../_shared/contextBuilder.ts";

const genAI = new GoogleGenerativeAI(Deno.env.get("GOOGLE_GEMINI_API_KEY") || "");

function buildSystemPrompt(context: any) {
  return `Du bist "FitTrack Coach", ein KI-Personal-Trainer für die FitTrack Pro App. 
Dein Ziel ist es, dem Nutzer datenbasierte, präzise und motivierende Antworten zu geben.

Hier sind die anonymisierten Live-Daten des Nutzers:
---
HEUTE:
- Kalorien: ${context.todayMetrics.caloriesConsumed} / ${context.todayMetrics.caloriesTarget} kcal (Verbrannt: ${context.todayMetrics.caloriesBurned} kcal)
- Makros: ${context.todayMetrics.proteinG}g Protein | ${context.todayMetrics.carbsG}g Carbs | ${context.todayMetrics.fatG}g Fat
- Schlaf: ${context.todayMetrics.sleepHours.toFixed(1)}h (Score: ${context.todayMetrics.sleepScore}/100)
- HRV: ${context.todayMetrics.hrvMorning} ms (Recovery Score: ${context.todayMetrics.recoveryScore}/100)
- Aktivität: ${context.todayMetrics.stepsToday} Schritte, ${context.todayMetrics.activeMinutes} aktive Minuten

PROFIL:
- ${context.userProfile.age} Jahre, ${context.userProfile.weightKg}kg, ${context.userProfile.heightCm}cm
- Ziel: ${context.userProfile.fitnessGoal}
- Aktivitätslevel: ${context.userProfile.activityLevel}

TRAINING:
- Letztes Workout: vor ${context.recentTraining.lastWorkoutDaysAgo} Tagen
- Trainierte Muskeln letzte Woche: ${context.recentTraining.muscleGroupsLastWeek.join(', ')}
---

REGELN FÜR DEINE ANTWORTEN:
1. Antworte immer auf Deutsch.
2. Fasse dich kurz und prägnant (wie eine SMS von einem Coach).
3. Nutze Markdown für Formatierungen (Fett, Listen).
4. Beziehe dich auf die obigen Daten, um personalisierte Tipps zu geben.
5. Wenn nach Trainingsempfehlungen gefragt wird, berücksichtige die "Trainierte Muskeln letzte Woche" um Übertraining zu vermeiden.
6. Sei direkt, ehrlich aber immer konstruktiv.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { message, conversationHistory = [] } = await req.json();

    // Context via Shared Logic
    const context = await buildAnonymizedContext(supabase, user.id);
    const systemPrompt = buildSystemPrompt(context);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Wir setzen den System Prompt als erste Nachricht in den History-Context
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Verstanden. Ich bin bereit." }] },
        ...conversationHistory.map((msg: any) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        }))
      ],
    });

    const result = await chat.sendMessageStream(message);

    // Stream anlegen und den Context Snapshot im Hintergrund speichern
    let fullResponseText = "";
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponseText += chunkText;
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          
          // Nach dem Streaming in der DB speichern
          await supabase.from("ai_conversations").insert([
            {
              user_id: user.id,
              role: "user",
              content: message,
            },
            {
              user_id: user.id,
              role: "assistant",
              content: fullResponseText,
              context_snapshot: context,
            }
          ]);
          
        } catch (err) {
          console.error("Streaming error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 400,
    });
  }
});
