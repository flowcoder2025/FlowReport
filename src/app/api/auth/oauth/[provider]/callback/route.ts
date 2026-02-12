/**
 * OAuth Callback Route
 * GET /api/auth/oauth/[provider]/callback?code=xxx&state=xxx
 *
 * Handles OAuth callback:
 * 1. Verify state (CSRF protection)
 * 2. Exchange code for tokens
 * 3. Fetch channel info
 * 4. Create channel connection
 * 5. Return success HTML that posts message to opener and closes
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { encryptCredentials } from '@/lib/crypto/credentials'
import {
  verifyOAuthState,
  exchangeCodeForTokens,
  fetchYouTubeChannelInfo,
  fetchMetaAccountInfo,
  isValidProvider,
  OAuthProvider,
  OAuthTokenResponse,
  OAuthChannelInfo,
} from '@/lib/oauth'
import { ChannelProvider } from '@prisma/client'

interface RouteParams {
  params: Promise<{ provider: string }>
}

// Map OAuth provider to ChannelProvider
const PROVIDER_MAP: Record<OAuthProvider, ChannelProvider> = {
  youtube: 'YOUTUBE',
  meta_instagram: 'META_INSTAGRAM',
  meta_facebook: 'META_FACEBOOK',
}

/**
 * Build provider-specific credentials for storage
 */
function buildCredentials(
  provider: OAuthProvider,
  tokens: OAuthTokenResponse,
  channelInfo: OAuthChannelInfo
): Record<string, unknown> {
  if (provider === 'youtube') {
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      channelId: channelInfo.channelId,
      expiresAt: tokens.expires_in
        ? Date.now() + tokens.expires_in * 1000
        : undefined,
    }
  }

  // Meta (Instagram/Facebook) - use long-lived token and proper account IDs
  const extra = channelInfo.extra || {}
  return {
    accessToken: extra.longLivedToken || tokens.access_token,
    pageId: extra.pageId,
    pageAccessToken: extra.pageAccessToken,
    ...(provider === 'meta_instagram'
      ? { instagramBusinessAccountId: extra.instagramBusinessAccountId }
      : {}),
  }
}

function renderResultPage(result: {
  success: boolean
  connectionId?: string
  channelName?: string
  error?: string
}): string {
  const resultJson = JSON.stringify(result)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OAuth ${result.success ? 'Success' : 'Error'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .success { color: #22c55e; }
    .error { color: #ef4444; }
    .message { color: #666; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    ${result.success
      ? `<h2 class="success">연결 완료!</h2>
         <p class="message">${result.channelName || '채널'}이 연결되었습니다.</p>
         <p class="message">이 창은 자동으로 닫힙니다...</p>`
      : `<h2 class="error">연결 실패</h2>
         <p class="message">${result.error || '알 수 없는 오류가 발생했습니다.'}</p>
         <p class="message">창을 닫고 다시 시도해주세요.</p>`
    }
  </div>
  <script>
    (function() {
      const result = ${resultJson};
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth_callback', ...result }, window.location.origin);
        setTimeout(function() { window.close(); }, 1500);
      }
    })();
  </script>
</body>
</html>
`
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { provider: providerParam } = await params
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth error from provider
    if (error) {
      return new NextResponse(
        renderResultPage({
          success: false,
          error: errorDescription || error,
        }),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // Validate provider
    if (!isValidProvider(providerParam)) {
      return new NextResponse(
        renderResultPage({
          success: false,
          error: `Invalid OAuth provider: ${providerParam}`,
        }),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }
    const provider = providerParam as OAuthProvider

    // Validate required parameters
    if (!code || !state) {
      return new NextResponse(
        renderResultPage({
          success: false,
          error: 'Missing code or state parameter',
        }),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // Verify state (CSRF protection)
    const stateResult = await verifyOAuthState(state)
    if (!stateResult.valid) {
      return new NextResponse(
        renderResultPage({
          success: false,
          error: stateResult.error,
        }),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    const { workspaceId, userId } = stateResult.payload

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(provider, code)

    // Fetch channel info
    let channelInfo
    if (provider === 'youtube') {
      channelInfo = await fetchYouTubeChannelInfo(tokens.access_token)
    } else {
      channelInfo = await fetchMetaAccountInfo(tokens.access_token, provider)
    }

    const channelProvider = PROVIDER_MAP[provider]

    // Build credentials based on provider
    const credentials = buildCredentials(provider, tokens, channelInfo)

    // Check for existing connection
    const existing = await prisma.channelConnection.findUnique({
      where: {
        workspaceId_provider_accountId: {
          workspaceId,
          provider: channelProvider,
          accountId: channelInfo.channelId,
        },
      },
    })

    if (existing) {
      // Update existing connection with new tokens
      await prisma.channelConnection.update({
        where: { id: existing.id },
        data: {
          encryptedCredentials: encryptCredentials(JSON.stringify(credentials)),
          accountName: channelInfo.channelName,
          status: 'ACTIVE',
          lastError: null,
        },
      })

      return new NextResponse(
        renderResultPage({
          success: true,
          connectionId: existing.id,
          channelName: channelInfo.channelName,
        }),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    const connection = await prisma.channelConnection.create({
      data: {
        workspaceId,
        provider: channelProvider,
        accountId: channelInfo.channelId,
        accountName: channelInfo.channelName,
        encryptedCredentials: encryptCredentials(JSON.stringify(credentials)),
        credentialType: 'OAUTH_TOKEN',
        status: 'ACTIVE',
      },
    })

    // Create audit log
    await prisma.connectionAuditLog.create({
      data: {
        connectionId: connection.id,
        action: 'CREATED',
        performedBy: userId,
        metadata: {
          provider: channelProvider,
          accountId: channelInfo.channelId,
          method: 'oauth',
        },
      },
    })

    return new NextResponse(
      renderResultPage({
        success: true,
        connectionId: connection.id,
        channelName: channelInfo.channelName,
      }),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  } catch (error) {
    console.error('OAuth callback error:', error)

    return new NextResponse(
      renderResultPage({
        success: false,
        error: error instanceof Error ? error.message : 'OAuth callback failed',
      }),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}
