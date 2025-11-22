import { useState } from 'react'
import './JoinRoom.css'

function JoinRoom({ onJoinRoom }) {
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const trimmedRoomId = roomId.trim()
    if (!trimmedRoomId) {
      setError('Введите ID комнаты')
      return
    }

    if (trimmedRoomId.length < 3) {
      setError('ID комнаты должен быть не менее 3 символов')
      return
    }

    onJoinRoom(trimmedRoomId)
    setRoomId('')
  }

  return (
    <div className="join-room">
      <h3 className="join-room-title">Присоединиться к комнате</h3>
      <form onSubmit={handleSubmit} className="join-room-form">
        {error && <div className="join-room-error">{error}</div>}
        <div className="join-room-input-group">
          <input
            type="text"
            className="join-room-input"
            value={roomId}
            onChange={(e) => {
              setRoomId(e.target.value)
              setError('')
            }}
            placeholder="Введите ID комнаты"
            maxLength={20}
          />
          <button type="submit" className="join-room-button">
            Присоединиться
          </button>
        </div>
      </form>
    </div>
  )
}

export default JoinRoom

