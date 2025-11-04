import React, { useRef, useState, useEffect } from "react"
import * as tf from "@tensorflow/tfjs"
import { AlertTriangle, Download } from 'lucide-react'
import DetectionStats from './components/DetectionStats'
import TrafficLight from './components/TrafficLight'
import Charts from './components/Charts'
import './App.css'

const App = () => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const modelRef = useRef(null)
  const audioRef = useRef(null)
  const lastPhotoTime = useRef(0)
  const frameCount = useRef(0)

  // ============================================================
  // ⚙️ CONFIGURACIÓN DEL SISTEMA - MODIFICA AQUÍ
  // ============================================================
  const CONFIDENCE_THRESHOLD = 0.6  // 0.0 - 1.0 (0.6 = 60% confianza mínima)
  const MIN_SIZE_PIXELS = 70         // Tamaño mínimo en píxeles para detectar objetos
  const NMS_IOU_THRESHOLD = 0.5     // 0.0 - 1.0 (0.5 = eliminar duplicados con 50% overlap)

  const [isDetecting, setIsDetecting] = useState(false)
  const [status, setStatus] = useState("Esperando carga del modelo...")
  const [dangerLevel, setDangerLevel] = useState('safe')
  const [detections, setDetections] = useState([])
  const [totalKnives, setTotalKnives] = useState(0)
  const [showAlert, setShowAlert] = useState(false)
  const [detectionHistory, setDetectionHistory] = useState([])
  const [capturedPhotos, setCapturedPhotos] = useState([])

  // ============================================================
  // Inicialización
  // ============================================================
  useEffect(() => {
    audioRef.current = new Audio('/alert.wav')
    audioRef.current.addEventListener('error', () => {
      console.warn('⚠️ No se encontró /alert.wav, usando beep')
    })
  }, [])

  // ============================================================
  // 1️⃣ Cargar el modelo YOLO11
  // ============================================================
  const loadModel = async () => {
    try {
      console.log("📦 Cargando modelo YOLO11 desde /model/model.json...")
      setStatus("Cargando modelo YOLO11...")

      const model = await tf.loadGraphModel("/model/model.json")
      modelRef.current = model

      console.log("✅ Modelo YOLO11 cargado correctamente")
      console.log("📋 Inputs del modelo:", model.inputs)
      console.log("📋 Outputs del modelo:", model.outputs)
      setStatus("Modelo cargado ✅")
    } catch (error) {
      console.error("❌ Error al cargar el modelo:", error)
      setStatus("Error al cargar modelo ❌")
    }
  }

  // ============================================================
  // 2️⃣ Iniciar cámara
  // ============================================================
  const startCamera = async () => {
    try {
      console.log("📹 Solicitando acceso a la cámara...")
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      videoRef.current.srcObject = stream

      videoRef.current.onloadedmetadata = () => {
        console.log("✅ Cámara obtenida:", stream.getVideoTracks()[0].label)
        console.log(
          "📺 Video metadata cargada",
          videoRef.current.videoWidth,
          "x",
          videoRef.current.videoHeight
        )
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        ctxRef.current = canvasRef.current.getContext("2d")
      }

      await videoRef.current.play()
    } catch (error) {
      console.error("❌ Error al acceder a la cámara:", error)
    }
  }

  // ============================================================
  // 3️⃣ Decodificar salida YOLO11 ([1,5,8400])
  // ============================================================
  const decodeYOLOOutput = async (predictions, imgWidth, imgHeight, confThreshold = CONFIDENCE_THRESHOLD) => {
    const flat = await predictions.data()
    const shape = predictions.shape
    const [b, d1, d2] = shape

    if (frameCount.current === 1) {
      console.log("📏 Shape salida:", shape)
    }

    const detections = []
    let numAnchors, numAttrs

    if (d1 === 5) {
      numAnchors = d2
      numAttrs = d1
      if (frameCount.current === 1) {
        console.log("✅ Formato detectado: [1, 5, 8400]")
      }
      for (let i = 0; i < numAnchors; i++) {
        const x_center = flat[0 * numAnchors + i]
        const y_center = flat[1 * numAnchors + i]
        const width = flat[2 * numAnchors + i]
        const height = flat[3 * numAnchors + i]
        const conf = flat[4 * numAnchors + i]
        if (conf < confThreshold) continue

        // 🚀 Coordenadas absolutas (0–640) → escalar a canvas
        const scaleX = imgWidth / 640
        const scaleY = imgHeight / 640

        const x = (x_center - width / 2) * scaleX
        const y = (y_center - height / 2) * scaleY
        const w = width * scaleX
        const h = height * scaleY

        detections.push({ x, y, w, h, confidence: conf })
      }
    } else if (d2 === 5) {
      numAnchors = d1
      numAttrs = d2
      if (frameCount.current === 1) {
        console.log("✅ Formato detectado: [1, 8400, 5]")
      }
      for (let i = 0; i < numAnchors; i++) {
        const offset = i * numAttrs
        const x_center = flat[offset + 0]
        const y_center = flat[offset + 1]
        const width = flat[offset + 2]
        const height = flat[offset + 3]
        const conf = flat[offset + 4]
        if (conf < confThreshold) continue

        const scaleX = imgWidth / 640
        const scaleY = imgHeight / 640

        const x = (x_center - width / 2) * scaleX
        const y = (y_center - height / 2) * scaleY
        const w = width * scaleX
        const h = height * scaleY

        detections.push({ x, y, w, h, confidence: conf })
      }
    }

    if (frameCount.current === 1) {
      console.log(`📦 Detecciones decodificadas: ${detections.length}`)
      if (detections.length > 0) console.log("Ejemplo detección:", detections[0])
    }
    return detections
  }

  // ============================================================
  // NMS - Non-Maximum Suppression
  // ============================================================
  const applyNMS = (detections, iouThreshold = NMS_IOU_THRESHOLD) => {
    if (detections.length === 0) return []

    detections.sort((a, b) => b.confidence - a.confidence)
    const finalDetections = []

    const calculateIoU = (boxA, boxB) => {
      const xA = Math.max(boxA.x, boxB.x)
      const yA = Math.max(boxA.y, boxB.y)
      const xB = Math.min(boxA.x + boxA.w, boxB.x + boxB.w)
      const yB = Math.min(boxA.y + boxA.h, boxB.y + boxB.h)

      const interWidth = Math.max(0, xB - xA)
      const interHeight = Math.max(0, yB - yA)
      const interArea = interWidth * interHeight

      const boxAArea = boxA.w * boxA.h
      const boxBArea = boxB.w * boxB.h
      const unionArea = boxAArea + boxBArea - interArea

      return interArea / unionArea
    }

    while (detections.length > 0) {
      const best = detections.shift()
      finalDetections.push(best)

      detections = detections.filter(det => calculateIoU(best, det) < iouThreshold)
    }

    return finalDetections
  }

  // ============================================================
  // 4️⃣ Detectar cada frame y dibujar en canvas
  // ============================================================
  const detectFrame = async (video, model, canvas, ctx) => {
    frameCount.current++
    const showLog = frameCount.current % 30 === 1

    try {
      const input = tf.tidy(() => {
        const tfImg = tf.browser.fromPixels(video)
        const resized = tf.image.resizeBilinear(tfImg, [640, 640])
        const normalized = resized.div(255.0)
        return normalized.expandDims(0)
      })

      const start = performance.now()
      const output = model.execute(input)
      const inference = performance.now() - start

      if (showLog) {
        console.log(`⚡ Inferencia: ${inference.toFixed(1)}ms`)
      }

      const preds = Array.isArray(output) ? output[0] : output
      let decoded = await decodeYOLOOutput(preds, canvas.width, canvas.height, CONFIDENCE_THRESHOLD)

      // Filtrar por tamaño mínimo y coordenadas válidas
      const beforeFilter = decoded.length
      decoded = decoded.filter(det => {
        if (det.x < 0 || det.y < 0) return false
        if (det.x + det.w > canvas.width || det.y + det.h > canvas.height) return false
        if (det.w < MIN_SIZE_PIXELS || det.h < MIN_SIZE_PIXELS) return false
        const aspectRatio = det.w / det.h
        if (aspectRatio < 0.3 || aspectRatio > 3) return false
        return true
      })

      if (showLog && beforeFilter !== decoded.length) {
        console.log(`   Filtradas (tamaño mín ${MIN_SIZE_PIXELS}px): ${beforeFilter} → ${decoded.length}`)
      }

      // Aplicar NMS
      const beforeNMS = decoded.length
      decoded = applyNMS(decoded, NMS_IOU_THRESHOLD)

      if (showLog) {
        console.log(`✅ Después de NMS: ${beforeNMS} → ${decoded.length}`)
      }

      // 🔁 Limpiar canvas y dibujar video + cajas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      let knifeDetected = false
      decoded.forEach((det) => {
        const { x, y, w, h, confidence } = det
        knifeDetected = true
        ctx.strokeStyle = "#e74c3c"
        ctx.lineWidth = 3
        ctx.strokeRect(x, y, w, h)

        const label = `CUCHILLO ${(confidence * 100).toFixed(0)}%`
        ctx.font = "bold 16px Arial"
        const textWidth = ctx.measureText(label).width
        ctx.fillStyle = "rgba(231,76,60,0.9)"
        ctx.fillRect(x, y > 20 ? y - 25 : y, textWidth + 10, 20)
        ctx.fillStyle = "#fff"
        ctx.fillText(label, x + 5, y > 20 ? y - 8 : y + 14)
      })

      // Actualizar estado
      if (knifeDetected) {
        setDangerLevel('danger')
        setDetections(decoded)
        setStatus("⚠️ CUCHILLO DETECTADO")

        // Capturar foto cada 2 segundos
        const now = Date.now()
        if (now - lastPhotoTime.current > 2000) {
          lastPhotoTime.current = now
          console.log(`🚨 ¡¡¡CUCHILLO DETECTADO!!! - ${decoded.length} detección(es)`)
          capturePhoto(canvas, decoded.length)
          triggerAlert()
          setTotalKnives(prev => prev + 1)
        }
      } else {
        setDangerLevel('safe')
        setDetections([])
        setStatus("Sin detecciones visibles")
      }

      tf.dispose([input, output])
    } catch (err) {
      console.error("❌ Error en detectFrame:", err)
    }

    // Repetir
    requestAnimationFrame(() => detectFrame(video, model, canvas, ctx))
  }

  // ============================================================
  // Funciones auxiliares
  // ============================================================
  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)

      console.log('✅ Beep generado')
    } catch (err) {
      console.error('❌ Error al generar beep:', err)
    }
  }

  const triggerAlert = () => {
    setShowAlert(true)
    if (audioRef.current) {
      console.log('🔊 Reproduciendo alerta...')
      audioRef.current.currentTime = 0
      audioRef.current.play()
        .then(() => console.log('✅ Audio reproducido'))
        .catch(err => {
          console.warn('⚠️ Audio falló:', err.message)
          playBeep()
        })
    } else {
      playBeep()
    }
    setTimeout(() => setShowAlert(false), 2500)
  }

  const capturePhoto = (canvas, numDetections) => {
    canvas.toBlob(blob => {
      if (!blob) return

      const timestamp = new Date()
      const filename = `cuchillo_${timestamp.getTime()}.jpg`
      const url = URL.createObjectURL(blob)

      const photoData = {
        url,
        filename,
        timestamp: timestamp.toLocaleString(),
        detections: numDetections
      }

      setCapturedPhotos(prev => [photoData, ...prev].slice(0, 20))

      // Descargar automáticamente
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()

      console.log(`✅ Foto guardada: ${filename}`)
    }, 'image/jpeg', 0.95)
  }

  const downloadAllPhotos = () => {
    console.log(`📥 Descargando ${capturedPhotos.length} fotos...`)
    capturedPhotos.forEach((photo, idx) => {
      setTimeout(() => {
        const link = document.createElement('a')
        link.href = photo.url
        link.download = photo.filename
        link.click()
      }, idx * 200)
    })
  }

  // ============================================================
  // 5️⃣ Botón iniciar detección
  // ============================================================
  const startDetection = async () => {
    console.log("🎬 ===== BOTÓN 'INICIAR DETECCIÓN' PRESIONADO =====")
    if (!modelRef.current) {
      alert("Primero carga el modelo")
      return
    }
    if (isDetecting) {
      alert("Ya se está detectando")
      return
    }

    setIsDetecting(true)
    await startCamera()

    setTimeout(() => {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      const model = modelRef.current

      if (!video || !model) return

      if (video.readyState < 2) {
        console.warn("⏳ Esperando a que el video tenga datos...")
        video.addEventListener(
          "loadeddata",
          () => {
            console.log("🎥 Video listo, iniciando detección...")
            detectFrame(video, model, canvas, ctx)
          },
          { once: true }
        )
      } else {
        console.log("🎥 Video listo inmediatamente, iniciando detección...")
        detectFrame(video, model, canvas, ctx)
      }
    }, 300)
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🛡️ Sistema de Detección de Cuchillos</h1>
          <p>YOLO11 + TensorFlow.js - Detección en tiempo real</p>
        </header>

        {showAlert && (
          <div className="alert-banner">
            <AlertTriangle size={28} />
            <span>⚠️ ¡Cuchillo detectado!</span>
          </div>
        )}

        {/* Configuración actual */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '1.2rem' }}>⚙️ Configuración Actual</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            fontSize: '0.9rem'
          }}>
            <div><strong>Confianza mínima:</strong> {CONFIDENCE_THRESHOLD * 100}%</div>
            <div><strong>Tamaño mínimo:</strong> {MIN_SIZE_PIXELS}px</div>
            <div><strong>NMS IoU:</strong> {NMS_IOU_THRESHOLD * 100}%</div>
          </div>
          <p style={{
            margin: '10px 0 0 0',
            fontSize: '0.8rem',
            color: '#666'
          }}>
            Para cambiar estos valores, edita las constantes en las líneas 22-24 del archivo App.jsx
          </p>
        </div>

        <div className="main-grid">
          <div className="card video-section">
            <h2 style={{ marginBottom: '20px', color: '#333', fontSize: '1.5rem' }}>📹 Video</h2>
            <div style={{ position: "relative", display: "inline-block", width: '100%' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                  width: "100%",
                  maxWidth: "640px",
                  height: "auto",
                  borderRadius: "10px",
                  border: "2px solid #555",
                  display: 'block',
                  margin: '0 auto'
                }}
              />

              <canvas
                ref={canvasRef}
                width="640"
                height="480"
                style={{
                  position: "absolute",
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  maxWidth: "640px",
                  width: "100%",
                  borderRadius: "10px",
                  pointerEvents: "none",
                }}
              />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={loadModel}
                className="btn btn-primary"
              >
                📦 Cargar Modelo
              </button>
              <button
                onClick={startDetection}
                className="btn btn-primary"
                disabled={!modelRef.current || isDetecting}
              >
                🎬 Iniciar Detección
              </button>
            </div>
            <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '1.1rem', color: '#333' }}>{status}</p>
          </div>

          <div className="card status-section">
            <h2>📊 Estado</h2>
            <TrafficLight dangerLevel={dangerLevel} />
            <DetectionStats
              dangerLevel={dangerLevel}
              totalKnives={totalKnives}
              detections={detections}
            />
          </div>
        </div>

        <div className="card reports-section">
          <h2>📈 Reportes</h2>
          <Charts
            detections={detections}
            detectionHistory={detectionHistory}
            totalKnives={totalKnives}
          />
        </div>

        {capturedPhotos.length > 0 && (
          <div className="card" style={{ marginTop: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h2 style={{ margin: '0', color: '#333', fontSize: '1.5rem' }}>
                📸 Fotos Capturadas ({capturedPhotos.length})
              </h2>
              <button className="btn btn-primary" onClick={downloadAllPhotos}>
                <Download size={16} /> Descargar Todas
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              {capturedPhotos.map((photo, idx) => (
                <div key={idx} style={{
                  border: '2px solid #e74c3c',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#2c3e50'
                }}>
                  <img
                    src={photo.url}
                    alt={`Captura ${idx + 1}`}
                    style={{ width: '100%', display: 'block' }}
                  />
                  <div style={{
                    padding: '10px',
                    fontSize: '12px',
                    color: '#ecf0f1'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      🔪 {photo.detections} detección(es)
                    </div>
                    <div>🕒 {photo.timestamp}</div>
                    <div style={{
                      fontSize: '10px',
                      color: '#95a5a6',
                      marginTop: '5px'
                    }}>
                      {photo.filename}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
