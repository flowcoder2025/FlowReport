/**
 * OAuth State Management (CSRF Protection)
 * Uses JWT for secure state encoding
 */
import { SignJWT, jwtVerify, JWTPayload } from 'jose'
import { OAuthState, OAuthProvider } from '../types'

const STATE_EXPIRY_SECONDS = 600 // 10 minutes

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('Missing NEXTAUTH_SECRET')
  }
  return new TextEncoder().encode(secret)
}

/**
 * Create encrypted OAuth state
 */
export async function createOAuthState(
  workspaceId: string,
  provider: OAuthProvider,
  userId: string
): Promise<string> {
  const nonce = crypto.randomUUID()
  const createdAt = Date.now()

  const payload: OAuthState = {
    workspaceId,
    provider,
    userId,
    nonce,
    createdAt,
  }

  const jwt = await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${STATE_EXPIRY_SECONDS}s`)
    .setIssuedAt()
    .sign(getSecret())

  return jwt
}

/**
 * Verify and decode OAuth state
 */
export async function verifyOAuthState(
  state: string
): Promise<{ valid: true; payload: OAuthState } | { valid: false; error: string }> {
  try {
    const { payload } = await jwtVerify(state, getSecret())

    // Validate required fields
    const oauthState = payload as unknown as OAuthState

    if (!oauthState.workspaceId || !oauthState.provider || !oauthState.userId || !oauthState.nonce) {
      return { valid: false, error: 'Invalid state payload' }
    }

    // Check expiry (additional check beyond JWT expiry)
    const elapsed = Date.now() - oauthState.createdAt
    if (elapsed > STATE_EXPIRY_SECONDS * 1000) {
      return { valid: false, error: 'State expired' }
    }

    return { valid: true, payload: oauthState }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return { valid: false, error: 'State expired' }
      }
      if (error.message.includes('signature')) {
        return { valid: false, error: 'Invalid state signature' }
      }
    }
    return { valid: false, error: 'Invalid state' }
  }
}
