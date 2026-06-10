import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.1";
import { corsHeaders } from "../_shared/cors.ts";
import { buildAnonymizedContext } from "../_shared/contextBuilder.ts";

const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY") || "";
const genAI = new GoogleGenerativeAI(geminiKey);

function buildSystemPrompt(context: Record<string, unknown>) {
  const up = context.userProfile as Record<string, unknown>;

  return `You are FitTrack Pro AI Coach, a knowledgeable and encouraging fitness coach.

USER CONTEXT (anonymized):
${JSON.stringify(context, null, 2)}

CORE PRINCIPLES:
- Provide evidence-based fitness and nutrition advice
- Be encouraging but realistic
- Keep responses concise (2-4 paragraphs)
- If data is limited, ask clarifying questions
- Never provide medical advice - always suggest consulting professionals
- Format numbers with proper units (kg, kcal, minutes)
- Use German language for responses

DATA PRIVACY & ANONYMIZATION RULES (CRITICAL):
- Never mirror or repeat highly specific brand names, exact locations, or verbatim log entries back to the user unless absolutely necessary for clarity.
- Aggregate specific food logs into general macro- or food categories (e.g., instead of "I see you logged 3L of Apfelwein", say "Ich sehe, dein Flüssigkeits- und Kohlenhydratfokus lag heute auf alkoholischen/zuckerhaltigen Getränken").
- Avoid storing or referencing personal identifiable information (PII) like names or exact timestamps in your conversational memory.
- Focus your feedback on the overarching metric impact (e.g., total calories, macro splits, calorie surplus/deficit) rather than listing individual grocery items.

PERSONALIZATION & CONTEXT:
- Reference user's actual data when relevant (including aggregated metrics from todayMetrics.todayMeals).
- You have full access to the user's specific logged foods in todayMeals. Use this to give specific feedback on their structural food choices (e.g., analyzing protein density, meal timing, or calorie distribution), keeping the tone privacy-conscious.

SPECIALIZED CAPABILITIES:
- Training program recommendations based on recovery score
- Nutrition guidance based on macro targets
- Workout suggestions based on muscle map status
- Sleep and recovery optimization tips
- Exercise form and progression advice

Always consider the user's fitness goal (${up.fitnessGoal}) and activity level (${up.activityLevel}) in your recommendations.`;
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
