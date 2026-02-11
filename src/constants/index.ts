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
  isChannelInGroup,
  isApiSupported,
  isCsvOnly,
  type ChannelGroup,
  type SnsChannel,
  type StoreChannel,
  type TrafficChannel,
} from './channels'
export {
  VALID_CSV_CHANNELS,
  CSV_TEMPLATES,
  isValidCsvChannel,
  getCsvTemplateContent,
  type CsvTemplate,
} from './csv-templates'
