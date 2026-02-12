/**
 * OAuth Provider Configuration
 */
import { OAuthProvider, OAuthProviderConfig } from '../types'

const PROVIDER_CONFIGS: Record<OAuthProvider, Omit<OAuthProviderConfig, 'clientId' | 'clientSecret'>> = {
  youtube: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
    ],
  },
  meta_instagram: {
    authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: [
      'instagram_basic',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
      'business_management',
    ],
  },
  meta_facebook: {
    authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: [
      'pages_show_list',
      'pages_read_engagement',
      'business_management',
    ],
  },
}

function getGoogleCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET')
  }

  return { clientId, clientSecret }
}

function getMetaCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.META_APP_ID
  const clientSecret = process.env.META_APP_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing META_APP_ID or META_APP_SECRET')
  }

  return { clientId, clientSecret }
}

export function getProviderConfig(provider: OAuthProvider): OAuthProviderConfig {
  const baseConfig = PROVIDER_CONFIGS[provider]

  if (!baseConfig) {
    throw new Error(`Unknown OAuth provider: ${provider}`)
  }

  const credentials = provider === 'youtube'
    ? getGoogleCredentials()
    : getMetaCredentials()

  return {
    ...baseConfig,
    ...credentials,
  }
}

export function getRedirectUri(provider: OAuthProvider): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${baseUrl}/api/auth/oauth/${provider}/callback`
}

export function isValidProvider(provider: string): provider is OAuthProvider {
  return ['youtube', 'meta_instagram', 'meta_facebook'].includes(provider)
}
