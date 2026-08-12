'use client'

import { useState, useRef, useCallback } from 'react'
import { ImagePlus, Send, X, Sparkles, Camera, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
  isLoading?: boolean
  isDemo?: boolean
}

const QUICK_QUESTIONS = [
  '🌸 Hoa phù hợp phòng khách nhỏ?',
  '🏢 Cây cảnh cho văn phòng ít nắng?',
  '🎁 Gợi ý hoa tặng sinh nhật mẹ',
  '💚 Cây phong thuỷ đặt bàn làm việc?',
]

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Xin chào! 🌸 Mình là **AI Tư Vấn Hoa** của Làng Hoa Xuân Quan.

Bạn có thể:
📸 **Chụp ảnh phòng** → Mình sẽ gợi ý hoa phù hợp với không gian
💬 **Hỏi về hoa** → Loại hoa nào phù hợp, cách chăm sóc, ý nghĩa...

Bắt đầu nào! 👇`,
    },
  ])
  const [inputText, setInputText]       = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview]   = useState<string | null>(null)
  const [isLoading, setIsLoading]         = useState(false)
  const fileRef  = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  function scrollToBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text ?? inputText
    if (!msg.trim() && !selectedImage) return
    if (isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      imageUrl: imagePreview ?? undefined,
    }
    const loadingMsg: Message = {
      id: Date.now().toString() + '_ai',
      role: 'assistant',
      content: '',
      isLoading: true,
    }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInputText('')
    setIsLoading(true)
    scrollToBottom()

    const imgToSend   = selectedImage
    const previewCopy = imagePreview
    setSelectedImage(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''

    try {
      const fd = new FormData()
      if (imgToSend)  fd.append('image', imgToSend)
      if (msg.trim()) fd.append('message', msg)

      const res  = await fetch('/api/ai-chat', { method: 'POST', body: fd })
      const data = await res.json()

      setMessages(prev => prev.map(m =>
        m.isLoading ? { ...m, content: data.reply ?? data.error ?? 'Lỗi không xác định', isLoading: false, isDemo: data.isDemo } : m
      ))
    } catch {
      setMessages(prev => prev.map(m =>
        m.isLoading ? { ...m, content: '❌ Không thể kết nối AI. Kiểm tra API key trong .env.local', isLoading: false } : m
      ))
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }, [inputText, selectedImage, imagePreview, isLoading])

  return (
    <div className="flex flex-col h-screen bg-surface">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 pt-14 pb-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-textMain">AI Tư Vấn Hoa</h1>
          <p className="text-[10px] text-success font-semibold">● Đang hoạt động</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-2">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            {/* Avatar */}
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}

            <div className={cn('max-w-[80%] space-y-2', msg.role === 'user' ? 'items-end' : 'items-start')}>
              {/* Image preview */}
              {msg.imageUrl && (
                <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                  <img src={msg.imageUrl} alt="Ảnh đã gửi" className="max-w-[220px] max-h-[200px] object-cover" />
                </div>
              )}

              {/* Text bubble */}
              {(msg.content || msg.isLoading) && (
                <div className={cn(
                  'rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-white border border-border text-textMain rounded-tl-sm'
                )}>
                  {msg.isLoading ? (
                    <div className="flex items-center gap-2 text-textMuted">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">AI đang phân tích...</span>
                    </div>
                  ) : (
                    <div
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/^#{1,3}\s(.+)$/gm, '<p class="font-bold mt-2 mb-1">$1</p>')
                          .replace(/^\d+\.\s(.+)$/gm, '<p class="ml-2">• $1</p>')
                          .replace(/^[-•]\s(.+)$/gm, '<p class="ml-2">• $1</p>'),
                      }}
                    />
                  )}
                </div>
              )}
              {/* Demo badge — ẩn để UX mượt hơn */}
              {/* {msg.isDemo && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg mt-1">
                  <Info className="w-3 h-3" />
                  <span>Phản hồi mẫu · Kích hoạt Gemini API để dùng AI thật</span>
                </div>
              )} */}
            </div>
          </div>
        ))}

        {/* Quick question chips — chỉ show khi chưa có cuộc trò chuyện */}
        {messages.length === 1 && (
          <div className="space-y-2 mt-2">
            <p className="text-[11px] text-textMuted font-semibold text-center">Câu hỏi gợi ý:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="bg-white border border-primary/20 text-xs font-semibold text-primary px-3 py-2 rounded-full hover:bg-primary/5 transition shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-border px-4 pt-3 pb-20 flex-shrink-0">
        {/* Image preview bar */}
        {imagePreview && (
          <div className="flex items-center gap-2 mb-3 bg-surface rounded-xl p-2">
            <img src={imagePreview} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="Preview" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-textMain truncate">{selectedImage?.name}</p>
              <p className="text-[10px] text-textMuted">Ảnh sẽ được phân tích bởi AI</p>
            </div>
            <button onClick={removeImage} className="text-textMuted hover:text-danger transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Camera / upload button */}
          <label className="flex-shrink-0">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
            <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center cursor-pointer hover:bg-surface-dark transition active:scale-95">
              <Camera className="w-5 h-5 text-primary" />
            </div>
          </label>

          {/* Gallery button */}
          <label className="flex-shrink-0">
            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center cursor-pointer hover:bg-surface-dark transition active:scale-95">
              <ImagePlus className="w-5 h-5 text-textMuted" />
            </div>
          </label>

          {/* Text input */}
          <div className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 flex items-end gap-2 focus-within:border-primary transition">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Hỏi về hoa hoặc gửi ảnh phòng..."
              rows={1}
              className="flex-1 bg-transparent outline-none text-sm text-textMain placeholder:text-textMuted/60 resize-none leading-normal max-h-20"
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || (!inputText.trim() && !selectedImage)}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition active:scale-95 flex-shrink-0',
              isLoading || (!inputText.trim() && !selectedImage)
                ? 'bg-surface border border-border text-textMuted'
                : 'bg-primary text-white shadow-md hover:bg-primary-600'
            )}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
