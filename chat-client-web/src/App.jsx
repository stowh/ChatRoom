import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import { api } from './services/api'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Обновляем токены из localStorage
      api.accessToken = localStorage.getItem('access_token') || null
      api.refreshToken = localStorage.getItem('refresh_token') || null
      
      if (api.accessToken) {
        console.log('Checking auth with token:', api.accessToken.substring(0, 20) + '...')
        const response = await api.validate()
        console.log('Validate response:', response)
        if (response.status === 'success') {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          api.clearTokens()
        }
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
      api.clearTokens()
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = () => {
    // Обновляем токены из localStorage перед установкой состояния
    api.accessToken = localStorage.getItem('access_token') || null
    api.refreshToken = localStorage.getItem('refresh_token') || null
    console.log('Setting authenticated to true, token exists:', !!api.accessToken)
    setIsAuthenticated(true)
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="app">
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/chat" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/chat" replace />
            ) : (
              <Register onRegister={handleLogin} />
            )
          }
        />
        <Route
          path="/chat"
          element={
            isAuthenticated ? (
              <Chat onLogout={() => setIsAuthenticated(false)} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to="/chat" replace />} />
      </Routes>
    </div>
  )
}

export default App

