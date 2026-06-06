import type { OFFProduct } from "@/types"

/**
 * Open Food Facts API Integration
 * 
 * Free food database with barcode scanning support
 * API: https://world.openfoodfacts.org
 */

const BASE_URL = "https://world.openfoodfacts.org"

/**
 * Search product by barcode
 */
export async function searchByBarcode(barcode: string): Promise<OFFProduct | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/v0/product/${encodeURIComponent(barcode)}.json`,
      {
        headers: {
          "User-Agent": "FitTrackPro - Personal Use", // Required by OFF API
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== 1 || !data.product) {
      return null
    }

    return data.product as OFFProduct
  } catch (error) {
    console.error("Error searching by barcode:", error)
    return null
  }
}

/**
 * Search products by text query
 */
export async function searchByText(query: string, page: number = 1): Promise<{
  products: OFFProduct[]
  total: number
}> {
  try {
    const searchParams = new URLSearchParams({
      search_terms: query,
      page: page.toString(),
      page_size: "10",
      json: "1",
    })

    const response = await fetch(
      `${BASE_URL}/cgi/search.pl?${searchParams.toString()}`,
      {
        headers: {
          "User-Agent": "FitTrackPro - Personal Use",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    return {
      products: (data.products || []) as OFFProduct[],
      total: data.count || 0,
    }
  } catch (error) {
    console.error("Error searching by text:", error)
    return { products: [], total: 0 }
  }
}

/**
 * Map OFF product to our FoodLog format
 */
export function mapOFFToFoodLog(product: OFFProduct, quantity_g: number = 100) {
  const n = product.nutriments || {}
  const ratio = quantity_g / 100 // Calculate for requested quantity

  // Energy can be in kcal or kJ
  const kcal_100g = n["energy-kcal_100g"]
  const energy_100g = n["energy_100g"]
  
  const calories = kcal_100g 
    ? kcal_100g * ratio
    : energy_100g 
      ? (energy_100g / 4.184) * ratio // Convert kJ to kcal
      : 0

  return {
    food_name: product.product_name || product.product_name_de || "Unbekanntes Produkt",
    brand_name: product.brands || null,
    barcode: product.code,
    openfoodfacts_id: product._id || product.id || product.code || "",
    quantity_g: quantity_g,
    calories: Math.round(calories * 10) / 10,
    protein_g: Math.round((n["proteins_100g"] || 0) * ratio * 10) / 10,
    carbs_g: Math.round((n["carbohydrates_100g"] || 0) * ratio * 10) / 10,
    fat_g: Math.round((n["fat_100g"] || 0) * ratio * 10) / 10,
    fiber_g: n["fiber_100g"] ? Math.round(n["fiber_100g"] * ratio * 10) / 10 : null,
    sugar_g: n["sugars_100g"] ? Math.round(n["sugars_100g"] * ratio * 10) / 10 : null,
    sodium_mg: n["sodium_100g"] ? Math.round(n["sodium_100g"] * ratio * 1000 * 10) / 10 : null,
  }
}

/**
 * Get image URL for a product
 */
export function getProductImageUrl(product: OFFProduct, size: "small" | "medium" | "large" = "medium"): string | null {
  const imageUrl = product.image_url || product.image_front_url || product.image_front_small_url
  
  if (!imageUrl) return null

  // Open Food Facts provides different image sizes
  const sizeMap = {
    small: "100",
    medium: "400",
    large: "800",
  }

  return imageUrl.replace(/\/(\d+)\//, `/${sizeMap[size]}/`)
}
