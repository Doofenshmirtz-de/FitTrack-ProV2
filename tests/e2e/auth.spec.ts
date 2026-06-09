import { test, expect } from '@playwright/test'

/**
 * E2E Test: Auth Flow
 * Journey: Register → Onboarding → Dashboard-Landing
 */

test.describe('Authentication Flow', () => {
  const registerEmail = `test-${Date.now()}@example.com`
  const registerPassword = 'TestPassword123!'
  const loginEmail = process.env.TEST_USER_EMAIL || registerEmail
  const loginPassword = process.env.TEST_USER_PASSWORD || registerPassword

  test('should complete full registration and onboarding flow', async ({ page }) => {
    // 1. Navigate to register page
    await page.goto('/de/register')
    
    // Verify register page loaded
    await expect(page.getByRole('heading', { name: /registrieren|sign up/i })).toBeVisible()
    
    // 2. Fill registration form
    await page.getByLabel(/e-mail|email/i).fill(registerEmail)
    await page.getByLabel(/^passwort$|^password$/i).fill(registerPassword)
    await page.getByRole('button', { name: /konto erstellen|registrieren|sign up|weiter|continue/i }).click()
    
    // 3. Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/)
    
    // 4. Step 1: Personal data
    await expect(page.getByText(/deine daten|your data/i)).toBeVisible()
    await page.getByLabel(/größe|height/i).fill('180')
    await page.getByLabel(/gewicht|weight/i).fill('80')
    await page.getByRole('button', { name: /weiter|next|continue/i }).click()
    
    // 5. Step 2: Fitness goal
    await expect(page.getByText(/dein ziel|your goal/i)).toBeVisible()
    await page.getByLabel(/muskelaufbau|muscle gain/i).check()
    await page.getByLabel(/aktiv|active/i).check()
    await page.getByRole('button', { name: /weiter|next|continue/i }).click()
    
    // 6. Step 3: Health Connect (skip)
    await expect(page.getByText(/health connect/i)).toBeVisible()
    await page.getByRole('button', { name: /überspringen|skip/i }).click()
    
    // 7. Should land on dashboard
    await expect(page).toHaveURL(/\/de$/)
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    
    // 8. Verify bottom navigation
    await expect(page.getByRole('link', { name: /dashboard|home/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /ernährung|nutrition/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /training|workout/i })).toBeVisible()
  })

  test('should login with existing credentials', async ({ page }) => {
    // 1. Navigate to login
    await page.goto('/de/login')
    
    // 2. Fill login form
    await page.getByLabel(/e-mail|email/i).fill(loginEmail)
    await page.getByLabel(/^passwort$|^password$/i).fill(loginPassword)
    await page.getByRole('button', { name: /anmelden|sign in/i }).click()
    
    // 3. Should redirect to dashboard
    await expect(page).toHaveURL(/\/de$/)
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/de/login')
    
    await page.getByLabel(/e-mail|email/i).fill('invalid@example.com')
    await page.getByLabel(/passwort|password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /anmelden|sign in|login/i }).click()
    
    // Should show error message
    await expect(page.getByText(/fehlgeschlagen|failed|ungültig|invalid/i)).toBeVisible()
  })
})
