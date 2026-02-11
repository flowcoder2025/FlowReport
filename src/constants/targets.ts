/**
 * Target Constants - Re-export from lib/types
 *
 * 기존 코드 호환을 위한 re-export
 * 새 코드에서는 @/lib/types/targets 직접 import 권장
 */

export {
  DEFAULT_TARGETS,
  DEFAULT_TARGET_CONFIG,
  targetConfigSchema,
  type TargetConfig,
  type LegacyTargetConfig,
} from '@/lib/types/targets'
