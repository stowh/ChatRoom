import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { wsClient } from '../services/websocket'
import ChatRoom from '../components/ChatRoom'
import RoomList from '../components/RoomList'
import CreateRoomModal from '../components/CreateRoomModal'
import JoinRoom from '../components/JoinRoom'
import './Chat.css'

function Chat({ onLogout }) {
  const [currentRoom, setCurrentRoom] = useState(null)
  const [rooms, setRooms] = useState([])
  const [joinedRooms, setJoinedRooms] = useState(new Set()) // Комнаты, к которым подключились
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUser()
    return () => {
      wsClient.disconnect()
    }
  }, [])

  const loadUser = async () => {
    try {
      const response = await api.validate()
      if (response.data) {
        setUser(response.data)
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      handleLogout()
    }
  }

  const handleLogout = async () => {
    await api.logout()
    wsClient.disconnect()
    onLogout()
  }

  const handleCreateRoom = async (name, maxUser) => {
    try {
      const response = await api.createRoom(name, maxUser)
      if (response.data && response.data.room_id) {
        const newRoom = {
          id: response.data.room_id,
          name: name,
          maxUser: maxUser,
          isAdmin: true,
        }
        setRooms([...rooms, newRoom])
        setShowCreateModal(false)
        setError('')
      }
    } catch (error) {
      setError(error.message || 'Ошибка создания комнаты')
    }
  }

  const handleJoinRoom = (roomId) => {
    if (currentRoom && currentRoom.id === roomId) {
      return
    }
    const trimmedRoomId = roomId.trim()
    if (!trimmedRoomId) {
      setError('ID комнаты не может быть пустым')
      return
    }
    
    // Добавляем комнату в список присоединенных, если её там нет
    setJoinedRooms(prev => {
      const newSet = new Set(prev)
      newSet.add(trimmedRoomId)
      return newSet
    })
    
    // Проверяем, есть ли комната в списке созданных
    const existingRoom = rooms.find(r => r.id === trimmedRoomId)
    if (!existingRoom) {
      // Если комнаты нет в списке, добавляем её как присоединенную
      setRooms(prev => [...prev, {
        id: trimmedRoomId,
        name: `Комната ${trimmedRoomId}`,
        maxUser: 0,
        isAdmin: false,
        isJoined: true
      }])
    }
    
    setCurrentRoom({ id: trimmedRoomId })
    setError('')
  }

  const handleLeaveRoom = () => {
    wsClient.disconnect()
    setCurrentRoom(null)
  }

  const handleRemoveRoom = async (roomId) => {
    try {
      await api.removeRoom(roomId)
      setRooms(rooms.filter((r) => r.id !== roomId))
      if (currentRoom && currentRoom.id === roomId) {
        handleLeaveRoom()
      }
      setError('')
    } catch (error) {
      setError(error.message || 'Ошибка удаления комнаты')
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-header">
          <h1 className="chat-logo">AnonChat</h1>
          <div className="user-info">
            <div className="user-avatar">
              {user?.login?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.login || 'User'}</div>
              <div className="user-email">{user?.email || ''}</div>
            </div>
          </div>
        </div>

        <div className="sidebar-content">
          <button
            className="create-room-button"
            onClick={() => setShowCreateModal(true)}
          >
            + Создать комнату
          </button>

          <JoinRoom onJoinRoom={handleJoinRoom} />

          {error && <div className="error-banner">{error}</div>}

          <RoomList
            rooms={rooms}
            currentRoomId={currentRoom?.id}
            onJoinRoom={handleJoinRoom}
            onRemoveRoom={handleRemoveRoom}
          />
        </div>

        <div className="chat-footer">
          <button className="logout-button" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>

      <div className="chat-main">
        {currentRoom ? (
          <ChatRoom
            roomId={currentRoom.id}
            onLeave={handleLeaveRoom}
            accessToken={api.accessToken}
          />
        ) : (
          <div className="chat-welcome">
            <div className="welcome-content">
              <h2>Добро пожаловать в AnonChat!</h2>
              <p>Введите ID комнаты для подключения или создайте новую комнату</p>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateRoomModal
          onClose={() => {
            setShowCreateModal(false)
            setError('')
          }}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  )
}

export default Chat

