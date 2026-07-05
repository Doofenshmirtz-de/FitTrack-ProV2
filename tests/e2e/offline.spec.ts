import { test, expect } from '@playwright/test'

/**
 * E2E Test: Offline Flow
 * Journey: Workout starten → Netzwerk trennen → Set loggen →
 *          Workout beenden → Summary zeigt Offline-Queue → Banner sichtbar
 */

test.describe('Offline Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/de/login')
    await page.getByLabel('E-Mail').fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel('Passwort').fill(process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.getByRole('button', { name: 'Anmelden' }).click()
    await expect(page).toHaveURL(/\/de$/)
  })

  test('should queue workout when offline and show banner', async ({ page, context }) => {
    // 1. Go to training page and start free workout
    await page.goto('/de/training')
    await page.getByRole('link', { name: /workout starten/i }).click()
    await page.getByRole('button', { name: 'Starten' }).click()

    // 2. Add exercise
    await page.getByRole('button', { name: 'Übung hinzufügen' }).click()
    await page.getByText('Kniebeuge').first().click()
    await expect(page.getByText('Kniebeuge')).toBeVisible()

    // 3. Simulate offline
    await context.setOffline(true)
    await expect(page.getByText('Offline - Daten werden lokal gespeichert')).toBeVisible()

    // 4. Log a set while offline
    const weightInput = page.locator('input[type="number"]').first()
    const repsInput = page.locator('input[type="number"]').nth(1)
    await weightInput.fill('100')
    await repsInput.fill('5')

    await page.getByRole('button', { name: '60' }).first().click()
    await page.getByRole('button', { name: 'Weiter' }).click()

    // 5. Finish workout
    await page.getByRole('button', { name: 'Beenden' }).click()

    // 6. Summary should show offline/queued indicator
    await expect(page.getByText('Geschafft!')).toBeVisible()
    await expect(page.getByText('Offline gespeichert')).toBeVisible()

    // 7. Restore online
    await context.setOffline(false)

    // 8. Navigate to training and verify workout appears in recent history
    await page.goto('/de/training')
    await expect(page.getByText('Kniebeuge')).toBeVisible()
  })

  test('should show offline banner when disconnected', async ({ page, context }) => {
    await page.goto('/de')

    // Simulate offline
    await context.setOffline(true)
    await expect(page.getByText('Offline - Daten werden lokal gespeichert').first()).toBeVisible()

    // Restore online
    await context.setOffline(false)
    await expect(page.getByText('Offline - Daten werden lokal gespeichert')).not.toBeVisible()
  })
})
