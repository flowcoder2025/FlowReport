/**
 * OAuth Module - Public API
 */

// Types
export type {
  OAuthProvider,
  OAuthState,
  OAuthProviderConfig,
  OAuthTokenResponse,
  OAuthChannelInfo,
  OAuthCallbackResult,
} from './types'

// State management
export { createOAuthState, verifyOAuthState } from './internal/state'

// Token operations
export {
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchYouTubeChannelInfo,
  fetchMetaAccountInfo,
} from './internal/token'

// Config
export { getProviderConfig, getRedirectUri, isValidProvider } from './internal/config'
