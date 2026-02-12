/**
 * Constants Module - Public API
 *
 * 모든 상수는 이 파일을 통해 export
 */

export {
  DEFAULT_TARGETS,
  DEFAULT_TARGET_CONFIG,
  targetConfigSchema,
  type TargetConfig,
  type LegacyTargetConfig,
} from './targets'
export { BLOG_GUIDE, type BlogGuideKey } from './blog-guide'
export {
  CHANNEL_GROUPS,
  CHANNEL_LABELS,
  CHANNEL_COLORS,
  CHANNEL_BADGE_COLORS,
  CHANNEL_DOT_COLORS,
  getChannelColor,
  getChannelBadgeColor,
  isChannelInGroup,
  isApiSupported,
  isCsvOnly,
  type ChannelGroup,
  type SnsChannel,
  type StoreChannel,
  type TrafficChannel,
} from './channels'
export {
  METRIC_LABELS,
  METRIC_CATEGORIES,
  CATEGORY_LABELS,
  POSITIVE_METRICS,
  HIGHLIGHT_THRESHOLD,
  getMetricSeverity,
  type MetricCategory,
} from './metrics'
export {
  CHART_PALETTE,
  FUNNEL_PALETTE,
  STATUS_COLORS,
  CONTENT_TYPE_COLORS,
  TRAFFIC_SOURCE_COLORS,
  BLOG_TREND_COLORS,
  METRIC_TREND_COLORS,
} from './colors'
export {
  VALID_CSV_CHANNELS,
  CSV_TEMPLATES,
  isValidCsvChannel,
  getCsvTemplateContent,
  type CsvTemplate,
} from './csv-templates'
export {
  REPORT_CONFIG,
  REPORT_SECTIONS,
  DEFAULT_REPORT_CONFIG,
  WEEKDAY_LABELS,
  MONTHLY_DAY_OPTIONS,
  type ReportSection,
  type WeekdayKey,
  type MonthlyDay,
} from './reports'
