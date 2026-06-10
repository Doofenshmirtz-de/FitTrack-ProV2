import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.1";
import { corsHeaders } from "../_shared/cors.ts";
import { buildAnonymizedContext } from "../_shared/contextBuilder.ts";

const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY") || "";
const genAI = new GoogleGenerativeAI(geminiKey);

function buildSystemPrompt(context: Record<string, unknown>) {
  const tm = context.todayMetrics as Record<string, number>;
  const up = context.userProfile as Record<string, unknown>;
  const rt = context.recentTraining as Record<string, unknown>;
  const mgLastWeek = (rt.muscleGroupsLastWeek as string[]) || [];

  return `Du bist "FitTrack Coach", ein KI-Personal-Trainer für die FitTrack Pro App. 
Dein Ziel ist es, dem Nutzer datenbasierte, präzise und motivierende Antworten zu geben.

Hier sind die anonymisierten Live-Daten des Nutzers:
---
HEUTE:
- Kalorien: ${tm.caloriesConsumed} / ${tm.caloriesTarget} kcal (Verbrannt: ${tm.caloriesBurned} kcal)
- Makros: ${tm.proteinG}g Protein | ${tm.carbsG}g Carbs | ${tm.fatG}g Fat
- Schlaf: ${(tm.sleepHours || 0).toFixed(1)}h (Score: ${tm.sleepScore}/100)
- HRV: ${tm.hrvMorning} ms (Recovery Score: ${tm.recoveryScore}/100)
- Aktivität: ${tm.stepsToday} Schritte, ${tm.activeMinutes} aktive Minuten

PROFIL:
- ${up.age} Jahre, ${up.weightKg}kg, ${up.heightCm}cm
- Ziel: ${up.fitnessGoal}
- Aktivitätslevel: ${up.activityLevel}

TRAINING:
- Letztes Workout: vor ${rt.lastWorkoutDaysAgo} Tagen
- Trainierte Muskeln letzte Woche: ${mgLastWeek.join(', ') || 'keine'}
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
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Auth-Header prüfen
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ No Authorization header found in request");
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 401,
      });
    }

    console.log("✅ Authorization header present, length:", authHeader.length);

    // 2. Supabase Client mit dem User-JWT erstellen
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    console.log("🔧 SUPABASE_URL set:", !!supabaseUrl);
    console.log("🔧 SUPABASE_ANON_KEY set:", !!supabaseAnonKey);
    console.log("🔧 GOOGLE_GEMINI_API_KEY set:", !!geminiKey);

    const supabase = createClient(
      supabaseUrl ?? "",
      supabaseAnonKey ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // 3. User verifizieren (Token explizit übergeben!)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("❌ Auth error from getUser():", authError.message, authError.status);
      return new Response(JSON.stringify({ error: "Authentication failed: " + authError.message }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 401,
      });
    }
    
    if (!user) {
      console.error("❌ getUser() returned no error but user is null");
      return new Response(JSON.stringify({ error: "No user found for this token" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 401,
      });
    }

    console.log("✅ User authenticated:", user.id);

    // 4. Request Body parsen
    const { message, conversationHistory = [] } = await req.json();
    console.log("📩 Message received, history length:", conversationHistory.length);

    // 5. Context bauen
    const context = await buildAnonymizedContext(supabase, user.id);
    const systemPrompt = buildSystemPrompt(context as unknown as Record<string, unknown>);

    // 6. Gemini aufrufen
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Verstanden. Ich bin bereit." }] },
        ...conversationHistory.map((msg: { role: string; content: string }) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        }))
      ],
    });

    console.log("🤖 Sending to Gemini...");
    const result = await chat.sendMessageStream(message);

    // 7. Stream Response
    let fullResponseText = "";
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponseText += chunkText;
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          
          console.log("✅ Stream complete, response length:", fullResponseText.length);
          
          // Conversation in DB speichern (fire-and-forget)
          supabase.from("ai_conversations").insert([
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
          ]).then(({ error: insertError }) => {
            if (insertError) console.error("⚠️ Failed to save conversation:", insertError.message);
          });
          
        } catch (streamErr) {
          console.error("❌ Streaming error:", streamErr);
          const errorMsg = streamErr instanceof Error ? streamErr.message : "Stream failed";
          controller.enqueue(new TextEncoder().encode(`\n\n[Fehler: ${errorMsg}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ...corsHeaders,
      },
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Edge Function Error:", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    });
  }
});
