import Dexie, { type Table } from 'dexie'

export type PendingOperationType = 'food_log' | 'workout_set' | 'workout_session' | 'workout_complete'

export interface PendingOperation {
  id?: number
  type: PendingOperationType
  payload: unknown
  timestamp: number
  retryCount: number
  errorMessage?: string
}

export interface FailedOperation extends PendingOperation {
  failedAt: number
  finalError: string
}

class OfflineQueueDB extends Dexie {
  pending!: Table<PendingOperation, number>
  failed!: Table<FailedOperation, number>

  constructor() {
    super('FitTrackProOfflineQueue')
    this.version(1).stores({
      pending: '++id, type, timestamp',
      failed: '++id, type, failedAt'
    })
  }
}

export const offlineQueue = new OfflineQueueDB()

// Queue-Operationen
export async function addToQueue(
  type: PendingOperationType,
  payload: unknown
): Promise<number> {
  return await offlineQueue.pending.add({
    type,
    payload,
    timestamp: Date.now(),
    retryCount: 0
  })
}

export async function removeFromQueue(id: number): Promise<void> {
  await offlineQueue.pending.delete(id)
}

export async function updateRetryCount(
  id: number,
  errorMessage?: string
): Promise<void> {
  const item = await offlineQueue.pending.get(id)
  if (item) {
    await offlineQueue.pending.update(id, {
      retryCount: item.retryCount + 1,
      errorMessage
    })
  }
}

export async function moveToFailed(
  item: PendingOperation,
  finalError: string
): Promise<void> {
  await offlineQueue.transaction('rw', offlineQueue.pending, offlineQueue.failed, async () => {
    await offlineQueue.pending.delete(item.id!)
    await offlineQueue.failed.add({
      ...item,
      failedAt: Date.now(),
      finalError
    })
  })
}

export async function getQueueStats(): Promise<{
  pending: number
  failed: number
  oldestPending: number | null
}> {
  const pendingCount = await offlineQueue.pending.count()
  const failedCount = await offlineQueue.failed.count()
  
  const oldest = await offlineQueue.pending
    .orderBy('timestamp')
    .first()
  
  return {
    pending: pendingCount,
    failed: failedCount,
    oldestPending: oldest?.timestamp || null
  }
}

export async function clearFailedQueue(): Promise<void> {
  await offlineQueue.failed.clear()
}

export async function retryFailedOperation(id: number): Promise<boolean> {
  const failed = await offlineQueue.failed.get(id)
  if (!failed) return false
  
  await offlineQueue.transaction('rw', offlineQueue.pending, offlineQueue.failed, async () => {
    await offlineQueue.failed.delete(id)
    await offlineQueue.pending.add({
      type: failed.type,
      payload: failed.payload,
      timestamp: Date.now(),
      retryCount: 0
    })
  })
  
  return true
}
