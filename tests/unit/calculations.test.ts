import { describe, it, expect } from 'vitest'
import { calculateRecoveryScore } from '@/lib/calculations/recovery'
import { calculateTDEE } from '@/lib/calculations/tdee'

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
    const score = calculateRecoveryScore(mockDaily as any, mockWeeklyAvg as any)
    
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
    expect(typeof score).toBe('number')
  })

  it('should handle missing sleep score gracefully', () => {
    const dailyWithoutSleep = { ...mockDaily, sleep_score: null }
    const score = calculateRecoveryScore(dailyWithoutSleep as any, mockWeeklyAvg as any)
    
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('should handle missing hrv gracefully', () => {
    const dailyWithoutHrv = { ...mockDaily, hrv_score: null, hrv_rmssd: null }
    const score = calculateRecoveryScore(dailyWithoutHrv as any, mockWeeklyAvg as any)
    
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
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
    activeMinutes: 60,
    caloriesBurned: 2800,
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
    const lowActivity = { ...mockHealthDaily, activeMinutes: 20 }
    const highActivity = { ...mockHealthDaily, activeMinutes: 120 }
    
    const lowTdee = calculateTDEE(mockProfile, lowActivity as any)
    const highTdee = calculateTDEE(mockProfile, highActivity as any)
    
    expect(highTdee).toBeGreaterThan(lowTdee)
  })

  it('should handle edge case with zero activity', () => {
    const noActivity = { ...mockHealthDaily, activeMinutes: 0, caloriesBurned: 1800 }
    const tdee = calculateTDEE(mockProfile, noActivity as any)
    
    expect(tdee).toBeGreaterThan(1000)
    expect(typeof tdee).toBe('number')
  })
})

describe('Muscle Status Calculation', () => {
  it('should identify neglected muscles', () => {
    const lastTrained = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
    const isRecoveryWeek = false
    
    // Import the function
    const { getMuscleStatus } = require('@/lib/calculations/muscles')
    const status = getMuscleStatus(lastTrained, 100, isRecoveryWeek)
    
    expect(status).toBe('neglected')
  })

  it('should show fresh muscles during recovery week', () => {
    const lastTrained = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
    const isRecoveryWeek = true
    
    const { getMuscleStatus } = require('@/lib/calculations/muscles')
    const status = getMuscleStatus(lastTrained, 100, isRecoveryWeek)
    
    expect(status).toBe('fresh')
  })
})
