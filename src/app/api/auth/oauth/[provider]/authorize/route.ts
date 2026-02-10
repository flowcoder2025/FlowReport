/**
 * OAuth Authorization Route
 * GET /api/auth/oauth/[provider]/authorize?workspaceId=xxx
 *
 * Initiates OAuth flow by redirecting to provider's authorization URL
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requireWorkspaceAdmin } from '@/lib/permissions/workspace-middleware'
import {
  createOAuthState,
  getProviderConfig,
  getRedirectUri,
  isValidProvider,
  OAuthProvider,
} from '@/lib/oauth'

interface RouteParams {
  params: Promise<{ provider: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { provider: providerParam } = await params
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    // Validate provider
    if (!isValidProvider(providerParam)) {
      return NextResponse.json(
        { error: `Invalid OAuth provider: ${providerParam}` },
        { status: 400 }
      )
    }
    const provider = providerParam as OAuthProvider

    // Validate workspaceId
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
        { status: 400 }
      )
    }

    // Authenticate user
    const user = await requireAuth()

    // Check workspace admin permission
    await requireWorkspaceAdmin(workspaceId)

    // Create state token (CSRF protection)
    const state = await createOAuthState(workspaceId, provider, user.id)

    // Get provider config
    const config = getProviderConfig(provider)
    const redirectUri = getRedirectUri(provider)

    // Build authorization URL
    const authUrl = new URL(config.authorizationUrl)
    authUrl.searchParams.set('client_id', config.clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', config.scopes.join(' '))
    authUrl.searchParams.set('state', state)

    // Provider-specific parameters
    if (provider === 'youtube') {
      authUrl.searchParams.set('access_type', 'offline') // Get refresh token
      authUrl.searchParams.set('prompt', 'consent') // Always show consent screen
    }

    // Redirect to provider's authorization URL
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('OAuth authorize error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        // Redirect to login
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', request.url)
        return NextResponse.redirect(loginUrl.toString())
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: 'Workspace admin permission required' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}
