/**
 * Email Module - Public API
 *
 * 이메일 발송 모듈 (Resend 기반)
 */

// Types
export type {
  EmailRecipient,
  EmailSendResult,
  BatchEmailResult,
  ReportEmailOptions,
} from './types'

// Sending
export { sendReportEmail, sendSingleEmail, validateEmailConfig } from './internal/sender'

// Templates (for customization)
export { getReportEmailSubject, getReportEmailHtml, getReportEmailText } from './internal/templates'
