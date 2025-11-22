import { useState } from 'react'
import './CreateRoomModal.css'

function CreateRoomModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [maxUser, setMaxUser] = useState(10)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await onCreate(name.trim(), maxUser)
      setName('')
      setMaxUser(10)
    } catch (error) {
      console.error('Error creating room:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создать комнату</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="room-name">Название комнаты</label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название"
              required
              disabled={loading}
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="max-users">Максимум пользователей</label>
            <input
              id="max-users"
              type="number"
              value={maxUser}
              onChange={(e) => setMaxUser(parseInt(e.target.value) || 1)}
              min="1"
              max="100"
              required
              disabled={loading}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-button cancel"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="modal-button submit"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRoomModal

