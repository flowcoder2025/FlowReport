import { ChannelProvider } from '@prisma/client'
import { BaseConnector, ConnectorConfig } from './base'
import { GA4Connector } from './ga4'
import { MetaConnector } from './meta'
import { YouTubeConnector } from './youtube'
import { SmartStoreConnector } from './smartstore'
import { CoupangConnector } from './coupang'

export * from './base'
export * from './ga4'
export * from './meta'
export * from './youtube'
export * from './store-base'
export * from './smartstore'
export * from './coupang'

/**
 * Factory function to create a connector for a given provider
 */
export function createConnector(
  provider: ChannelProvider,
  config: ConnectorConfig
): BaseConnector | null {
  switch (provider) {
    case 'GA4':
      return new GA4Connector(config)
    case 'META_INSTAGRAM':
    case 'META_FACEBOOK':
      return new MetaConnector(provider, config)
    case 'YOUTUBE':
      return new YouTubeConnector(config)
    case 'SMARTSTORE':
      return new SmartStoreConnector(config)
    case 'COUPANG':
      return new CoupangConnector(config)
    default:
      return null
  }
}

/**
 * Get supported connectors (those with API integration)
 */
export function getSupportedConnectors(): ChannelProvider[] {
  return ['GA4', 'META_INSTAGRAM', 'META_FACEBOOK', 'YOUTUBE']
}

/**
 * Get connectors that require CSV upload only
 */
export function getCsvOnlyConnectors(): ChannelProvider[] {
  return ['SMARTSTORE', 'COUPANG', 'NAVER_BLOG', 'NAVER_KEYWORDS', 'GOOGLE_SEARCH_CONSOLE']
}

/**
 * Get all available connectors
 */
export function getAllConnectors(): ChannelProvider[] {
  return [...getSupportedConnectors(), ...getCsvOnlyConnectors()]
}

/**
 * Check if a provider supports API integration
 */
export function isApiSupported(provider: ChannelProvider): boolean {
  return getSupportedConnectors().includes(provider)
}

/**
 * Check if a provider is CSV-only
 */
export function isCsvOnly(provider: ChannelProvider): boolean {
  return getCsvOnlyConnectors().includes(provider)
}

/**
 * Get display name for a provider
 */
export function getProviderDisplayName(provider: ChannelProvider): string {
  const displayNames: Record<ChannelProvider, string> = {
    GA4: 'Google Analytics 4',
    META_INSTAGRAM: 'Instagram',
    META_FACEBOOK: 'Facebook',
    YOUTUBE: 'YouTube',
    SMARTSTORE: '스마트스토어',
    COUPANG: '쿠팡',
    NAVER_BLOG: '네이버 블로그',
    NAVER_KEYWORDS: '네이버 키워드',
    GOOGLE_SEARCH_CONSOLE: 'Google Search Console',
  }
  return displayNames[provider] || provider
}
