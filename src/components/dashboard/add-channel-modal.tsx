'use client'

import { useState } from 'react'
import { ChannelProvider, CredentialType } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/lib/hooks/use-toast'
import { useOAuthPopup } from '@/lib/hooks/use-oauth-popup'
import {
  Loader2,
  BarChart3,
  Youtube,
  Instagram,
  Facebook,
  LineChart,
  ShoppingBag,
  Upload,
} from 'lucide-react'

interface AddChannelModalProps {
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type OAuthProviderType = 'youtube' | 'meta_instagram' | 'meta_facebook'

interface ChannelConfig {
  provider: ChannelProvider
  displayName: string
  icon: React.ReactNode
  credentialType: CredentialType
  isApiSupported: boolean
  isOAuth?: boolean
  oAuthProvider?: OAuthProviderType
  oAuthButtonLabel?: string
  fields: {
    key: string
    label: string
    type: 'text' | 'password' | 'file' | 'textarea'
    placeholder?: string
    required?: boolean
  }[]
}

const CHANNEL_CONFIGS: ChannelConfig[] = [
  {
    provider: 'GA4',
    displayName: 'Google Analytics 4',
    icon: <BarChart3 className="h-5 w-5 text-orange-500" />,
    credentialType: 'SERVICE_ACCOUNT_JSON',
    isApiSupported: true,
    fields: [
      { key: 'propertyId', label: 'Property ID', type: 'text', placeholder: '123456789', required: true },
      { key: 'serviceAccountJson', label: '서비스 계정 JSON', type: 'textarea', placeholder: 'JSON 내용을 붙여넣기...', required: true },
    ],
  },
  {
    provider: 'YOUTUBE',
    displayName: 'YouTube',
    icon: <Youtube className="h-5 w-5 text-red-500" />,
    credentialType: 'OAUTH_TOKEN',
    isApiSupported: true,
    isOAuth: true,
    oAuthProvider: 'youtube',
    oAuthButtonLabel: 'Google 계정으로 연결',
    fields: [], // OAuth doesn't need manual fields
  },
  {
    provider: 'META_INSTAGRAM',
    displayName: 'Instagram',
    icon: <Instagram className="h-5 w-5 text-pink-500" />,
    credentialType: 'OAUTH_TOKEN',
    isApiSupported: true,
    isOAuth: true,
    oAuthProvider: 'meta_instagram',
    oAuthButtonLabel: 'Facebook 계정으로 연결',
    fields: [], // OAuth doesn't need manual fields
  },
  {
    provider: 'META_FACEBOOK',
    displayName: 'Facebook',
    icon: <Facebook className="h-5 w-5 text-blue-600" />,
    credentialType: 'OAUTH_TOKEN',
    isApiSupported: true,
    isOAuth: true,
    oAuthProvider: 'meta_facebook',
    oAuthButtonLabel: 'Facebook 계정으로 연결',
    fields: [], // OAuth doesn't need manual fields
  },
  {
    provider: 'SMARTSTORE',
    displayName: '스마트스토어',
    icon: <ShoppingBag className="h-5 w-5 text-green-500" />,
    credentialType: 'CSV_ONLY',
    isApiSupported: false,
    fields: [
      { key: 'storeId', label: '스토어 ID', type: 'text', placeholder: '스마트스토어 판매자 ID', required: true },
      { key: 'storeName', label: '스토어명', type: 'text', placeholder: '내 스토어 이름', required: true },
    ],
  },
  {
    provider: 'COUPANG',
    displayName: '쿠팡',
    icon: <ShoppingBag className="h-5 w-5 text-blue-500" />,
    credentialType: 'CSV_ONLY',
    isApiSupported: false,
    fields: [
      { key: 'vendorId', label: '판매자 ID', type: 'text', placeholder: '쿠팡 판매자 ID', required: true },
      { key: 'vendorName', label: '판매자명', type: 'text', placeholder: '판매자 이름', required: true },
    ],
  },
  {
    provider: 'NAVER_BLOG',
    displayName: '네이버 블로그',
    icon: <LineChart className="h-5 w-5 text-green-600" />,
    credentialType: 'CSV_ONLY',
    isApiSupported: false,
    fields: [
      {
        key: 'blogId',
        label: '블로그 ID',
        type: 'text',
        placeholder: 'myblogid (blog.naver.com/myblogid에서 확인)',
        required: true,
      },
      {
        key: 'blogName',
        label: '블로그 이름',
        type: 'text',
        placeholder: '내 블로그 이름 (선택)',
        required: false,
      },
    ],
  },
]

export function AddChannelModal({
  workspaceId,
  open,
  onOpenChange,
  onSuccess,
}: AddChannelModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<'select' | 'configure'>('select')
  const [selectedChannel, setSelectedChannel] = useState<ChannelConfig | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // OAuth popup hook (only used when OAuth channel is selected)
  const oAuthPopup = useOAuthPopup({
    provider: selectedChannel?.oAuthProvider || 'youtube',
    workspaceId,
    onSuccess: (connectionId, channelName) => {
      toast({
        title: '연결 완료',
        description: `${channelName || selectedChannel?.displayName}가 연결되었습니다.`,
      })
      resetModal()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast({
        title: '연결 실패',
        description: error,
        variant: 'destructive',
      })
    },
  })

  const resetModal = () => {
    setStep('select')
    setSelectedChannel(null)
    setFormData({})
  }

  const handleChannelSelect = (config: ChannelConfig) => {
    setSelectedChannel(config)
    setFormData({})
    setStep('configure')
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleOAuthConnect = () => {
    if (!selectedChannel?.isOAuth || !selectedChannel.oAuthProvider) return
    oAuthPopup.startOAuth()
  }

  const handleSubmit = async () => {
    if (!selectedChannel) return

    // Validate required fields
    for (const field of selectedChannel.fields) {
      if (field.required && !formData[field.key]?.trim()) {
        toast({
          title: '오류',
          description: `${field.label}을(를) 입력하세요.`,
          variant: 'destructive',
        })
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Prepare credentials
      let credentials: Record<string, unknown> = {}

      if (selectedChannel.provider === 'GA4' && formData.serviceAccountJson) {
        try {
          // JSON 유효성 검증만 수행 (GA4Connector는 serviceAccountJson을 문자열로 기대)
          JSON.parse(formData.serviceAccountJson)
          credentials = {
            propertyId: formData.propertyId,
            serviceAccountJson: formData.serviceAccountJson,
          }
        } catch {
          toast({
            title: '오류',
            description: 'JSON 형식이 올바르지 않습니다.',
            variant: 'destructive',
          })
          setIsSubmitting(false)
          return
        }
      } else {
        credentials = { ...formData }
      }

      // Determine accountId
      const accountIdField = selectedChannel.fields.find(
        (f) => f.key.includes('Id') || f.key.includes('accountId')
      )
      const accountId = accountIdField ? formData[accountIdField.key] : formData[selectedChannel.fields[0].key]

      const response = await fetch(`/api/workspaces/${workspaceId}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedChannel.provider,
          accountId,
          accountName: formData.storeName || formData.vendorName || formData.blogName || formData.blogId || null,
          credentials,
          credentialType: selectedChannel.credentialType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '연결 생성 실패')
      }

      toast({
        title: '연결 완료',
        description: `${selectedChannel.displayName}가 연결되었습니다.`,
      })

      resetModal()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '연결 생성에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isOAuthLoading = selectedChannel?.isOAuth && oAuthPopup.isLoading

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetModal()
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        {step === 'select' ? (
          <>
            <DialogHeader>
              <DialogTitle>채널 연결</DialogTitle>
              <DialogDescription>
                연결할 채널을 선택하세요.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 py-4">
              {CHANNEL_CONFIGS.map((config) => (
                <button
                  key={config.provider}
                  onClick={() => handleChannelSelect(config)}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                >
                  {config.icon}
                  <div>
                    <div className="font-medium">{config.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      {config.isOAuth ? 'OAuth 연동' : config.isApiSupported ? 'API 연동' : 'CSV 업로드'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedChannel?.icon}
                {selectedChannel?.displayName} 연결
              </DialogTitle>
              <DialogDescription>
                {selectedChannel?.isOAuth
                  ? `${selectedChannel.oAuthButtonLabel?.split(' ')[0] || 'Google'} 계정으로 로그인하여 연결합니다.`
                  : selectedChannel?.isApiSupported
                  ? '인증 정보를 입력하세요.'
                  : 'CSV 업로드를 위한 기본 정보를 입력하세요.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* OAuth 채널 */}
              {selectedChannel?.isOAuth && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    <p className="mb-2">
                      버튼을 클릭하면 팝업 창에서 {selectedChannel.oAuthButtonLabel?.split(' ')[0] || 'Google'} 로그인 후
                      {selectedChannel.displayName} 채널이 자동으로 연결됩니다.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>팝업 차단이 해제되어 있어야 합니다</li>
                      <li>연결 후 분석 데이터를 동기화할 수 있습니다</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleOAuthConnect}
                    disabled={isOAuthLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isOAuthLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {selectedChannel.icon}
                    <span className="ml-2">{selectedChannel.oAuthButtonLabel || 'OAuth로 연결'}</span>
                  </Button>
                </div>
              )}

              {/* CSV 전용 채널 */}
              {!selectedChannel?.isApiSupported && !selectedChannel?.isOAuth && (
                <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800 space-y-2">
                  <div>
                    <Upload className="h-4 w-4 inline-block mr-2" />
                    이 채널은 CSV 파일 업로드로 데이터를 가져옵니다.
                  </div>
                  {selectedChannel?.provider === 'NAVER_BLOG' && (
                    <div className="text-xs text-yellow-700">
                      <strong>블로그 ID 확인 방법:</strong> 내 블로그 주소가 blog.naver.com/<strong>myblogid</strong> 라면 &quot;myblogid&quot;가 블로그 ID입니다.
                    </div>
                  )}
                </div>
              )}

              {/* 일반 필드 입력 (OAuth 아닌 경우) */}
              {!selectedChannel?.isOAuth && selectedChannel?.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.key}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={6}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                    />
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                disabled={isSubmitting || isOAuthLoading}
              >
                뒤로
              </Button>
              {/* OAuth가 아닌 경우에만 연결 버튼 표시 */}
              {!selectedChannel?.isOAuth && (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  연결
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
