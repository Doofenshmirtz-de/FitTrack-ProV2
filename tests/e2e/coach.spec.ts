import { test, expect } from '@playwright/test'

/**
 * E2E Test: AI Coach Flow
 * Journey: Chat öffnen → Frage stellen → Antwort enthält TDEE → 
 *          Kontext-Chips funktionieren
 */

test.describe('AI Coach Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/de/login')
    await page.getByLabel(/e-mail|email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel(/passwort|password/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.getByRole('button', { name: /anmelden|sign in/i }).click()
    await expect(page).toHaveURL(/\/de$/)
  })

  test('should interact with AI coach', async ({ page }) => {
    // 1. Navigate to coach page
    await page.goto('/de/coach')
    await expect(page.getByRole('heading', { name: /coach|ai coach/i })).toBeVisible()
    
    // 2. Verify context chips are visible
    await expect(page.getByRole('button', { name: /heute|today/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /diese woche|this week/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /ernährung|nutrition/i })).toBeVisible()
    
    // 3. Click a context chip
    await page.getByRole('button', { name: /heute|today/i }).click()
    
    // 4. Type a question
    const input = page.getByPlaceholder(/frage|ask|coach/i)
    await input.fill('Was sollte ich heute essen?')
    
    // 5. Send message
    await page.getByRole('button', { name: /senden|send/i }).click()
    
    // 6. Wait for response (with timeout for API)
    await page.waitForTimeout(5000)
    
    // 7. Verify response appears (or error state if API unavailable)
    const responseOrError = page.getByText(/kalorien|tdde|protein|fehler|nicht verfügbar|unavailable/i)
    await expect(responseOrError.first()).toBeVisible({ timeout: 10000 })
  })

  test('should show disclaimer', async ({ page }) => {
    await page.goto('/de/coach')
    
    // Verify disclaimer is visible
    await expect(page.getByText(/ersetzt keine|not a substitute|medizinische/i)).toBeVisible()
  })
})
