const API_BASE = '/api/v1'

class ApiClient {
  constructor() {
    this.accessToken = localStorage.getItem('access_token') || null
    this.refreshToken = localStorage.getItem('refresh_token') || null
    this.refreshTimer = null
    this.startTokenRefreshTimer()
  }

  startTokenRefreshTimer() {
    // Очищаем предыдущий таймер, если есть
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }

    // Обновляем токен каждые 10 минут (access токен обычно живет 15 минут)
    // Это предотвратит истечение токена во время активного использования
    this.refreshTimer = setInterval(async () => {
      if (this.refreshToken && !this.isRefreshing) {
        try {
          console.log('Periodic token refresh...')
          await this.refresh()
        } catch (error) {
          console.error('Periodic token refresh failed:', error)
          // Если refresh не удался, очищаем токены
          this.clearTokens()
          // Останавливаем таймер
          if (this.refreshTimer) {
            clearInterval(this.refreshTimer)
            this.refreshTimer = null
          }
        }
      }
    }, 10 * 60 * 1000) // 10 минут
  }

  stopTokenRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    if (accessToken) {
      localStorage.setItem('access_token', accessToken)
    }
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    }
    // Перезапускаем таймер обновления токена
    this.startTokenRefreshTimer()
  }

  clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    // Останавливаем таймер обновления токена
    this.stopTokenRefreshTimer()
  }

  async request(endpoint, options = {}, retryOn401 = true) {
    const url = `${API_BASE}${endpoint}`
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }

    // Добавляем токен для всех запросов, кроме регистрации и логина
    if (this.accessToken && !endpoint.includes('/auth/register') && !endpoint.includes('/auth/login')) {
      config.headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    try {
      console.log('Making request to:', url, config)
      const response = await fetch(url, config)
      console.log('Response status:', response.status, response.statusText)
      
      // Проверяем, есть ли тело ответа
      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
        console.log('Response data:', data)
      } else {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        throw new Error(text || `HTTP ${response.status}`)
      }

      // Если получили 401 и это не запрос на refresh, пытаемся обновить токен
      if (response.status === 401 && retryOn401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/logout')) {
        console.log('Got 401, attempting to refresh token...')
        
        try {
          // Обновляем токен
          await this.refresh()
          console.log('Token refreshed successfully, retrying request...')
          
          // Повторяем запрос с новым токеном (только один раз)
          return await this.request(endpoint, options, false)
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError)
          // Если refresh не удался, очищаем токены
          this.clearTokens()
          throw new Error('Сессия истекла. Пожалуйста, войдите заново.')
        }
      }

      if (!response.ok) {
        const errorMsg = data.message || data.status || `Request failed with status ${response.status}`
        console.error('Request failed:', errorMsg)
        throw new Error(errorMsg)
      }

      return data
    } catch (error) {
      // Если это ошибка сети (не ответ от сервера)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Network error - server might be down or CORS issue')
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен.')
      }
      console.error('API request error:', { endpoint, error: error.message, stack: error.stack })
      throw error
    }
  }

  async register(login, email, password) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ login, email, password }),
    })
    console.log('Register response:', response)
    if (response.data && response.data.access_token) {
      this.setTokens(response.data.access_token, response.data.refresh_token)
      console.log('Tokens saved after register')
    } else {
      console.warn('No tokens in register response:', response)
    }
    return response
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    console.log('Login response:', response)
    if (response.data && response.data.access_token) {
      this.setTokens(response.data.access_token, response.data.refresh_token)
      console.log('Tokens saved after login')
    } else {
      console.warn('No tokens in login response:', response)
    }
    return response
  }

  async refresh() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }
    
    // Защита от одновременных refresh запросов
    if (this.isRefreshing) {
      // Ждем завершения текущего refresh
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!this.isRefreshing) {
            clearInterval(checkInterval)
            resolve({ status: 'success' })
          }
        }, 100)
        setTimeout(() => {
          clearInterval(checkInterval)
          reject(new Error('Token refresh timeout'))
        }, 5000)
      })
    }
    
    this.isRefreshing = true
    
    try {
      // Для refresh не используем автоматический retry, чтобы избежать бесконечного цикла
      const url = `${API_BASE}/auth/refresh`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: this.refreshToken }),
      })
      
      const contentType = response.headers.get('content-type')
      let data
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        throw new Error(text || `HTTP ${response.status}`)
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to refresh token')
      }
      
      if (data.data && data.data.access_token) {
        this.setTokens(data.data.access_token, data.data.refresh_token)
        console.log('Tokens refreshed successfully')
      }
      
      return data
    } finally {
      this.isRefreshing = false
    }
  }

  async logout() {
    if (!this.refreshToken) {
      this.clearTokens()
      return { status: 'success' }
    }
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ token: this.refreshToken }),
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearTokens()
    }
  }

  async validate() {
    // validate использует GET и проверяет Authorization заголовок через middleware
    return await this.request('/auth/validate', {
      method: 'GET',
    })
  }

  async createRoom(name, maxUser) {
    const response = await this.request('/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ name, max_user: maxUser }),
    })
    return response
  }

  async removeRoom(roomId) {
    return await this.request('/rooms/remove', {
      method: 'DELETE',
      body: JSON.stringify({ room_id: roomId }),
    })
  }

  async checkStatus() {
    return await this.request('/status')
  }
}

export const api = new ApiClient()

