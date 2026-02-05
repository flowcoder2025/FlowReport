import { ChannelProvider } from '@prisma/client'
import { BaseConnector, ConnectorConfig } from './base'
import { GA4Connector } from './ga4'
import { MetaConnector } from './meta'
import { YouTubeConnector } from './youtube'

export * from './base'
export * from './ga4'
export * from './meta'
export * from './youtube'

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
  return ['NAVER_BLOG', 'NAVER_KEYWORDS', 'SMARTSTORE', 'COUPANG', 'GOOGLE_SEARCH_CONSOLE']
}

/**
 * Check if a provider supports API integration
 */
export function isApiSupported(provider: ChannelProvider): boolean {
  return getSupportedConnectors().includes(provider)
}
