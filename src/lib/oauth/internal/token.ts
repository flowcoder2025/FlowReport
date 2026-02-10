/**
 * OAuth Token Exchange
 */
import { OAuthProvider, OAuthTokenResponse, OAuthChannelInfo } from '../types'
import { getProviderConfig, getRedirectUri } from './config'

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  provider: OAuthProvider,
  code: string
): Promise<OAuthTokenResponse> {
  const config = getProviderConfig(provider)
  const redirectUri = getRedirectUri(provider)

  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error_description || error.error || 'Token exchange failed')
  }

  return response.json()
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  provider: OAuthProvider,
  refreshToken: string
): Promise<OAuthTokenResponse> {
  const config = getProviderConfig(provider)

  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error_description || error.error || 'Token refresh failed')
  }

  return response.json()
}

/**
 * Fetch YouTube channel info using access token
 */
export async function fetchYouTubeChannelInfo(
  accessToken: string
): Promise<OAuthChannelInfo> {
  const response = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to fetch YouTube channel info')
  }

  const data = await response.json()
  const channel = data.items?.[0]

  if (!channel) {
    throw new Error('No YouTube channel found for this account')
  }

  return {
    channelId: channel.id,
    channelName: channel.snippet?.title || 'YouTube Channel',
    channelThumbnail: channel.snippet?.thumbnails?.default?.url,
  }
}

/**
 * Fetch Meta (Instagram/Facebook) account info
 * Note: Meta OAuth requires additional setup - placeholder for future
 */
export async function fetchMetaAccountInfo(
  accessToken: string,
  provider: 'meta_instagram' | 'meta_facebook'
): Promise<OAuthChannelInfo> {
  // For Instagram: need to get Instagram Business Account ID through Facebook Page
  // For Facebook: need to get Page info

  // This is a simplified placeholder - real implementation needs:
  // 1. Get user's pages: /me/accounts
  // 2. For Instagram: Get Instagram Business Account linked to page
  // 3. Exchange short-lived token for long-lived token

  const response = await fetch(
    `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to fetch Meta account info')
  }

  const data = await response.json()

  return {
    channelId: data.id,
    channelName: data.name || (provider === 'meta_instagram' ? 'Instagram Account' : 'Facebook Page'),
  }
}
