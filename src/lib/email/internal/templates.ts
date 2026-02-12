/**
 * Email Templates
 */

interface ReportEmailTemplateProps {
  workspaceName: string
  periodType: 'WEEKLY' | 'MONTHLY'
  periodLabel: string
  recipientName?: string
  previewUrl?: string
}

const PERIOD_LABELS = {
  WEEKLY: '주간',
  MONTHLY: '월간',
} as const

export function getReportEmailSubject(
  workspaceName: string,
  periodType: 'WEEKLY' | 'MONTHLY',
  periodLabel: string
): string {
  return `[FlowReport] ${workspaceName} - ${periodLabel} ${PERIOD_LABELS[periodType]} 리포트`
}

export function getReportEmailHtml(props: ReportEmailTemplateProps): string {
  const { workspaceName, periodType, periodLabel, recipientName, previewUrl } = props
  const periodTypeLabel = PERIOD_LABELS[periodType]
  const greeting = recipientName ? `${recipientName}님,` : '안녕하세요,'

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${workspaceName} ${periodTypeLabel} 리포트</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background-color: #3b82f6; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                FlowReport
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>

              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>${workspaceName}</strong>의 <strong>${periodLabel} ${periodTypeLabel} 리포트</strong>가 준비되었습니다.
              </p>

              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                첨부된 PDF 파일에서 상세한 분석 결과를 확인하실 수 있습니다.
              </p>

              ${previewUrl ? `
              <div style="text-align: center; margin: 32px 0;">
                <a href="${previewUrl}"
                   style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                  웹에서 보기
                </a>
              </div>
              ` : ''}

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  이 메일은 자동 발송되었습니다.<br>
                  리포트 설정은 FlowReport 대시보드에서 변경하실 수 있습니다.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                &copy; ${new Date().getFullYear()} FlowReport. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function getReportEmailText(props: ReportEmailTemplateProps): string {
  const { workspaceName, periodType, periodLabel, recipientName } = props
  const periodTypeLabel = PERIOD_LABELS[periodType]
  const greeting = recipientName ? `${recipientName}님,` : '안녕하세요,'

  return `
${greeting}

${workspaceName}의 ${periodLabel} ${periodTypeLabel} 리포트가 준비되었습니다.

첨부된 PDF 파일에서 상세한 분석 결과를 확인하실 수 있습니다.

---
이 메일은 FlowReport에서 자동 발송되었습니다.
리포트 설정은 FlowReport 대시보드에서 변경하실 수 있습니다.
  `.trim()
}
