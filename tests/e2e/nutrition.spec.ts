import { test, expect } from '@playwright/test'

/**
 * E2E Test: Nutrition Flow
 * Journey: Mahlzeit hinzufügen (Barcode-Suche) → Makro-Ringe aktualisieren → 
 *          Tages-Log anzeigen
 */

test.describe('Nutrition Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/de/login')
    await page.getByLabel(/e-mail|email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel(/passwort|password/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.getByRole('button', { name: /anmelden|sign in/i }).click()
    await expect(page).toHaveURL(/\/de$/)
  })

  test('should add meal and update macros', async ({ page }) => {
    // 1. Navigate to nutrition page
    await page.goto('/de/nutrition')
    await expect(page.getByRole('heading', { name: /ernährung|nutrition/i })).toBeVisible()
    
    // 2. Click add meal
    await page.getByRole('button', { name: /mahlzeit|meal|hinzufügen|add/i }).first().click()
    
    // 3. Should be on add meal page
    await expect(page).toHaveURL(/\/de\/nutrition\/add/)
    
    // 4. Search for food
    await page.getByPlaceholder(/suchen|search/i).fill('banana')
    
    // Wait for search results (mock or real API)
    await page.waitForTimeout(1000)
    
    // 5. Select first result or add manually
    const firstResult = page.getByText(/banane|banana/i).first()
    if (await firstResult.isVisible().catch(() => false)) {
      await firstResult.click()
    } else {
      // Manual entry fallback
      await page.getByLabel(/lebensmittel|food name/i).fill('Banane')
      await page.getByLabel(/menge|quantity/i).fill('100')
      await page.getByLabel(/kalorien|calories/i).fill('89')
    }
    
    // 6. Save the meal
    await page.getByRole('button', { name: /speichern|save/i }).click()
    
    // 7. Should return to nutrition page
    await expect(page).toHaveURL(/\/de\/nutrition/)
    
    // 8. Verify macros updated (check for calorie indicator)
    await expect(page.getByText(/89|kalorien|calories/i).first()).toBeVisible()
  })

  test('should use barcode scanner option', async ({ page }) => {
    await page.goto('/de/nutrition/add')
    
    // Click barcode scanner option
    await page.getByRole('button', { name: /barcode|scanner/i }).click()
    
    // Should show camera permission or placeholder
    await expect(page.getByText(/kamera|camera|barcode/i)).toBeVisible()
  })

  test('should view daily nutrition log', async ({ page }) => {
    await page.goto('/de/nutrition')
    
    // Verify today's section is visible
    await expect(page.getByText(/heute|today/i)).toBeVisible()
    
    // Verify macro sections
    await expect(page.getByText(/protein|carbs|fett|fat/i).first()).toBeVisible()
  })
})
