/**
 * Practical field validation for Indian teams — strict enough to catch typos,
 * lenient enough for everyday input (spaces, +91, leading 0, etc.).
 */

export type ValidateOptions = {
  required?: boolean
  label?: string
}

const DEFAULT_EMAIL_LABEL = "Email"
const DEFAULT_PHONE_LABEL = "Phone number"
const DEFAULT_URL_LABEL = "URL"

/** Lenient email check (not full RFC). */
export function isEmail(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(trimmed)
}

/** Indian mobile: 10 digits starting 6–9; optional +91 / 91 / leading 0. */
export function isIndianPhone(value: string): boolean {
  const digits = extractIndianMobileDigits(value)
  if (!digits) return false
  return /^[6-9]\d{9}$/.test(digits)
}

export function extractIndianMobileDigits(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  let digits = trimmed.replace(/[^\d+]/g, "")
  if (digits.startsWith("+")) digits = digits.slice(1)
  while (digits.startsWith("0")) digits = digits.slice(1)
  if (digits.startsWith("91") && digits.length > 10) digits = digits.slice(2)

  return digits.length ? digits : null
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return trimmed
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

export function isUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(normalizeUrl(trimmed))
    return Boolean(parsed.hostname && parsed.hostname.includes("."))
  } catch {
    return false
  }
}

export function validateEmail(value: string, options: ValidateOptions = {}): string | null {
  const { required = true, label = DEFAULT_EMAIL_LABEL } = options
  const trimmed = value.trim()
  if (!trimmed) return required ? `${label} is required` : null
  if (!isEmail(trimmed)) return `Enter a valid ${label.toLowerCase()} (e.g. name@company.com)`
  return null
}

export function validateIndianPhone(value: string, options: ValidateOptions = {}): string | null {
  const { required = false, label = DEFAULT_PHONE_LABEL } = options
  const trimmed = value.trim()
  if (!trimmed) return required ? `${label} is required` : null
  if (!isIndianPhone(trimmed)) {
    return `Enter a valid Indian ${label.toLowerCase()} (10 digits, e.g. 9876543210 or +91 98765 43210)`
  }
  return null
}

export function validateUrl(value: string, options: ValidateOptions = {}): string | null {
  const { required = true, label = DEFAULT_URL_LABEL } = options
  const trimmed = value.trim()
  if (!trimmed) return required ? `${label} is required` : null
  if (!isUrl(trimmed)) return `Enter a valid ${label.toLowerCase()} (e.g. https://drive.google.com/...)`
  return null
}

export function validateRequiredText(
  value: string,
  label: string,
  options: { minLength?: number } = {}
): string | null {
  const trimmed = value.trim()
  const min = options.minLength ?? 1
  if (!trimmed) return `${label} is required`
  if (trimmed.length < min) return `${label} must be at least ${min} characters`
  return null
}

export function validateRequiredSelection(
  value: string | null | undefined,
  label: string
): string | null {
  if (!value || !String(value).trim()) return `${label} is required`
  return null
}

/** Optional field: validates only when a value is entered. */
export function validateOptionalUrl(value: string, label = DEFAULT_URL_LABEL): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  return validateUrl(trimmed, { label })
}

export function validatePositiveInteger(
  value: string,
  options: { label?: string; min?: number; required?: boolean } = {}
): string | null {
  const { label = "Quantity", min = 1, required = true } = options
  const trimmed = value.trim()
  if (!trimmed) return required ? `${label} is required` : null
  const n = Number(trimmed)
  if (!Number.isInteger(n) || n < min) {
    return min === 1
      ? `${label} must be a positive whole number`
      : `${label} must be a whole number of at least ${min}`
  }
  return null
}

export function validateNonNegativeInteger(
  value: string,
  options: { label?: string; required?: boolean } = {}
): string | null {
  const { label = "Value", required = false } = options
  const trimmed = value.trim()
  if (!trimmed) return required ? `${label} is required` : null
  const n = Number(trimmed)
  if (!Number.isInteger(n) || n < 0) return `${label} must be a non-negative whole number`
  return null
}

export function validateMoneyAmount(
  value: string,
  options: { label?: string; required?: boolean } = {}
): string | null {
  const { label = "Cost", required = true } = options
  const trimmed = value.trim()
  if (!trimmed) return required ? `${label} is required` : null
  const n = Number(trimmed)
  if (Number.isNaN(n) || n < 0) return `${label} must be zero or a positive number`
  return null
}

/** 3-letter currency code (e.g. INR, USD). */
export function validateCurrency(value: string, options: { required?: boolean } = {}): string | null {
  const { required = true } = options
  const trimmed = value.trim()
  if (!trimmed) return required ? "Currency is required" : null
  if (!/^[A-Za-z]{3}$/.test(trimmed)) return "Currency must be a 3-letter code (e.g. INR)"
  return null
}

const ADHOC_TEXT_MAX = 8000

/** Adhoc description/output — link, text, or numbers (not URL-only). */
export function validateAdhocText(
  value: string,
  label: string,
  options: { required?: boolean; maxLength?: number } = {}
): string | null {
  const { required = false, maxLength = ADHOC_TEXT_MAX } = options
  const trimmed = value.trim()
  if (!trimmed) return required ? `${label} is required` : null
  if (trimmed.length > maxLength) return `${label} must be at most ${maxLength} characters`
  return null
}

export function validateEffortHours(value: string, options: { required?: boolean } = {}): string | null {
  const trimmed = value.trim()
  if (!trimmed) return options.required ? "Effort hours is required" : null
  const n = Number(trimmed)
  if (Number.isNaN(n) || n <= 0 || n > 999) return "Effort hours must be a positive number up to 999"
  return null
}

const WORK_TITLE_MAX = 500
const WORK_CONTEXT_MAX = 8000
const WORK_STEP_DESC_MAX = 2000
const WORK_STEPS_MAX = 50

export function validateWorkTitle(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return "Title is required"
  if (trimmed.length > WORK_TITLE_MAX) return `Title must be at most ${WORK_TITLE_MAX} characters`
  return null
}

export function validateWorkContext(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return "Context is required"
  if (trimmed.length > WORK_CONTEXT_MAX) return `Context must be at most ${WORK_CONTEXT_MAX} characters`
  return null
}

export function validateWorkStepDescription(value: string, index: number): string | null {
  const trimmed = value.trim()
  if (!trimmed) return `Step ${index + 1} description is required`
  if (trimmed.length > WORK_STEP_DESC_MAX) {
    return `Step ${index + 1} description must be at most ${WORK_STEP_DESC_MAX} characters`
  }
  return null
}

export function validateWorkSteps(
  steps: Array<{ description: string }>
): string | null {
  if (steps.length > WORK_STEPS_MAX) return `At most ${WORK_STEPS_MAX} steps allowed`
  for (let i = 0; i < steps.length; i++) {
    const err = validateWorkStepDescription(steps[i].description, i)
    if (err) return err
  }
  return null
}

/** Run validators; returns the first error message or null. */
export function firstValidationError(...errors: (string | null | undefined)[]): string | null {
  for (const err of errors) {
    if (err) return err
  }
  return null
}
