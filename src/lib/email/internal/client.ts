/**
 * Resend Email Client
 */
import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResendClient(): Resend {
  if (resendClient) {
    return resendClient
  }

  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY environment variable')
  }

  resendClient = new Resend(apiKey)
  return resendClient
}

export function getEmailFrom(): string {
  const from = process.env.EMAIL_FROM

  if (!from) {
    throw new Error('Missing EMAIL_FROM environment variable')
  }

  return from
}
