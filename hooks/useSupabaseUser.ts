'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { setSentryUser, identifyUser, resetUser } from '@/lib/monitoring'

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial user
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!error && user) {
        setUser(user)
        // Set monitoring user context
        setSentryUser({ id: user.id, email: user.email })
        identifyUser(user.id, { email: user.email })
      }
      setIsLoading(false)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        setSentryUser({ id: currentUser.id, email: currentUser.email })
        identifyUser(currentUser.id, { email: currentUser.email })
      } else {
        setSentryUser(null)
        resetUser()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, isLoading }
}
