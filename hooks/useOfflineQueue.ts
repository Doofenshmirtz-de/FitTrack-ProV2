'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getQueueStats,
  clearFailedQueue,
  retryFailedOperation,
  forceSync,
  type FailedOperation
} from '@/lib/offline/offlineQueue'
import { offlineQueue } from '@/lib/offline/offlineQueue'

interface QueueStatus {
  pending: number
  failed: number
  isOnline: boolean
  isSyncing: boolean
  lastSyncAt: number | null
}

export function useOfflineQueue() {
  const [status, setStatus] = useState<QueueStatus>({
    pending: 0,
    failed: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncAt: null
  })

  const [failedItems, setFailedItems] = useState<FailedOperation[]>([])

  // Status aktualisieren
  const refreshStatus = useCallback(async () => {
    const stats = await getQueueStats()
    setStatus(prev => ({
      ...prev,
      pending: stats.pending,
      failed: stats.failed
    }))
  }, [])

  // Failed Items laden
  const refreshFailedItems = useCallback(async () => {
    const items = await offlineQueue.failed.orderBy('failedAt').reverse().toArray()
    setFailedItems(items)
  }, [])

  // Online-Status überwachen
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }))
      // Auto-sync bei Wiederverbindung
      handleSync()
    }

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }))
    }

    const handleSyncComplete = (event: CustomEvent) => {
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: Date.now(),
        ...event.detail
      }))
      refreshFailedItems()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('offlinesync:complete', handleSyncComplete as EventListener)

    // Initial status
    refreshStatus()
    refreshFailedItems()

    // Polling alle 30 Sekunden für pending items
    const interval = setInterval(refreshStatus, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('offlinesync:complete', handleSyncComplete as EventListener)
      clearInterval(interval)
    }
  }, [refreshStatus, refreshFailedItems])

  // Manuelles Sync
  const handleSync = useCallback(async () => {
    if (status.isSyncing) return
    
    setStatus(prev => ({ ...prev, isSyncing: true }))
    try {
      const result = await forceSync()
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: Date.now(),
        pending: result.result.remaining,
        failed: prev.failed + result.result.failed
      }))
      await refreshFailedItems()
    } catch {
      setStatus(prev => ({ ...prev, isSyncing: false }))
    }
  }, [status.isSyncing, refreshFailedItems])

  // Failed Items löschen
  const clearFailed = useCallback(async () => {
    await clearFailedQueue()
    await refreshStatus()
    await refreshFailedItems()
  }, [refreshStatus, refreshFailedItems])

  // Einzelnes Failed Item retry
  const retryFailed = useCallback(async (id: number) => {
    await retryFailedOperation(id)
    await refreshStatus()
    await refreshFailedItems()
    // Sofort sync versuchen
    await handleSync()
  }, [refreshStatus, refreshFailedItems, handleSync])

  return {
    status,
    failedItems,
    sync: handleSync,
    clearFailed,
    retryFailed,
    refreshStatus
  }
}
