'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, Edit2, Check } from 'lucide-react'

interface InsightCardProps {
  title: string
  items: string[]
  onSave?: (items: string[]) => void
  maxItems?: number
  editable?: boolean
  icon?: React.ReactNode
}

export function InsightCard({
  title,
  items: initialItems,
  onSave,
  maxItems = 5,
  editable = false,
  icon,
}: InsightCardProps) {
  const [items, setItems] = useState(initialItems)
  const [isEditing, setIsEditing] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newItem, setNewItem] = useState('')

  const handleAddItem = () => {
    if (newItem.trim() && items.length < maxItems) {
      const updated = [...items, newItem.trim()]
      setItems(updated)
      setNewItem('')
      onSave?.(updated)
    }
  }

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
    onSave?.(updated)
  }

  const handleStartEdit = (index: number) => {
    setEditIndex(index)
    setEditValue(items[index])
  }

  const handleSaveEdit = () => {
    if (editIndex !== null && editValue.trim()) {
      const updated = items.map((item, i) => (i === editIndex ? editValue.trim() : item))
      setItems(updated)
      onSave?.(updated)
    }
    setEditIndex(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditIndex(null)
    setEditValue('')
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base font-medium">
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
          {editable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? '완료' : '편집'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">항목이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground text-sm">
                  {index + 1}.
                </span>
                {editIndex === index ? (
                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{item}</span>
                    {isEditing && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          aria-label="편집"
                          onClick={() => handleStartEdit(index)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          aria-label="삭제"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {isEditing && items.length < maxItems && (
          <div className="mt-3 flex items-center gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="새 항목 추가..."
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleAddItem}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
