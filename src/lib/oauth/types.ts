/**
 * OAuth Types
 */

export type OAuthProvider = 'youtube' | 'meta_instagram' | 'meta_facebook'

export interface OAuthState {
  workspaceId: string
  provider: OAuthProvider
  userId: string
  nonce: string
  createdAt: number
}

export interface OAuthProviderConfig {
  authorizationUrl: string
  tokenUrl: string
  scopes: string[]
  clientId: string
  clientSecret: string
}

export interface OAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type: string
  scope?: string
}

export interface OAuthChannelInfo {
  channelId: string
  channelName: string
  channelThumbnail?: string
  extra?: Record<string, string>
}

export interface OAuthCallbackResult {
  success: boolean
  connectionId?: string
  channelName?: string
  error?: string
}
