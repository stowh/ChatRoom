import './RoomList.css'

function RoomList({ rooms, currentRoomId, onJoinRoom, onRemoveRoom }) {
  if (rooms.length === 0) {
    return (
      <div className="room-list-empty">
        <p>Нет комнат</p>
        <span>Создайте комнату или присоединитесь по ID</span>
      </div>
    )
  }

  return (
    <div className="room-list">
      <h3 className="room-list-title">Комнаты</h3>
      <div className="room-list-items">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`room-item ${currentRoomId === room.id ? 'active' : ''}`}
            onClick={() => onJoinRoom(room.id)}
          >
            <div className="room-item-content">
              <div className="room-item-name">
                {room.name}
                {room.isJoined && !room.isAdmin && (
                  <span className="room-item-badge">Присоединена</span>
                )}
              </div>
              <div className="room-item-id">ID: {room.id}</div>
            </div>
            {room.isAdmin && (
              <button
                className="room-item-remove"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm('Удалить комнату?')) {
                    onRemoveRoom(room.id)
                  }
                }}
                title="Удалить комнату"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default RoomList

