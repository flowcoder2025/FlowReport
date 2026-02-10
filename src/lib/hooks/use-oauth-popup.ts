'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type OAuthProvider = 'youtube' | 'meta_instagram' | 'meta_facebook'

interface OAuthResult {
  type: 'oauth_callback'
  success: boolean
  connectionId?: string
  channelName?: string
  error?: string
}

interface UseOAuthPopupOptions {
  provider: OAuthProvider
  workspaceId: string
  onSuccess: (connectionId: string, channelName?: string) => void
  onError: (error: string) => void
}

interface UseOAuthPopupReturn {
  startOAuth: () => void
  isLoading: boolean
}

const POPUP_WIDTH = 500
const POPUP_HEIGHT = 600
const POPUP_TIMEOUT = 300000 // 5 minutes

export function useOAuthPopup({
  provider,
  workspaceId,
  onSuccess,
  onError,
}: UseOAuthPopupOptions): UseOAuthPopupReturn {
  const [isLoading, setIsLoading] = useState(false)
  const popupRef = useRef<Window | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close()
      }
    }
  }, [])

  // Handle message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin
      if (event.origin !== window.location.origin) {
        return
      }

      const data = event.data as OAuthResult
      if (data?.type !== 'oauth_callback') {
        return
      }

      setIsLoading(false)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      if (data.success && data.connectionId) {
        onSuccess(data.connectionId, data.channelName)
      } else {
        onError(data.error || 'OAuth failed')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onSuccess, onError])

  const startOAuth = useCallback(() => {
    // Close any existing popup
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }

    setIsLoading(true)

    // Calculate popup position (centered)
    const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2
    const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2

    // Open popup
    const authUrl = `/api/auth/oauth/${provider}/authorize?workspaceId=${encodeURIComponent(workspaceId)}`
    const popup = window.open(
      authUrl,
      `oauth_${provider}`,
      `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},scrollbars=yes,resizable=yes`
    )

    if (!popup) {
      setIsLoading(false)
      onError('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
      return
    }

    popupRef.current = popup

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close()
      }
      setIsLoading(false)
      onError('인증 시간이 초과되었습니다. 다시 시도해주세요.')
    }, POPUP_TIMEOUT)

    // Check if popup was closed manually
    const checkClosed = setInterval(() => {
      if (popupRef.current?.closed) {
        clearInterval(checkClosed)
        // Only set loading to false if we haven't received a message
        // (message handler will set it to false if auth completed)
        setTimeout(() => {
          if (isLoading) {
            setIsLoading(false)
          }
        }, 500)
      }
    }, 500)
  }, [provider, workspaceId, onError, isLoading])

  return {
    startOAuth,
    isLoading,
  }
}
