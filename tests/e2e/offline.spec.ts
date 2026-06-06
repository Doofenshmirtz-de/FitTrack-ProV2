import { test, expect } from '@playwright/test'

/**
 * E2E Test: Offline Flow
 * Journey: Netzwerk trennen → Set loggen → Online gehen → 
 *          Sync erfolgreich → Daten in DB
 */

test.describe('Offline Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/de/login')
    await page.getByLabel(/e-mail|email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel(/passwort|password/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.getByRole('button', { name: /anmelden|sign in/i }).click()
    await expect(page).toHaveURL(/\/de$/)
  })

  test('should handle offline mode and sync', async ({ page, context }) => {
    // 1. Go to training page and start workout
    await page.goto('/de/training')
    await page.getByRole('button', { name: /workout starten|start workout/i }).click()
    
    // 2. Add exercise
    await page.getByRole('button', { name: /übung hinzufügen|add exercise/i }).click()
    await page.getByText(/bankdrücken|bench press/i).first().click()
    
    // 3. Simulate offline
    await context.setOffline(true)
    
    // 4. Verify offline indicator
    await expect(page.getByText(/offline/i)).toBeVisible()
    
    // 5. Log a set while offline
    await page.getByPlaceholder(/gewicht|weight/i).first().fill('60')
    await page.getByPlaceholder(/wdh|reps/i).first().fill('10')
    await page.getByRole('button', { name: /hinzufügen|add/i }).first().click()
    
    // 6. Complete set
    await page.getByRole('button', { name: /abschließen|complete/i }).first().click()
    await page.getByRole('button', { name: /überspringen|skip/i }).click()
    
    // 7. Finish workout
    await page.getByRole('button', { name: /workout beenden|finish/i }).click()
    await page.getByRole('button', { name: /bestätigen|confirm/i }).click()
    
    // 8. Verify queued indicator
    await expect(page.getByText(/warteschlange|queue|wird synchronisiert|syncing/i)).toBeVisible()
    
    // 9. Go back online
    await context.setOffline(false)
    
    // 10. Trigger sync (manual or wait for auto)
    await page.goto('/de/profile')
    await page.getByRole('button', { name: /jetzt synchronisieren|sync now/i }).click()
    
    // 11. Wait for sync to complete
    await page.waitForTimeout(3000)
    
    // 12. Verify sync success
    await expect(page.getByText(/erfolgreich|success|abgeschlossen|complete/i)).toBeVisible()
  })

  test('should show offline banner when disconnected', async ({ page, context }) => {
    await page.goto('/de')
    
    // Simulate offline
    await context.setOffline(true)
    
    // Verify offline banner
    await expect(page.getByText(/offline/i).first()).toBeVisible()
    
    // Restore online
    await context.setOffline(false)
    
    // Banner should disappear or show online
    await expect(page.getByText(/online|verbunden|connected/i).first()).toBeVisible()
  })
})
