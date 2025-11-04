import React, { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const Charts = ({ detections, detectionHistory, totalKnives }) => {
  const [confidenceData, setConfidenceData] = useState({
    labels: [],
    datasets: []
  })

  const [detectionCountData, setDetectionCountData] = useState({
    labels: [],
    datasets: []
  })

  useEffect(() => {
    // Actualizar datos de confianza en tiempo real
    const last20 = detections.slice(-20)
    setConfidenceData({
      labels: last20.map((_, i) => `T-${20 - i}`),
      datasets: [
        {
          label: 'Probabilidad de Cuchillo (%)',
          data: last20.map(d => (d.confidence * 100).toFixed(1)),
          borderColor: 'rgb(231, 76, 60)',
          backgroundColor: 'rgba(231, 76, 60, 0.5)',
          tension: 0.4,
        },
      ],
    })

    // Calcular detecciones por minuto
    const now = new Date()
    const intervals = []
    const counts = []
    
    for (let i = 4; i >= 0; i--) {
      const intervalStart = new Date(now - i * 60000)
      const intervalEnd = new Date(now - (i - 1) * 60000)
      
      const count = detectionHistory.filter(d => 
        d.detected && 
        d.timestamp >= intervalStart && 
        d.timestamp < intervalEnd
      ).length
      
      intervals.push(`-${i}min`)
      counts.push(count)
    }

    setDetectionCountData({
      labels: intervals,
      datasets: [
        {
          label: 'Cuchillos Detectados',
          data: counts,
          backgroundColor: 'rgba(231, 76, 60, 0.7)',
        },
      ],
    })
  }, [detections, detectionHistory])

  const pieData = {
    labels: ['Cuchillos Detectados', 'Sin Detección'],
    datasets: [
      {
        data: [totalKnives, Math.max(detections.length - totalKnives, 0)],
        backgroundColor: [
          'rgba(231, 76, 60, 0.8)',
          'rgba(46, 204, 113, 0.8)',
        ],
        borderColor: [
          'rgb(231, 76, 60)',
          'rgb(46, 204, 113)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%'
          }
        }
      },
    },
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  }

  return (
    <div className="charts-grid">
      <div className="chart-container">
        <h3>📈 Probabilidad en Tiempo Real</h3>
        <Line data={confidenceData} options={lineOptions} />
      </div>
      
      <div className="chart-container">
        <h3>📊 Detecciones por Minuto</h3>
        <Bar data={detectionCountData} options={barOptions} />
      </div>
      
      <div className="chart-container">
        <h3>🥧 Distribución de Detecciones</h3>
        <Doughnut data={pieData} options={doughnutOptions} />
      </div>
      
      <div className="chart-container">
        <h3>📋 Resumen de Sesión</h3>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <strong>Total de frames analizados:</strong> {detections.length}
          </div>
          <div style={{ marginBottom: '15px' }}>
            <strong>Cuchillos detectados:</strong> {totalKnives}
          </div>
          <div style={{ marginBottom: '15px' }}>
            <strong>Tasa de detección:</strong>{' '}
            {detections.length > 0 
              ? ((totalKnives / detections.length) * 100).toFixed(2) 
              : 0}%
          </div>
          <div>
            <strong>Estado actual:</strong>{' '}
            <span style={{ 
              fontWeight: 'bold',
              color: totalKnives > 0 ? '#e74c3c' : '#27ae60'
            }}>
              {totalKnives > 0 ? 'ALERTA ACTIVA' : 'SEGURO'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Charts
