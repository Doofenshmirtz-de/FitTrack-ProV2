'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User, AuthError } from '@supabase/supabase-js'
import { setSentryUser, identifyUser, resetUser } from '@/lib/monitoring'

function isInvalidRefreshToken(error: AuthError): boolean {
  return error.status === 400 && error.code === 'refresh_token_not_found'
}

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const handleInvalidSession = async () => {
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch {
        // ignore sign-out errors
      }
      router.push('/login')
    }

    // Get initial user
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        if (isInvalidRefreshToken(error)) {
          await handleInvalidSession()
        }
        setIsLoading(false)
        return
      }

      if (user) {
        setUser(user)
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
  }, [router])

  return { user, isLoading }
}
