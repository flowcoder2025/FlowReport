/**
 * Report Scheduler
 *
 * 리포트 스케줄 계산 로직
 */
import type { ReportPeriod } from '@prisma/client'
import type { ReportPeriodRange } from '../types'

/**
 * 다음 실행 시간 계산
 */
export function calculateNextRunAt(
  periodType: ReportPeriod,
  scheduleDay: number,
  scheduleHour: number,
  timezone: string,
  fromDate: Date = new Date()
): Date {
  // 현재 시간을 타임존 기준으로 처리
  const now = fromDate

  if (periodType === 'WEEKLY') {
    return calculateNextWeeklyRun(scheduleDay, scheduleHour, now)
  } else {
    return calculateNextMonthlyRun(scheduleDay, scheduleHour, now)
  }
}

/**
 * 주간 리포트 다음 실행 시간
 * scheduleDay: 0(일) - 6(토)
 */
function calculateNextWeeklyRun(
  scheduleDay: number,
  scheduleHour: number,
  now: Date
): Date {
  const result = new Date(now)
  result.setHours(scheduleHour, 0, 0, 0)

  const currentDay = now.getDay()
  let daysUntilTarget = scheduleDay - currentDay

  // 같은 요일인데 시간이 지났으면 다음 주로
  if (daysUntilTarget === 0 && now.getHours() >= scheduleHour) {
    daysUntilTarget = 7
  } else if (daysUntilTarget < 0) {
    daysUntilTarget += 7
  }

  result.setDate(result.getDate() + daysUntilTarget)
  return result
}

/**
 * 월간 리포트 다음 실행 시간
 * scheduleDay: 1-31 (마지막 날짜 자동 조정)
 */
function calculateNextMonthlyRun(
  scheduleDay: number,
  scheduleHour: number,
  now: Date
): Date {
  const year = now.getFullYear()
  const month = now.getMonth()

  // 이번 달의 마지막 날
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  const targetDay = Math.min(scheduleDay, lastDayOfMonth)

  let targetMonth = month
  let targetYear = year

  const targetDateThisMonth = new Date(year, month, targetDay, scheduleHour, 0, 0, 0)

  // 이번 달 발송일이 지났으면 다음 달로
  if (now >= targetDateThisMonth) {
    targetMonth = month + 1
    if (targetMonth > 11) {
      targetMonth = 0
      targetYear++
    }
  }

  // 다음 달의 마지막 날 체크
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
  const finalDay = Math.min(scheduleDay, lastDayOfTargetMonth)

  return new Date(targetYear, targetMonth, finalDay, scheduleHour, 0, 0, 0)
}

/**
 * 리포트 기간 범위 계산
 */
export function calculateReportPeriod(
  periodType: ReportPeriod,
  referenceDate: Date = new Date()
): ReportPeriodRange {
  if (periodType === 'WEEKLY') {
    return calculateWeeklyPeriod(referenceDate)
  } else {
    return calculateMonthlyPeriod(referenceDate)
  }
}

/**
 * 주간 리포트 기간 (지난 주)
 */
function calculateWeeklyPeriod(referenceDate: Date): ReportPeriodRange {
  const dayOfWeek = referenceDate.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  // 이번 주 월요일
  const thisMonday = new Date(referenceDate)
  thisMonday.setDate(referenceDate.getDate() - daysToMonday)
  thisMonday.setHours(0, 0, 0, 0)

  // 지난 주 월요일
  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(thisMonday.getDate() - 7)

  // 지난 주 일요일
  const lastSunday = new Date(lastMonday)
  lastSunday.setDate(lastMonday.getDate() + 6)
  lastSunday.setHours(23, 59, 59, 999)

  const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  const label = `${lastMonday.getFullYear()}년 ${formatDate(lastMonday)} ~ ${formatDate(lastSunday)}`

  return { start: lastMonday, end: lastSunday, label }
}

/**
 * 월간 리포트 기간 (지난 달)
 */
function calculateMonthlyPeriod(referenceDate: Date): ReportPeriodRange {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()

  // 지난 달
  const lastMonth = month === 0 ? 11 : month - 1
  const lastYear = month === 0 ? year - 1 : year

  const start = new Date(lastYear, lastMonth, 1, 0, 0, 0, 0)
  const end = new Date(year, month, 0, 23, 59, 59, 999) // 이번달 0일 = 지난달 마지막날

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const label = `${lastYear}년 ${monthNames[lastMonth]}`

  return { start, end, label }
}

/**
 * 실행이 필요한 스케줄 체크
 */
export function isDueForExecution(nextRunAt: Date | null, now: Date = new Date()): boolean {
  if (!nextRunAt) return false
  return now >= nextRunAt
}
