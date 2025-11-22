class WebSocketClient {
  constructor() {
    this.ws = null
    this.roomId = null
    this.accessToken = null
    this.onMessage = null
    this.onError = null
    this.onClose = null
    this.onOpen = null
  }

  connect(roomId, accessToken) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.disconnect()
    }

    this.roomId = roomId
    this.accessToken = accessToken

    // Определяем URL для WebSocket
    // В режиме разработки используем прокси Vite (ws через localhost:3000)
    // В продакшене используем настройки из переменных окружения или дефолтные
    const isDev = import.meta.env.DEV
    let wsUrl
    
    if (isDev) {
      // В режиме разработки прокси Vite перенаправляет WebSocket запросы
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      wsUrl = `${protocol}//${window.location.host}/api/v1/rooms/ws?room=${roomId}&token=${accessToken}`
    } else {
      // В продакшене используем настройки из переменных окружения или дефолтные
      const wsHost = import.meta.env.VITE_WS_HOST || window.location.hostname
      const wsPort = import.meta.env.VITE_WS_PORT || (window.location.protocol === 'https:' ? '443' : '8080')
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      wsUrl = `${protocol}//${wsHost}:${wsPort}/api/v1/rooms/ws?room=${roomId}&token=${accessToken}`
    }

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        if (this.onOpen) this.onOpen()
      }

      this.ws.onmessage = (event) => {
        try {
          console.log('WebSocket message received:', event.data, typeof event.data)
          
          // Проверяем, является ли сообщение ошибкой
          if (event.data === 'error.token') {
            if (this.onError) {
              this.onError(new Error('Invalid token'))
            }
            this.disconnect()
            return
          }

          // Парсим JSON сообщение
          const message = JSON.parse(event.data)
          console.log('Parsed message:', message)
          if (this.onMessage) {
            this.onMessage(message)
          }
        } catch (error) {
          console.error('Error parsing message:', error, 'Raw data:', event.data)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        if (this.onError) {
          this.onError(error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason)
        // Если соединение закрыто сразу после открытия (код 1006 или без кода),
        // это может означать, что комната не существует
        if (event.code === 1006 || (!event.code && !event.wasClean)) {
          if (this.onError) {
            this.onError(new Error('Комната не найдена или недоступна'))
          }
        }
        if (this.onClose) {
          this.onClose()
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      if (this.onError) {
        this.onError(error)
      }
    }
  }

  sendMessage(text) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', text, 'State:', this.ws.readyState)
      this.ws.send(text)
      return true
    }
    console.warn('Cannot send message - WebSocket not open. State:', this.ws?.readyState)
    return false
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.roomId = null
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

export const wsClient = new WebSocketClient()

