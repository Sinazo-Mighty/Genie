/**
 * Email validation utilities
 */

// Email regex pattern for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false
  }

  return EMAIL_REGEX.test(email.trim())
}

/**
 * Validates email and returns error message if invalid
 */
export function getEmailValidationError(email: string): string | null {
  if (!email) {
    return "Email is required"
  }

  if (!validateEmail(email)) {
    return "Please enter a valid email address"
  }

  return null
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== "string") {
    return false
  }

  // At least 8 characters
  return password.length >= 8
}

/**
 * Gets password validation error message
 */
export function getPasswordValidationError(password: string): string | null {
  if (!password) {
    return "Password is required"
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long"
  }

  return null
}
