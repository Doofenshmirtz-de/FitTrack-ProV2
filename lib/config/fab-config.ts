import type { LucideIcon } from "lucide-react"
import {
  Plus,
  Utensils,
  Dumbbell,
  MessageSquare,
} from "lucide-react"

export interface FABAction {
  icon: LucideIcon
  label: string
  href: string
  variant?: "default" | "secondary"
}

export const fabConfig: Record<string, FABAction[]> = {
  "/": [
    { icon: Utensils, label: "Mahlzeit", href: "/nutrition/add", variant: "secondary" },
    { icon: Dumbbell, label: "Training", href: "/training/workout/new", variant: "secondary" },
    { icon: MessageSquare, label: "Coach", href: "/coach", variant: "secondary" },
  ],
  "/nutrition": [
    { icon: Plus, label: "Mahlzeit", href: "/nutrition/add", variant: "default" },
  ],
  "/training": [
    { icon: Dumbbell, label: "Workout", href: "/training/workout/new", variant: "default" },
  ],
}

export function getFABActions(pathname: string): FABAction[] | null {
  // Exact match first
  if (fabConfig[pathname]) {
    return fabConfig[pathname]
  }

  // Check for parent routes
  for (const route of Object.keys(fabConfig)) {
    if (pathname.startsWith(route) && route !== "/") {
      return fabConfig[route]
    }
  }

  return null
}
