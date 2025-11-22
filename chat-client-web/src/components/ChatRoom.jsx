import { useState, useEffect, useRef } from 'react'
import { wsClient } from '../services/websocket'
import './ChatRoom.css'

function ChatRoom({ roomId, onLeave, accessToken }) {
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    connect()

    return () => {
      wsClient.disconnect()
    }
  }, [roomId, accessToken])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const connect = () => {
    if (!accessToken) {
      setError('Токен доступа отсутствует')
      return
    }

    wsClient.onOpen = () => {
      setIsConnected(true)
      setError('')
    }

    wsClient.onMessage = (message) => {
      console.log('Received message from server:', message, 'message type:', typeof message.message)
      try {
        let text = ''
        
        // Обрабатываем разные форматы message
        if (typeof message.message === 'string') {
          // Если это строка, проверяем, является ли она base64
          // Go обычно кодирует []byte как base64 строку в JSON
          try {
            // Пытаемся декодировать как base64
            const decoded = atob(message.message)
            // Проверяем, что декодированный текст содержит печатные символы
            // Если это валидный UTF-8 текст, используем его
            text = decoded
          } catch (base64Error) {
            // Если не base64, возможно это уже декодированная строка
            text = message.message
          }
        } else if (Array.isArray(message.message)) {
          // Если это массив чисел (байты), декодируем через TextDecoder
          const bytes = new Uint8Array(message.message)
          text = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
        } else if (message.message instanceof ArrayBuffer) {
          // Если это ArrayBuffer
          text = new TextDecoder('utf-8', { fatal: false }).decode(message.message)
        } else if (message.message instanceof Uint8Array) {
          // Если это Uint8Array
          text = new TextDecoder('utf-8', { fatal: false }).decode(message.message)
        } else if (message.message === null || message.message === undefined) {
          console.warn('Message field is null or undefined')
          return
        } else {
          // Пытаемся преобразовать в строку
          text = String(message.message)
        }
        
        // Убираем лишние пробелы и проверяем, что текст не пустой
        text = text.trim()
        
        if (!text) {
          console.warn('Empty message text after decoding')
          return
        }
        
        console.log('Decoded message text:', text)
        
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            clientId: message.client_id,
            clientName: message.client_name,
            text: text,
            timestamp: new Date(),
          },
        ])
      } catch (error) {
        console.error('Error decoding message:', error, 'Raw message:', message)
        setError('Ошибка обработки сообщения: ' + error.message)
      }
    }

    wsClient.onError = (err) => {
      const errorMsg = err.message || 'Ошибка подключения'
      console.error('WebSocket error:', err)
      
      // Специальная обработка для ошибок токена и несуществующих комнат
      if (errorMsg.includes('token') || errorMsg.includes('Invalid token')) {
        setError('Неверный токен авторизации. Пожалуйста, войдите заново.')
      } else if (errorMsg.includes('room') || errorMsg.includes('Room')) {
        setError('Комната не найдена или недоступна')
      } else {
        setError(errorMsg)
      }
      setIsConnected(false)
    }

    wsClient.onClose = () => {
      setIsConnected(false)
    }

    wsClient.connect(roomId, accessToken)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!messageInput.trim() || !isConnected) return

    const messageText = messageInput.trim()
    console.log('Sending message:', messageText)
    
    const sent = wsClient.sendMessage(messageText)
    if (sent) {
      setMessageInput('')
      // Оптимистичное обновление - показываем сообщение сразу
      // Оно будет заменено/дополнено когда придет от сервера
      // Но это не обязательно, так как сервер отправляет сообщение обратно
    } else {
      setError('Не удалось отправить сообщение')
    }
  }

  return (
    <div className="chat-room">
      <div className="chat-room-header">
        <div className="room-header-info">
          <h2 className="room-title">Комната: {roomId}</h2>
          <div className="room-status">
            <span
              className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}
            ></span>
            <span>{isConnected ? 'Подключено' : 'Отключено'}</span>
          </div>
        </div>
        <button className="leave-room-button" onClick={onLeave}>
          Покинуть комнату
        </button>
      </div>

      {error && <div className="chat-error">{error}</div>}

      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="messages-empty">
            <p>Нет сообщений</p>
            <span>Начните общение, отправив первое сообщение</span>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="message">
              <div className="message-header">
                <span className="message-author">{msg.clientName}</span>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="message-text">{msg.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder={
            isConnected
              ? 'Введите сообщение...'
              : 'Подключение к комнате...'
          }
          disabled={!isConnected}
          maxLength={500}
        />
        <button
          type="submit"
          className="send-button"
          disabled={!isConnected || !messageInput.trim()}
        >
          Отправить
        </button>
      </form>
    </div>
  )
}

export default ChatRoom

