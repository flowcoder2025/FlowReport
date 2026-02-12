/**
 * Email Sender
 */
import { REPORT_CONFIG } from '@/constants'
import type { EmailRecipient, EmailSendResult, BatchEmailResult, ReportEmailOptions } from '../types'
import { getResendClient, getEmailFrom } from './client'
import { getReportEmailSubject, getReportEmailHtml, getReportEmailText } from './templates'

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendReportEmail(options: ReportEmailOptions): Promise<BatchEmailResult> {
  const { recipients, workspaceName, periodType, periodLabel, pdfBuffer, previewUrl } = options
  const resend = getResendClient()
  const from = getEmailFrom()

  const results: EmailSendResult[] = []
  let totalSent = 0
  let totalFailed = 0

  for (const recipient of recipients) {
    let lastError: string | undefined

    // Retry logic
    for (let attempt = 1; attempt <= REPORT_CONFIG.EMAIL_RETRY_COUNT; attempt++) {
      try {
        const subject = getReportEmailSubject(workspaceName, periodType, periodLabel)
        const html = getReportEmailHtml({
          workspaceName,
          periodType,
          periodLabel,
          recipientName: recipient.name,
          previewUrl,
        })
        const text = getReportEmailText({
          workspaceName,
          periodType,
          periodLabel,
          recipientName: recipient.name,
          previewUrl,
        })

        const attachments = pdfBuffer
          ? [
              {
                filename: `${workspaceName}_${periodLabel}_report.pdf`,
                content: pdfBuffer,
              },
            ]
          : undefined

        const response = await resend.emails.send({
          from,
          to: recipient.email,
          subject,
          html,
          text,
          attachments,
        })

        if (response.error) {
          throw new Error(response.error.message)
        }

        results.push({
          success: true,
          messageId: response.data?.id,
        })
        totalSent++
        break // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'

        if (attempt < REPORT_CONFIG.EMAIL_RETRY_COUNT) {
          // Wait before retry (exponential backoff)
          await sleep(1000 * attempt)
        }
      }
    }

    // If all retries failed
    if (lastError && results.length < recipients.indexOf(recipient) + 1) {
      results.push({
        success: false,
        error: lastError,
      })
      totalFailed++
    }
  }

  return {
    totalSent,
    totalFailed,
    results,
  }
}

export async function sendSingleEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<EmailSendResult> {
  const resend = getResendClient()
  const from = getEmailFrom()

  try {
    const response = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    })

    if (response.error) {
      return {
        success: false,
        error: response.error.message,
      }
    }

    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function validateEmailConfig(): Promise<{ valid: boolean; error?: string }> {
  try {
    getResendClient()
    getEmailFrom()
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
