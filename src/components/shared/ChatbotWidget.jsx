import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, Loader2, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { chatbotService } from '@/services/chatbot.service'

const STORAGE_KEY = 'pharmatrace_chat_history'
const TTL_MS = 24 * 60 * 60 * 1000 // 1 ngày

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Xin chào! Tôi là trợ lý dược phẩm PharmaTrace 💊\nBạn cần tư vấn về thuốc gì hôm nay?'
}

const loadMessages = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [WELCOME_MESSAGE]
    const { messages, savedAt } = JSON.parse(raw)
    if (Date.now() - savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return [WELCOME_MESSAGE]
    }
    return messages
  } catch {
    return [WELCOME_MESSAGE]
  }
}

const saveMessages = (messages) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, savedAt: Date.now() }))
  } catch {
    // localStorage đầy hoặc bị chặn — bỏ qua
  }
}

const TypingIndicator = () => (
  <div className="flex gap-2 items-end">
    <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
      <Bot className="w-4 h-4 text-brand-600" />
    </div>
    <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  </div>
)

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(loadMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Lưu vào localStorage mỗi khi messages thay đổi
  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_KEY)
    setMessages([WELCOME_MESSAGE])
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setIsLoading(true)

    try {
      // Gửi history (bỏ tin nhắn chào mừng đầu tiên, giữ tối đa 10 lượt)
      const history = messages.slice(1).slice(-10)
      const { reply } = await chatbotService.sendMessage(text, history)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      console.error('[Chatbot Error]', err?.response?.data || err?.message || err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau!'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Cửa sổ chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-36 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden sm:bottom-20"
            style={{ height: '520px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">Trợ lý Dược phẩm</p>
                <p className="text-white/70 text-xs">PharmaTrace AI</p>
              </div>
              <button
                onClick={handleClearHistory}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                aria-label="Xóa lịch sử chat"
                title="Xóa lịch sử"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                aria-label="Đóng chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Danh sách tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-brand-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      msg.role === 'user'
                        ? 'bg-brand-500 text-white rounded-tr-sm'
                        : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-100 flex gap-2 items-end flex-shrink-0">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi về thuốc, triệu chứng..."
                rows={1}
                className="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 max-h-24 min-h-[38px]"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="Gửi tin nhắn"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nút mở/đóng */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors sm:bottom-6"
        aria-label="Mở trợ lý tư vấn dược phẩm"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  )
}
