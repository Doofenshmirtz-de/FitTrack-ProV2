"use client"

import { useState, useCallback, useEffect } from "react"
import { Search, Loader2, ChevronRight, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import { searchByText } from "@/lib/food/openFoodFacts"
import type { OFFProduct } from "@/types"

interface FoodSearchProps {
  onSelect: (product: OFFProduct) => void
  className?: string
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export function FoodSearch({ onSelect, className }: FoodSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<OFFProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const debouncedQuery = useDebounce(query, 500)

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const data = await searchByText(searchQuery)
      setResults(data.products)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    performSearch(debouncedQuery)
  }, [debouncedQuery, performSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
  }

  return (
    <div className={className}>
      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-tertiary" />
        <Input
          type="search"
          placeholder="Lebensmittel suchen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-tertiary animate-spin" />
        )}
      </form>

      {/* Results */}
      <div className="mt-4 space-y-2">
        {results.length === 0 && hasSearched && !isLoading && query.length >= 2 && (
          <p className="text-center text-foreground-secondary py-4">
            Keine Produkte gefunden
          </p>
        )}

        {results.map((product) => (
          <button
            key={product.code}
            onClick={() => onSelect(product)}
            className="w-full flex items-center gap-3 p-3 bg-elevated hover:bg-overlay rounded-lg transition-colors text-left"
          >
            {/* Product image or placeholder */}
            {product.image_front_small_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={product.image_front_small_url}
                alt={product.product_name}
                className="w-12 h-12 rounded object-cover bg-overlay flex-shrink-0"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-overlay flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-foreground-tertiary" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {product.product_name || "Unbekanntes Produkt"}
              </p>
              {product.brands && (
                <p className="text-body-sm text-foreground-secondary truncate">
                  {product.brands}
                </p>
              )}
              {product.nutriments?.["energy-kcal_100g"] && (
                <p className="text-caption text-foreground-tertiary">
                  {Math.round(product.nutriments["energy-kcal_100g"])} kcal / 100g
                </p>
              )}
            </div>

            <ChevronRight className="w-5 h-5 text-foreground-tertiary flex-shrink-0" />
          </button>
        ))}

        {/* Loading state */}
        {isLoading && results.length === 0 && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-elevated rounded-lg">
                <div className="w-12 h-12 rounded bg-overlay animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-overlay rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-overlay rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
