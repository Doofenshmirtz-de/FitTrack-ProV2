import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string, expires_in: number } | null> {
  const clientId = Deno.env.get("GOOGLE_HEALTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_HEALTH_CLIENT_SECRET");

  if (!clientId || !clientSecret) throw new Error("Missing Google credentials");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) return null;
  return await response.json();
}

async function fetchGoogleHealthData(accessToken: string, startTimeMillis: number, endTimeMillis: number) {
  // Aggregate steps and calories
  const response = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      aggregateBy: [
        { dataTypeName: "com.google.step_count.delta" },
        { dataTypeName: "com.google.calories.expended" }
      ],
      bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
      startTimeMillis,
      endTimeMillis
    })
  });

  if (!response.ok) throw new Error("Failed to fetch Google Health data");
  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""; 
    // We use service role to update tokens and health data safely
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth Error:", authError?.message);
      throw new Error("Unauthorized");
    }

    // Get tokens
    const { data: tokenData } = await supabaseClient
      .from("google_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!tokenData) {
      return new Response(JSON.stringify({ error: "Not connected to Google Health" }), { status: 400, headers: corsHeaders });
    }

    let accessToken = tokenData.access_token;

    // Refresh if expired
    if (new Date(tokenData.expires_at).getTime() < Date.now()) {
      if (!tokenData.refresh_token) throw new Error("No refresh token available");
      
      const refreshed = await refreshGoogleToken(tokenData.refresh_token);
      if (!refreshed) throw new Error("Failed to refresh token");

      accessToken = refreshed.access_token;
      
      await supabaseClient.from("google_tokens").update({
        access_token: accessToken,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
      }).eq("user_id", user.id);
    }

    // Fetch data for today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = now.getTime();

    const healthData = await fetchGoogleHealthData(accessToken, startOfDay, endOfDay);
    
    let steps = 0;
    let calories = 0;

    const bucket = healthData.bucket?.[0];
    if (bucket && bucket.dataset) {
      for (const dataset of bucket.dataset) {
        if (dataset.dataSourceId.includes("step_count")) {
          steps = dataset.point?.[0]?.value?.[0]?.intVal || 0;
        }
        if (dataset.dataSourceId.includes("calories")) {
          calories = dataset.point?.[0]?.value?.[0]?.fpVal || 0;
        }
      }
    }

    const dateStr = now.toISOString().split("T")[0];

    // Upsert into daily_summaries
    await supabaseClient.from("daily_summaries").upsert({
      user_id: user.id,
      date: dateStr,
      steps: steps,
      calories_burned: Math.round(calories)
    }, { onConflict: 'user_id,date' });

    return new Response(JSON.stringify({ success: true, steps, calories }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });

  } catch (error) {
    console.error("Health Sync Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 400,
    });
  }
});
