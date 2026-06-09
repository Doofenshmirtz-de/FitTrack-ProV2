import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.1";
import { corsHeaders } from "../_shared/cors.ts";

const genAI = new GoogleGenerativeAI(Deno.env.get("GOOGLE_GEMINI_API_KEY") || "");

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

    const { imageBase64, mimeType } = await req.json();
    
    if (!imageBase64 || !mimeType) {
      throw new Error("Missing image data");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `Analyze this food image. Provide a JSON response matching this EXACT structure:
{
  "items": [
    {
      "name": "string (name of the food in German)",
      "confidence": "number (0-1)",
      "calories": "number (estimated total calories)",
      "protein_g": "number",
      "carbs_g": "number",
      "fat_g": "number",
      "portion_description": "string (e.g. '~150g' or '1 piece')"
    }
  ]
}
Return ONLY the raw JSON string, without markdown \`\`\`json wrappers. Do not include any other text.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType } }
    ]);

    const responseText = result.response.text();
    let jsonResult;
    try {
      jsonResult = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
      throw new Error("Failed to parse Gemini response as JSON: " + responseText);
    }

    return new Response(JSON.stringify(jsonResult), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });

  } catch (error) {
    console.error("Food Vision Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 400,
    });
  }
});
