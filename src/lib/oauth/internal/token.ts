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
 * Exchange short-lived token for long-lived token (60 days)
 */
async function exchangeForLongLivedToken(
  shortLivedToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in?: number }> {
  const url = `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `grant_type=fb_exchange_token&` +
    `client_id=${clientId}&` +
    `client_secret=${clientSecret}&` +
    `fb_exchange_token=${shortLivedToken}`

  const response = await fetch(url)
  if (!response.ok) {
    console.warn('Failed to exchange for long-lived token, using short-lived token')
    return { access_token: shortLivedToken }
  }
  return response.json()
}

/**
 * Fetch Meta (Instagram/Facebook) account info
 * 1. Get user's pages via /me/accounts
 * 2. For Instagram: Get Instagram Business Account linked to page
 * 3. For Facebook: Return page info
 */
export async function fetchMetaAccountInfo(
  accessToken: string,
  provider: 'meta_instagram' | 'meta_facebook'
): Promise<OAuthChannelInfo> {
  // Step 1: Exchange for long-lived token
  const metaClientId = process.env.META_APP_ID
  const metaClientSecret = process.env.META_APP_SECRET
  let longLivedToken = accessToken

  if (metaClientId && metaClientSecret) {
    const tokenResult = await exchangeForLongLivedToken(accessToken, metaClientId, metaClientSecret)
    longLivedToken = tokenResult.access_token
  }

  // Step 2: Get user's pages
  const pagesResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${longLivedToken}`
  )

  if (!pagesResponse.ok) {
    const error = await pagesResponse.json()
    throw new Error(error.error?.message || 'Facebook 페이지를 가져올 수 없습니다. 페이지 관리 권한을 확인하세요.')
  }

  const pagesData = await pagesResponse.json()
  const pages = pagesData.data || []

  if (pages.length === 0) {
    throw new Error('연결된 Facebook 페이지가 없습니다. 비즈니스 페이지를 먼저 생성해주세요.')
  }

  // Use first page (most common case - single business page)
  const page = pages[0]

  if (provider === 'meta_instagram') {
    // Step 3a: Get Instagram Business Account from page
    const igAccount = page.instagram_business_account

    if (!igAccount) {
      throw new Error(
        'Instagram 비즈니스 계정이 연결되지 않았습니다. ' +
        'Facebook 페이지에 Instagram 프로페셔널 계정을 연결해주세요.'
      )
    }

    return {
      channelId: igAccount.id,
      channelName: igAccount.username || igAccount.name || 'Instagram Account',
      channelThumbnail: igAccount.profile_picture_url,
      // Extra data for credential storage
      extra: {
        longLivedToken,
        instagramBusinessAccountId: igAccount.id,
        pageId: page.id,
        pageAccessToken: page.access_token,
      },
    }
  } else {
    // Step 3b: Facebook Page
    return {
      channelId: page.id,
      channelName: page.name || 'Facebook Page',
      extra: {
        longLivedToken,
        pageId: page.id,
        pageAccessToken: page.access_token,
      },
    }
  }
}
