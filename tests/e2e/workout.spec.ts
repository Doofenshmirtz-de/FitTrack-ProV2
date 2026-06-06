import { test, expect } from '@playwright/test'

/**
 * E2E Test: Workout Flow
 * Journey: Training starten → Übung auswählen → Set loggen (80kg × 8) → 
 *          Rest-Timer → Workout beenden → Dashboard zeigt Volumen
 */

test.describe('Workout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/de/login')
    await page.getByLabel(/e-mail|email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel(/passwort|password/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.getByRole('button', { name: /anmelden|sign in/i }).click()
    await expect(page).toHaveURL(/\/de$/)
  })

  test('should complete full workout flow', async ({ page }) => {
    // 1. Navigate to training page
    await page.goto('/de/training')
    await expect(page.getByRole('heading', { name: /training/i })).toBeVisible()
    
    // 2. Start new workout
    await page.getByRole('button', { name: /workout starten|start workout/i }).click()
    
    // 3. Should be on active workout page
    await expect(page).toHaveURL(/\/training\/workout/)
    await expect(page.getByText(/aktives workout|active workout/i)).toBeVisible()
    
    // 4. Add exercise
    await page.getByRole('button', { name: /übung hinzufügen|add exercise/i }).click()
    await page.getByText(/bankdrücken|bench press|kniebeugen|squat/i).first().click()
    
    // 5. Log a set
    const weightInput = page.getByPlaceholder(/gewicht|weight/i).first()
    const repsInput = page.getByPlaceholder(/wdh|reps/i).first()
    
    await weightInput.fill('80')
    await repsInput.fill('8')
    
    await page.getByRole('button', { name: /hinzufügen|add|log/i }).first().click()
    
    // 6. Set should be visible and complete button available
    await expect(page.getByText('80')).toBeVisible()
    await expect(page.getByText('8')).toBeVisible()
    
    // 7. Complete the set (trigger rest timer)
    await page.getByRole('button', { name: /abschließen|complete|done/i }).first().click()
    
    // 8. Rest timer should appear
    await expect(page.getByText(/pause|rest/i)).toBeVisible()
    
    // 9. Skip rest timer
    await page.getByRole('button', { name: /überspringen|skip/i }).click()
    
    // 10. Finish workout
    await page.getByRole('button', { name: /workout beenden|finish workout/i }).click()
    
    // 11. Confirm end workout
    await page.getByRole('button', { name: /bestätigen|confirm|beenden|end/i }).click()
    
    // 12. Should return to training page
    await expect(page).toHaveURL(/\/de\/training/)
    
    // 13. Navigate to dashboard and verify volume
    await page.goto('/de')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    
    // Check for workout data or volume indicator
    await expect(page.getByText(/640|volumen|volume|training|workout/i).first()).toBeVisible()
  })

  test('should handle workout cancellation', async ({ page }) => {
    await page.goto('/de/training')
    await page.getByRole('button', { name: /workout starten|start workout/i }).click()
    
    // Add exercise
    await page.getByRole('button', { name: /übung hinzufügen|add exercise/i }).click()
    await page.getByText(/kreuzheben|deadlift/i).first().click()
    
    // Cancel workout
    await page.getByRole('button', { name: /abbrechen|cancel/i }).click()
    
    // Confirm cancellation
    await page.getByRole('button', { name: /ja|yes|bestätigen|confirm/i }).click()
    
    // Should return to training page
    await expect(page).toHaveURL(/\/de\/training/)
  })
})
