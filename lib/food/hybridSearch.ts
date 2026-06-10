import { searchByText as offSearchByText } from "./openFoodFacts"
import type { OFFProduct } from "@/types"
import { createClient } from "@/lib/supabase/client"

export async function hybridSearch(query: string, page: number = 1): Promise<{
  products: OFFProduct[]
  total: number
}> {
  const supabase = createClient()
  
  try {
    // 1. Search BLS database (Supabase)
    // We only do this on the first page to keep it clean
    let blsResults: OFFProduct[] = []
    
    if (page === 1) {
      // Create a formatted query for full text search (e.g. "Apfel:*" for prefix matching)
      const ftsQuery = query.trim().split(/\s+/).map(word => `${word}:*`).join(' & ')
      
      const { data: blsData, error: blsError } = await supabase
        .from('bls_foods' as never)
        .select('*')
        .textSearch('fts', ftsQuery)
        .limit(10)

      if (!blsError && blsData) {
        // Map BLS row to OFFProduct interface so the UI handles it seamlessly
        blsResults = (blsData as import("@/lib/supabase/database.types").Database["public"]["Tables"]["bls_foods"]["Row"][]).map((item) => ({
          code: item.id,
          product_name: item.food_name,
          brands: "BLS Datenbank 🇩🇪", // Special marker for UI
          _id: item.id,
          id: item.id,
          image_url: "", // No images for BLS natively
          nutriments: {
            'energy-kcal_100g': item.calories,
            'proteins_100g': item.protein_g,
            'carbohydrates_100g': item.carbs_g,
            'fat_100g': item.fat_g,
            'fiber_100g': item.fiber_g || 0,
            'sugars_100g': item.sugar_g || 0,
            'sodium_100g': item.sodium_mg || 0,
          }
        }))
      } else if (blsError) {
        console.error("BLS Search Error:", blsError)
      }
    }

    // 2. Search Open Food Facts
    const offData = await offSearchByText(query, page)

    // 3. Combine results (BLS first, then OFF)
    // We filter out any OFF results that might be exact duplicates (unlikely due to different IDs)
    const combinedProducts = [...blsResults, ...offData.products]

    return {
      products: combinedProducts,
      total: blsResults.length + offData.total
    }
  } catch (error) {
    console.error("Hybrid Search Error:", error)
    return { products: [], total: 0 }
  }
}
