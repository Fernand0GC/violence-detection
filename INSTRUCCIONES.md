# 📝 Instrucciones de Uso Rápido

## 🚀 Inicio Rápido

### 1. Preparar tu Modelo TensorFlow.js

**IMPORTANTE:** Necesitas colocar tu modelo de detección de armas en la carpeta correcta.

1. Crea la carpeta `public/model/` (ya existe)
2. Coloca estos archivos de tu modelo:
   - `model.json`
   - `group1-shard1of1.bin` (o los archivos .bin que tengas)

**Conversión de modelo (si tienes un modelo .h5 de Keras):**
```bash
pip install tensorflowjs
tensorflowjs_converter --input_format=keras tu_modelo.h5 ./public/model
```

### 2. Iniciar la Aplicación

```bash
npm run dev
```

La aplicación se abrirá automáticamente en `http://localhost:3000`

### 3. Usar la Aplicación

1. **Permitir acceso a la cámara** cuando el navegador lo solicite
2. Espera a que el modelo se cargue (verás "✅ Modelo listo")
3. Haz clic en **"Iniciar Detección"**
4. Apunta la cámara hacia objetos para probar la detección

## 🎯 Funcionalidades Implementadas

### ✅ Detección en Tiempo Real
- Análisis continuo de video desde tu cámara web
- Detección de cuchillos (clase 0)
- Cuadros delimitadores sobre objetos detectados

### 🚦 Semáforo de Peligro
- **🟢 VERDE:** Seguro - No hay detecciones
- **🟡 AMARILLO:** Advertencia - Confianza media (50-80%)
- **🔴 ROJO:** Peligro - Cuchillo detectado con alta confianza (>80%)

### 🔊 Sistema de Alertas
- Alerta visual en la esquina superior derecha
- Sonido de alerta (si está habilitado en el navegador)
- Se activa automáticamente al detectar un cuchillo con >80% confianza

### 📊 Gráficas y Reportes
1. **Probabilidad en Tiempo Real:** Línea que muestra la confianza de detección momento a momento
2. **Detecciones por Minuto:** Histograma de los últimos 5 minutos
3. **Distribución:** Gráfica circular comparando detecciones vs frames sin detección
4. **Resumen de Sesión:** Estadísticas completas de la sesión actual

### 📈 Panel de Estadísticas
- Total de cuchillos detectados
- Confianza actual del modelo
- Total de frames analizados
- Estado del sistema en tiempo real

## ⚙️ Configuración Personalizada

### Ajustar el Umbral de Confianza

Edita `src/App.jsx`, línea ~110:
```javascript
const threshold = 0.5 // Cambia este valor (0.0 a 1.0)
```
- Valores más bajos: Más sensible (más falsas alarmas)
- Valores más altos: Menos sensible (puede perder detecciones)

### Ajustar Tamaño de Entrada del Modelo

Edita `src/App.jsx`, línea ~106:
```javascript
const resized = tf.image.resizeBilinear(img, [224, 224])
```
Cambia `[224, 224]` al tamaño que tu modelo necesite.

### Modificar Niveles de Alerta

Edita `src/App.jsx`, líneas ~136-141:
```javascript
if (knifeConfidence > 0.8) {      // Alta confianza -> ROJO
  setDangerLevel('danger')
} else if (knifeConfidence > threshold) {  // Media -> AMARILLO
  setDangerLevel('warning')
} else {                          // Baja -> VERDE
  setDangerLevel('safe')
}
```

## 🔧 Solución de Problemas Comunes

### ❌ "Error al cargar el modelo"
**Causa:** El modelo no está en la ubicación correcta o tiene formato incorrecto.

**Solución:**
1. Verifica que exista `public/model/model.json`
2. Verifica que existan los archivos .bin en la misma carpeta
3. Abre la consola del navegador (F12) para ver el error exacto

### ❌ "No se pudo acceder a la cámara"
**Causa:** El navegador no tiene permisos o la cámara está en uso.

**Solución:**
1. Haz clic en el ícono del candado en la barra de direcciones
2. Permite el acceso a la cámara
3. Recarga la página
4. Si falla, cierra otras aplicaciones que usen la cámara

### ❌ Las alertas no suenan
**Causa:** El navegador bloquea el audio automático.

**Solución:**
1. Interactúa con la página (haz clic en cualquier lugar) antes de iniciar
2. Verifica el volumen del sistema
3. Algunos navegadores requieren que permitas el audio en la configuración

### ❌ La detección es muy lenta
**Causa:** El modelo es muy grande o tu computadora tiene recursos limitados.

**Solución:**
1. Reduce el tamaño de entrada del modelo
2. Agrega un delay entre frames (modifica `detectFrame()`)
3. Usa un modelo más pequeño/optimizado

## 📱 Compatibilidad

### Navegadores Soportados:
- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ⚠️ Opera (puede tener problemas con audio)

### Requisitos Mínimos:
- Navegador con WebRTC
- Cámara web funcional
- JavaScript habilitado
- Conexión segura (HTTPS o localhost)

## 🎨 Personalización de la UI

Los estilos están en `src/App.css`. Puedes modificar:
- Colores del tema
- Tamaños de fuente
- Diseño del layout
- Animaciones

## 📦 Compilar para Producción

```bash
npm run build
```

Los archivos optimizados estarán en la carpeta `dist/`

Para previsualizar:
```bash
npm run preview
```

## 🆘 Necesitas Ayuda?

Si tienes problemas:
1. Revisa este archivo primero
2. Consulta el README.md principal
3. Revisa la consola del navegador (F12)
4. Verifica los permisos de cámara
5. Asegúrate de que el modelo esté correctamente ubicado

---

## 🎯 Lista de Verificación Antes de Usar

- [ ] Node.js instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Modelo TensorFlow.js en `public/model/`
- [ ] Cámara web conectada y funcionando
- [ ] Navegador con permisos de cámara habilitados
- [ ] JavaScript habilitado en el navegador

¡Listo! Ahora ejecuta `npm run dev` y comienza a usar el sistema. 🚀
