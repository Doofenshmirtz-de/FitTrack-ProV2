import { describe, it, expect } from 'vitest'
import { calculateRecoveryScore } from '@/lib/calculations/recovery'
import { calculateTDEE } from '@/lib/calculations/tdee'
import { getMuscleStatus } from '@/lib/calculations/muscles'

/**
 * Unit Tests for Business Logic
 */

describe('Recovery Score Calculation', () => {
  const mockDaily = {
    sleep_score: 80,
    hrv_rmssd: 45,
    hrv_score: 70,
    resting_heart_rate: 55,
  }

  const mockWeeklyAvg = {
    avgSleepScore: 75,
    avgHrv: 42,
  }

  it('should calculate recovery score with all metrics', () => {
    const result = calculateRecoveryScore(mockDaily as any, mockWeeklyAvg as any)
    
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(typeof result.score).toBe('number')
    expect(result.isEstimated).toBe(false)
  })

  it('should handle missing sleep score gracefully', () => {
    const dailyWithoutSleep = { ...mockDaily, sleep_score: null }
    const result = calculateRecoveryScore(dailyWithoutSleep as any, mockWeeklyAvg as any)
    
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.isEstimated).toBe(true) // Marked as estimated
  })

  it('should handle missing hrv gracefully', () => {
    const dailyWithoutHrv = { ...mockDaily, hrv_score: null, hrv_rmssd: null }
    const result = calculateRecoveryScore(dailyWithoutHrv as any, mockWeeklyAvg as any)
    
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.isEstimated).toBe(true) // Marked as estimated
  })
})

describe('TDEE Calculation', () => {
  const mockProfile = {
    weightKg: 80,
    heightCm: 180,
    age: 30,
    sex: 'male' as const,
  }

  const mockHealthDaily = {
    active_minutes: 60,
    calories_burned: 2800,
  }

  it('should calculate TDEE for male correctly', () => {
    const tdee = calculateTDEE(mockProfile, mockHealthDaily as any)
    
    expect(tdee).toBeGreaterThan(1500)
    expect(tdee).toBeLessThan(4000)
    expect(typeof tdee).toBe('number')
  })

  it('should calculate lower TDEE for female', () => {
    const femaleProfile = { ...mockProfile, sex: 'female' as const }
    const maleTdee = calculateTDEE(mockProfile, mockHealthDaily as any)
    const femaleTdee = calculateTDEE(femaleProfile, mockHealthDaily as any)
    
    expect(femaleTdee).toBeLessThan(maleTdee)
  })

  it('should adjust for activity level', () => {
    const lowActivity = { ...mockHealthDaily, active_minutes: 20 }
    const highActivity = { ...mockHealthDaily, active_minutes: 120 }

    const lowTdee = calculateTDEE(mockProfile, lowActivity as any)
    const highTdee = calculateTDEE(mockProfile, highActivity as any)

    expect(highTdee).toBeGreaterThan(lowTdee)
  })

  it('should handle edge case with zero activity', () => {
    const noActivity = { ...mockHealthDaily, active_minutes: 0, calories_burned: 1800 }
    const tdee = calculateTDEE(mockProfile, noActivity as any)

    expect(tdee).toBeGreaterThan(1000)
    expect(typeof tdee).toBe('number')
  })
})

describe('Muscle Status Calculation', () => {
  it('should identify neglected muscles', () => {
    const lastTrained = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
    const isRecoveryWeek = false
    
    const status = getMuscleStatus(lastTrained, 100, isRecoveryWeek)
    
    expect(status).toBe('neglected')
  })

  it('should show fresh muscles during recovery week', () => {
    const lastTrained = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
    const isRecoveryWeek = true
    
    const status = getMuscleStatus(lastTrained, 100, isRecoveryWeek)
    
    expect(status).toBe('fresh')
  })

  it('should identify muscles trained today', () => {
    const lastTrained = new Date() // Today
    const isRecoveryWeek = false
    
    const status = getMuscleStatus(lastTrained, 150, isRecoveryWeek)
    
    expect(status).toBe('trained_heavy')
  })

  it('should identify recovering muscles (1-2 days + high volume)', () => {
    const lastTrained = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    const isRecoveryWeek = false
    
    const status = getMuscleStatus(lastTrained, 100, isRecoveryWeek)
    
    expect(status).toBe('recovering')
  })

  it('should identify trained light (1-2 days + low volume)', () => {
    const lastTrained = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    const isRecoveryWeek = false
    
    const status = getMuscleStatus(lastTrained, 50, isRecoveryWeek)
    
    expect(status).toBe('trained_light')
  })

  it('should identify fresh muscles (3-5 days)', () => {
    const lastTrained = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
    const isRecoveryWeek = false
    
    const status = getMuscleStatus(lastTrained, 100, isRecoveryWeek)
    
    expect(status).toBe('fresh')
  })
})
