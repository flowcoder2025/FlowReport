/**
 * Email Module Types
 */

export interface EmailRecipient {
  email: string
  name?: string
}

export interface ReportEmailOptions {
  recipients: EmailRecipient[]
  subject: string
  workspaceName: string
  periodType: 'WEEKLY' | 'MONTHLY'
  periodLabel: string
  pdfBuffer?: Buffer
  previewUrl?: string
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface BatchEmailResult {
  totalSent: number
  totalFailed: number
  results: EmailSendResult[]
}
