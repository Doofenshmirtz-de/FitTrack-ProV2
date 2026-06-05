"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Plus, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils/cn"
import { getFABActions } from "@/lib/config/fab-config"
import { Button } from "@/components/ui/button"

export function QuickAddFAB() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const actions = getFABActions(pathname)

  // Don't render if no actions for this route
  if (!actions) return null

  const mainAction = actions[0]
  const secondaryActions = actions.slice(1)
  const hasSecondaryActions = secondaryActions.length > 0

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && hasSecondaryActions && (
          <>
            {secondaryActions.map((action, index) => (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={action.href}>
                  <Button
                    size="sm"
                    className="flex items-center gap-2 shadow-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {hasSecondaryActions ? (
        <Button
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-transform",
            isOpen && "rotate-45"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      ) : (
        <Link href={mainAction.href}>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <mainAction.icon className="h-6 w-6" />
          </Button>
        </Link>
      )}
    </div>
  )
}
