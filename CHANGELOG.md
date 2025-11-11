# 🔄 Cambios Recientes - Sistema de Detección de Armas

## ✅ Nuevas Funcionalidades Implementadas

### 🔫 Soporte para Detección de Pistolas (Clase 1)

El sistema ahora puede detectar **dos tipos de armas**:

#### **Clase 0: Cuchillos** 🔪
- Color: **Rojo** (#e74c3c)
- Etiqueta: "CUCHILLO XX%"

#### **Clase 1: Pistolas** 🔫  
- Color: **Naranja** (#ff8800)
- Etiqueta: "PISTOLA XX%"

### 📸 Toggle de Guardado Automático de Imágenes

Se agregó un **checkbox en la interfaz** para controlar el guardado automático:

- **Ubicación**: Panel de "Configuración Actual"
- **Estado por defecto**: ✅ Habilitado
- **Funcionalidad**: 
  - ✅ Activado: Guarda imágenes automáticamente cada 2 segundos cuando detecta un arma
  - ❌ Desactivado: No guarda imágenes, solo muestra alertas y detecciones en pantalla

### 📊 Estadísticas Mejoradas

El panel de estadísticas ahora muestra:
- 🔪 **Cuchillos detectados** (contador separado)
- 🔫 **Pistolas detectadas** (contador separado)
- 📈 **Total de armas** (suma de ambos)
- 📊 **Detecciones activas** (en el frame actual)
- 🎯 **Confianza actual**
- 🚦 **Estado del sistema**

### 🤖 Detección Automática de Formato del Modelo

El código ahora **detecta automáticamente** el formato de salida de tu modelo:

#### Modelos soportados:
1. **Formato con 1 clase** (compatibilidad con modelos antiguos):
   - `[1, 5, 8400]` o `[1, 8400, 5]`
   - Salida: x, y, w, h, conf
   - Solo detecta cuchillos

2. **Formato con 2 clases** (nuevo):
   - `[1, 6, 8400]` o `[1, 8400, 6]`
   - Salida: x, y, w, h, conf_cuchillo, conf_pistola
   - Detecta ambas clases

### 🎨 Mejoras Visuales

- **Alertas dinámicas**: Los mensajes ahora muestran cuántos cuchillos y pistolas se detectaron
- **Nombres de archivos descriptivos**:
  - `cuchillo_timestamp.jpg` - Solo cuchillos
  - `pistola_timestamp.jpg` - Solo pistolas
  - `multiple_timestamp.jpg` - Ambos tipos en la misma imagen
- **Miniaturas con información**:
  - Muestra emojis 🔪 y 🔫 con contadores
  - Timestamp de captura
  - Nombre del archivo

---

## 🚀 Cómo Usar el Nuevo Sistema

### 1. Preparar tu Modelo con 2 Clases

Cuando entrenes tu modelo YOLO11, asegúrate de:
- **Clase 0**: Etiquetar cuchillos como `knife` o `cuchillo`
- **Clase 1**: Etiquetar pistolas como `gun` o `pistola`

### 2. Exportar el Modelo a TensorFlow.js

```bash
# Desde tu modelo YOLO entrenado (.pt)
yolo export model=best.pt format=tfjs

# O con tensorflowjs_converter
tensorflowjs_converter --input_format=keras modelo.h5 ./public/model
```

### 3. Colocar el Modelo

Coloca los archivos en `public/model/`:
- `model.json`
- `group1-shard1of1.bin` (o los archivos .bin que genere)

### 4. Configurar el Guardado de Imágenes

**Opción A - Desde la interfaz** (recomendado):
- Inicia la aplicación con `npm run dev`
- Ve al panel de "Configuración Actual"
- Marca/desmarca el checkbox "📸 Guardar imágenes automáticamente al detectar armas"

**Opción B - Cambiar el valor por defecto**:

Edita `src/App.jsx`, línea 34:
```javascript
const [autoSaveImages, setAutoSaveImages] = useState(true)  // true = habilitado, false = deshabilitado
```

### 5. Iniciar la Aplicación

```bash
npm run dev
```

1. Haz clic en "📦 Cargar Modelo"
2. Espera a que cargue (verás "✅ Modelo listo")
3. Haz clic en "🎬 Iniciar Detección"
4. El sistema detectará automáticamente el formato del modelo

---

## 🔍 Detalles Técnicos

### Cambios en el Código

#### `App.jsx`
- ✅ Función `decodeYOLOOutput()` actualizada para soportar 2 clases
- ✅ Agregado estado `totalGuns` para contar pistolas
- ✅ Agregado estado `autoSaveImages` para el toggle
- ✅ Función `capturePhoto()` ahora recibe `knives` y `guns`
- ✅ Lógica de detección actualizada para diferenciar clases
- ✅ Colores y etiquetas diferentes por clase
- ✅ Guardado condicional basado en el toggle

#### `DetectionStats.jsx`
- ✅ Agregado prop `totalGuns`
- ✅ Panel de estadísticas con 6 cards (antes 4)
- ✅ Contador de cuchillos y pistolas separados
- ✅ Total de armas calculado

#### `INSTRUCCIONES.md`
- ✅ Documentación actualizada con nueva funcionalidad
- ✅ Guía de uso del toggle de guardado
- ✅ Explicación de formatos soportados
- ✅ Colores y clases documentados

---

## 📝 Notas Importantes

### Compatibilidad con Modelos Antiguos
✅ El sistema **sigue siendo compatible** con modelos de 1 clase (solo cuchillos)
- Si tu modelo actual solo detecta cuchillos, seguirá funcionando sin cambios
- Cuando entrenes el nuevo modelo con pistolas, simplemente reemplaza los archivos

### Rendimiento
⚡ El sistema mantiene el mismo rendimiento:
- Detección en tiempo real
- Filtrado por tamaño mínimo
- NMS (Non-Maximum Suppression)
- Umbrales configurables

### Guardado de Imágenes
💾 Control total sobre el guardado:
- **Habilitado**: Guarda automáticamente (útil para recopilar datos)
- **Deshabilitado**: Solo alertas en pantalla (útil para monitoreo sin almacenar)
- Descarga automática al navegador
- Límite de 20 fotos en memoria (las más recientes)

---

## 🎯 Próximos Pasos Recomendados

1. ✅ **Entrenar el modelo** con la clase de pistolas
2. ✅ **Exportar a TensorFlow.js** en formato YOLO11
3. ✅ **Probar el modelo** con el sistema actualizado
4. ✅ **Ajustar umbrales** según sea necesario
5. ✅ **Recopilar datos** con el guardado automático habilitado

---

## 🆘 Solución de Problemas

### El modelo no detecta pistolas
- Verifica que el modelo tenga 2 clases entrenadas
- Revisa la consola del navegador (F12) para ver el formato detectado
- Debe mostrar: "✅ Formato detectado: [1, 6, 8400] - 2 clases"

### Las imágenes no se guardan
- Verifica que el toggle esté ✅ marcado
- Asegúrate de que el navegador permita descargas automáticas
- Revisa permisos de descarga del navegador

### Solo detecta cuchillos
- Si tu modelo actual solo tiene 1 clase, es normal
- El sistema mostrará: "✅ Formato detectado: [1, 5, 8400] - 1 clase"
- Entrena un nuevo modelo con ambas clases

---

**Fecha de actualización**: Noviembre 2024  
**Versión**: 2.0 - Multi-clase con toggle de guardado
