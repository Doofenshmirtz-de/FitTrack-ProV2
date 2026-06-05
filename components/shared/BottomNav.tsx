"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import {
  Home,
  Utensils,
  Dumbbell,
  MessageSquare,
  User,
} from "lucide-react"

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/nutrition",
    label: "Ernährung",
    icon: Utensils,
  },
  {
    href: "/training",
    label: "Training",
    icon: Dumbbell,
  },
  {
    href: "/coach",
    label: "Coach",
    icon: MessageSquare,
  },
  {
    href: "/profile",
    label: "Profil",
    icon: User,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  // Don't show on auth pages
  if (pathname.startsWith("/(auth)") || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-elevated border-t border-border">
      <div className="max-w-app mx-auto px-4 pb-safe">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 rounded-lg transition-colors",
                  isActive
                    ? "text-accent-primary"
                    : "text-foreground-tertiary hover:text-foreground-secondary"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
