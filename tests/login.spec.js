// @ts-check
const { test, expect } = require('@playwright/test');

// Account on file for this demo (see login.html)
const VALID_EMAIL = 'abcd@example.com';
const VALID_PASSWORD = 'abcd1234'; // exactly 8 characters

function loginLocators(page) {
  return {
    email: page.getByLabel('Email'),
    password: page.getByLabel('Password'),
    signIn: page.getByRole('button', { name: 'Sign in' }),
    status: page.getByRole('status'),
  };
}

test.beforeEach(async ({ page }) => {
  // Each test gets a fresh, isolated browser context, so sessionStorage is
  // already empty here — no manual clearing needed before visiting the page.
  await page.goto('/login.html');
});

test.describe('Login page — mandatory fields', () => {
  test('TC_LOGIN_002: shows an error when Email is left blank', async ({ page }) => {
    const { password, signIn, status } = loginLocators(page);
    await password.fill(VALID_PASSWORD);
    await signIn.click();

    await expect(status).toHaveText('⚠ email and password are required');
    await expect(page).toHaveURL(/login\.html$/);
  });

  test('TC_LOGIN_003: shows an error when Password is left blank', async ({ page }) => {
    const { email, signIn, status } = loginLocators(page);
    await email.fill(VALID_EMAIL);
    await signIn.click();

    await expect(status).toHaveText('⚠ email and password are required');
    await expect(page).toHaveURL(/login\.html$/);
  });

  test('TC_LOGIN_004 / TC_LOGIN_020: shows an error and blocks submission when both fields are blank', async ({ page }) => {
    const { signIn, status } = loginLocators(page);
    await signIn.click();

    await expect(status).toHaveText('⚠ email and password are required');
    await expect(page).toHaveURL(/login\.html$/);
  });
});

test.describe('Login page — email format validation', () => {
  test('TC_LOGIN_005: rejects an email missing the @ symbol', async ({ page }) => {
    const { email, password, signIn, status } = loginLocators(page);
    await email.fill('userexample.com');
    await password.fill(VALID_PASSWORD);
    await signIn.click();

    await expect(status).toHaveText('⚠ enter a valid email address');
  });

  test('TC_LOGIN_006: rejects an email containing spaces', async ({ page }) => {
    const { email, password, signIn, status } = loginLocators(page);
    await email.fill('us er@ex ample.com');
    await password.fill(VALID_PASSWORD);
    await signIn.click();

    await expect(status).toHaveText('⚠ enter a valid email address');
  });
});

test.describe('Login page — password length validation', () => {
  test('TC_LOGIN_007: rejects a password shorter than 8 characters', async ({ page }) => {
    const { email, password, signIn, status } = loginLocators(page);
    await email.fill(VALID_EMAIL);
    await password.fill('Pass1');
    await signIn.click();

    await expect(status).toHaveText('⚠ password must be at least 8 characters');
  });

  test('TC_LOGIN_009: rejects a 7-character password (boundary, just under the minimum)', async ({ page }) => {
    const { email, password, signIn, status } = loginLocators(page);
    await email.fill(VALID_EMAIL);
    await password.fill('abcd123');
    await signIn.click();

    await expect(status).toHaveText('⚠ password must be at least 8 characters');
  });

  test('TC_LOGIN_008: accepts an 8-character password (boundary, meets the minimum)', async ({ page }) => {
    const { email, password, signIn } = loginLocators(page);
    await email.fill(VALID_EMAIL);
    await password.fill(VALID_PASSWORD);
    await signIn.click();

    await expect(page).toHaveURL(/\/index\.html$/);
  });
});

test.describe('Login page — authentication outcomes', () => {
  test('TC_LOGIN_001 / TC_LOGIN_019: valid credentials redirect to the Dashboard', async ({ page }) => {
    const { email, password, signIn } = loginLocators(page);
    await email.fill(VALID_EMAIL);
    await password.fill(VALID_PASSWORD);
    await signIn.click();

    // index.html stands in for the Dashboard in this demo project
    await expect(page).toHaveURL(/\/index\.html$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('TC_LOGIN_010 / TC_LOGIN_013: valid email, wrong password shows the exact error text', async ({ page }) => {
    const { email, password, signIn, status } = loginLocators(page);
    await email.fill(VALID_EMAIL);
    await password.fill('WrongPass1');
    await signIn.click();

    await expect(status).toHaveText('✕ Invalid email or password.');
    await expect(page).toHaveURL(/login\.html$/);
  });

  test('TC_LOGIN_011: an unregistered (but valid-format) email shows "Invalid email or password."', async ({ page }) => {
    const { email, password, signIn, status } = loginLocators(page);
    await email.fill('nouser@example.com');
    await password.fill('Passw0rd1');
    await signIn.click();

    await expect(status).toHaveText('✕ Invalid email or password.');
  });

  test('TC_LOGIN_012: both email and password wrong (but validly formatted)', async ({ page }) => {
    const { email, password, signIn, status } = loginLocators(page);
    await email.fill('wrong@example.com');
    await password.fill('WrongPass9');
    await signIn.click();

    await expect(status).toHaveText('✕ Invalid email or password.');
  });

  test('TC_LOGIN_014: password comparison is case-sensitive', async ({ page }) => {
    const { email, password, signIn, status } = loginLocators(page);
    await email.fill(VALID_EMAIL);
    await password.fill(VALID_PASSWORD.toUpperCase());
    await signIn.click();

    await expect(status).toHaveText('✕ Invalid email or password.');
    await expect(page).toHaveURL(/login\.html$/);
  });

  test('TC_LOGIN_015: leading/trailing whitespace in the email is trimmed before comparison', async ({ page }) => {
    const { email, password, signIn } = loginLocators(page);
    await email.fill(`  ${VALID_EMAIL}  `);
    await password.fill(VALID_PASSWORD);
    await signIn.click();

    await expect(page).toHaveURL(/\/index\.html$/);
  });
});

test.describe('Login page — UI and input safety', () => {
  test('TC_LOGIN_016: the password field masks its input', async ({ page }) => {
    const { password } = loginLocators(page);
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('TC_LOGIN_017: a SQL-injection style email is rejected by format validation, not executed', async ({ page }) => {
    const { email, password, signIn, status } = loginLocators(page);
    await email.fill("' OR '1'='1");
    await password.fill(VALID_PASSWORD);
    await signIn.click();

    await expect(status).toHaveText('⚠ enter a valid email address');
    await expect(page).toHaveURL(/login\.html$/);
    expect(await page.evaluate(() => sessionStorage.getItem('auth'))).toBeNull();
  });

  test('TC_LOGIN_018: a script-injection style email is rejected and never executes', async ({ page }) => {
    let dialogFired = false;
    page.once('dialog', () => { dialogFired = true; });

    const { email, password, signIn, status } = loginLocators(page);
    await email.fill('<script>alert(1)</script>');
    await password.fill(VALID_PASSWORD);
    await signIn.click();

    await expect(status).toHaveText('⚠ enter a valid email address');
    expect(dialogFired).toBe(false);
  });
});
