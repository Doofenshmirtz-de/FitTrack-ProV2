import { test, expect } from '@playwright/test'

/**
 * E2E Test: Workout Flow
 * Journey: Training starten → Übung auswählen → Set loggen (80kg × 8) →
 *          Pause-Timer → Workout beenden → Summary zeigt Volumen und PRs
 */

test.describe('Workout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/de/login')
    await page.getByLabel('E-Mail').fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel('Passwort').fill(process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.getByRole('button', { name: 'Anmelden' }).click()
    await expect(page).toHaveURL(/\/de$/)
  })

  test('should complete full free workout flow', async ({ page }) => {
    // 1. Navigate to training page and start free workout
    await page.goto('/de/training')
    await expect(page.getByRole('heading', { name: 'Training' })).toBeVisible()
    await page.getByRole('link', { name: /workout starten/i }).click()

    // 2. Start workout
    await expect(page.getByRole('heading', { name: 'Training starten' })).toBeVisible()
    await page.getByRole('button', { name: 'Starten' }).click()

    // 3. Add exercise
    await page.getByRole('button', { name: 'Übung hinzufügen' }).click()
    await page.getByPlaceholder('Übung suchen...').fill('Bankdrücken')
    await page.getByText('Bankdrücken').first().click()
    await expect(page.getByText('Bankdrücken')).toBeVisible()

    // 4. Log a set (80 kg × 8)
    const weightInput = page.locator('input[type="number"]').first()
    const repsInput = page.locator('input[type="number"]').nth(1)
    await weightInput.fill('80')
    await repsInput.fill('8')

    // 5. Complete the set (starts 60s rest timer)
    await page.getByRole('button', { name: '60' }).first().click()
    await expect(page.getByText('Pause')).toBeVisible()

    // 6. Skip rest timer
    await page.getByRole('button', { name: 'Weiter' }).click()
    await expect(page.getByText('Pause')).not.toBeVisible()

    // 7. Finish workout
    await page.getByRole('button', { name: 'Beenden' }).click()

    // 8. Summary page should show stats
    await expect(page.getByText('Geschafft!')).toBeVisible()
    await expect(page.getByText(/640/)).toBeVisible()
    await expect(page.getByText('1 Sätze')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Nächstes Workout' })).toBeVisible()
  })
})
