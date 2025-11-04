import React from 'react'

const DetectionStats = ({ dangerLevel, totalKnives, detections }) => {
  const getStatusClass = () => {
    switch (dangerLevel) {
      case 'danger':
        return 'status-danger'
      case 'warning':
        return 'status-warning'
      default:
        return 'status-safe'
    }
  }

  const getStatusText = () => {
    switch (dangerLevel) {
      case 'danger':
        return '🚨 PELIGRO: Arma detectada'
      case 'warning':
        return '⚠️ ADVERTENCIA: Posible arma'
      default:
        return '✅ SEGURO: Sin amenazas'
    }
  }

  const getCurrentConfidence = () => {
    if (detections.length === 0) return 0
    return (detections[detections.length - 1].confidence * 100).toFixed(1)
  }

  return (
    <>
      <div className={`status-text ${getStatusClass()}`}>
        {getStatusText()}
      </div>
      
      <div className="detection-info">
        <div className="info-card">
          <h3>Total Cuchillos Detectados</h3>
          <p>{totalKnives}</p>
        </div>
        <div className="info-card">
          <h3>Confianza Actual</h3>
          <p>{getCurrentConfidence()}%</p>
        </div>
        <div className="info-card">
          <h3>Detecciones Totales</h3>
          <p>{detections.length}</p>
        </div>
        <div className="info-card">
          <h3>Estado</h3>
          <p style={{ fontSize: '1.2rem' }}>
            {dangerLevel === 'danger' ? '🔴' : dangerLevel === 'warning' ? '🟡' : '🟢'}
          </p>
        </div>
      </div>
    </>
  )
}

export default DetectionStats