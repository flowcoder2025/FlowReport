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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/lib/hooks/use-toast'
import {
  Loader2,
  BarChart3,
  Youtube,
  Instagram,
  Facebook,
  LineChart,
  ShoppingBag,
  Upload,
  FileJson,
} from 'lucide-react'

interface AddChannelModalProps {
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ChannelConfig {
  provider: ChannelProvider
  displayName: string
  icon: React.ReactNode
  credentialType: CredentialType
  isApiSupported: boolean
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
    provider: 'META_INSTAGRAM',
    displayName: 'Instagram',
    icon: <Instagram className="h-5 w-5 text-pink-500" />,
    credentialType: 'OAUTH_TOKEN',
    isApiSupported: true,
    fields: [
      { key: 'accountId', label: 'Instagram 계정 ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },
  {
    provider: 'META_FACEBOOK',
    displayName: 'Facebook',
    icon: <Facebook className="h-5 w-5 text-blue-600" />,
    credentialType: 'OAUTH_TOKEN',
    isApiSupported: true,
    fields: [
      { key: 'pageId', label: 'Facebook 페이지 ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },
  {
    provider: 'YOUTUBE',
    displayName: 'YouTube',
    icon: <Youtube className="h-5 w-5 text-red-500" />,
    credentialType: 'OAUTH_TOKEN',
    isApiSupported: true,
    fields: [
      { key: 'channelId', label: '채널 ID', type: 'text', placeholder: 'UC...', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    provider: 'SMARTSTORE',
    displayName: '스마트스토어',
    icon: <ShoppingBag className="h-5 w-5 text-green-500" />,
    credentialType: 'CSV_ONLY',
    isApiSupported: false,
    fields: [
      { key: 'storeId', label: '스토어 ID', type: 'text', required: true },
      { key: 'storeName', label: '스토어명', type: 'text', required: true },
    ],
  },
  {
    provider: 'COUPANG',
    displayName: '쿠팡',
    icon: <ShoppingBag className="h-5 w-5 text-blue-500" />,
    credentialType: 'CSV_ONLY',
    isApiSupported: false,
    fields: [
      { key: 'vendorId', label: '판매자 ID', type: 'text', required: true },
      { key: 'vendorName', label: '판매자명', type: 'text', required: true },
    ],
  },
  {
    provider: 'NAVER_BLOG',
    displayName: '네이버 블로그',
    icon: <LineChart className="h-5 w-5 text-green-600" />,
    credentialType: 'CSV_ONLY',
    isApiSupported: false,
    fields: [
      { key: 'blogId', label: '블로그 ID', type: 'text', required: true },
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
          credentials = {
            propertyId: formData.propertyId,
            serviceAccount: JSON.parse(formData.serviceAccountJson),
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
          accountName: formData.storeName || formData.vendorName || null,
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
                      {config.isApiSupported ? 'API 연동' : 'CSV 업로드'}
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
                {selectedChannel?.isApiSupported
                  ? '인증 정보를 입력하세요.'
                  : 'CSV 업로드를 위한 기본 정보를 입력하세요.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {!selectedChannel?.isApiSupported && (
                <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                  <Upload className="h-4 w-4 inline-block mr-2" />
                  이 채널은 CSV 파일 업로드로 데이터를 가져옵니다.
                </div>
              )}

              {selectedChannel?.fields.map((field) => (
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
                disabled={isSubmitting}
              >
                뒤로
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                연결
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
