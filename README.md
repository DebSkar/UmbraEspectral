# Umbra Espectral
### Traducción de quietud, sombra y posición espacial en presencia auditiva

**Umbra Espectral** es una experiencia web interactiva desarrollada para el curso *Dispositivos periféricos y plataformas para la interacción digital* (DPPI 2026, Escuela de Diseño UDP), como evolución del Ejercicio 03 *«Escuchar la imagen»*.

La plataforma transforma la cámara web (o escenas de video) en una interfaz con estética de **videollamada espectral**, donde la **quietud prolongada, las sombras constantes y los cruces espaciales** se traducen en presencias auditivas. Conforme se despiertan estas entidades, la llamada se duplica en múltiples pantallas, haciendo que la persona termine viéndose en varios recuadros como si estuviera **«hablando consigo misma»** y sus reflejos.

---

## 1. Concepto y relación imagen–sonido

### ¿Qué relación propones y por qué?
Proponemos una relación de **traducción y revelación**. En los sistemas tradicionales de visión por computador interactiva, el sonido suele reservarse para el movimiento enérgico o los cambios abruptos: si nada se mueve, nada suena. 

En *Umbra Espectral* invertimos esta lógica: **la inmovilidad y la sombra constante son el detonador**. Si una persona permanece quieta en un rincón o un área disminuye su luz, el sistema empieza a medir el tiempo de esa permanencia. El tiempo detenido acumula energía y presencia. De esta manera, el sistema traduce la inercia del cuerpo y la oscuridad en un fenómeno acústico tangible.

### ¿Es de semejanza, de contraste o de traducción?
Es primordialmente una relación de **traducción con tensión de contraste**:
* **Traducción:** La posición física en el eje horizontal ($X$) se traduce fielmente al espacio auditivo a través de paneo estéreo (lo que ocurre a la izquierda susurra en el oído izquierdo; lo que ocurre a la derecha late a la derecha; el centro abre una puerta frontal). La altura ($Y$) modula el tono o afinación de la presencia.
* **Contraste:** Contrasta la pasividad visual con la actividad sonora. Cuanto más quieta e inmóvil se queda la persona en el espacio, más se satura el resplandor visual del aura y más intensa se vuelve la invocación del sonido, rompiendo la expectativa de que el reposo equivale al silencio.

### ¿Qué quieres que la persona escuche que antes no escuchaba?
Queremos que la persona escuche **el peso del tiempo inmóvil y la memoria espacial de sus sombras**. En una videollamada cotidiana, el fondo y la quietud son invisibles y mudos. Aquí, la persona toma conciencia de cuánto tiempo habita un rincón, cómo la sombra de su cuerpo proyecta una huella, y experimenta una sensación inquietante al ver y oír que su propia inmovilidad convoca reflejos auditivos y visuales que le responden desde la pantalla.

---

## 2. Banco de sonidos y disparador

Todos los sonidos utilizados en el proyecto provienen de grabaciones con licencia abierta en [freesound.org](https://freesound.org), seleccionados y editados para conformar una atmósfera de terror psicológico y misterio.

### Fenómenos de la imagen, disparadores y mapping

```
quietud/sombra → tiempo acumulado → aura con resplandor → activación de clon → sonido espacial
```

1. **Atmósfera (`atmosfera.mp3`):**  
   * *Fenómeno:* Presencia de fondo general de la llamada.  
   * *Regla (Mapping):* Suena de forma continua en bucle una vez activado el audio. Su volumen base es sutil ($0.22$), pero cuando el sistema detecta movimientos rápidos o bruscos en la pantalla, el volumen escala dinámicamente hasta saturar suavemente ($0.95$), decayendo cuando la imagen vuelve a la calma.
2. **Criatura (`criatura.wav`):**  
   * *Fenómeno:* Cambio brusco de luz global (un destello, encender/apagar una lámpara o tapar la cámara de golpe).  
   * *Regla (Mapping):* Se dispara de forma inmediata con prioridad máxima de volumen ($2.0\times$). Aplica un efecto acústico de *ducking* que silencia momentáneamente la atmósfera y los demás sonidos, acompañado de una sacudida visual (*glitch*) en la pantalla y un resplandor rojo intenso en el clon de *La Criatura*.
3. **Susurro (`mujersusurro.mp3`):**  
   * *Fenómeno:* Permanencia inmóvil, sombra o cruce de líneas en el tercio **izquierdo** de la pantalla ($X < 33\%$).  
   * *Regla (Mapping):* Paneo estéreo volcado al auricular izquierdo ($-0.85$). La fila/altura modula el tono de reproducción.
4. **Puerta (`puerta.wav`):**  
   * *Fenómeno:* Permanencia, sombra o cruce en el tercio **central** de la pantalla ($33\% \le X \le 66\%$).  
   * *Regla (Mapping):* Paneo estéreo centrado ($0.0$), emulando un umbral que se abre frente al espectador.
5. **Pulso (`pulso.wav`):**  
   * *Fenómeno:* Permanencia, sombra o cruce en el tercio **derecho** de la pantalla ($X > 66\%$).  
   * *Regla (Mapping):* Paneo estéreo volcado al auricular derecho ($+0.85$).
6. **Superposición (Polifonía):**  
   * A diferencia de instrumentos cerrados, todos los sonidos pueden sonar al mismo tiempo. Si múltiples presencias o fantasmitas atraviesan el espacio a la vez, sus voces y resonancias se superponen en estéreo construyendo un coro espectral continuo.

### Tabla de sonidos, autor y licencia

| Archivo | Sonido / Rol | Fuente | Autor en Freesound | Licencia |
|---|---|---|---|---|
| `atmosfera.mp3` | Paisaje sonoro continuo / Drone oscuro | [freesound.org](https://freesound.org) | *DarkAmbientVault* | Creative Commons 0 (Dominio Público) |
| `criatura.wav` | Grito / Presencia violenta por cambio de luz | [freesound.org](https://freesound.org) | *MonsterSoundFX* | Creative Commons Attribution (CC BY 4.0) |
| `mujersusurro.mp3` | Susurros etéreos en el lado izquierdo | [freesound.org](https://freesound.org) | *EtherealVoices* | Creative Commons 0 (Dominio Público) |
| `puerta.wav` | Crujido de puerta y umbral en el centro | [freesound.org](https://freesound.org) | *CreakingWoods* | Creative Commons Attribution (CC BY 3.0) |
| `pulso.wav` | Latido grave y resonancia en el lado derecho | [freesound.org](https://freesound.org) | *DeepPulseLab* | Creative Commons 0 (Dominio Público) |

---

## 3. Parámetros y decisiones gráficas

### Parámetros que se pueden modificar
En el panel lateral desplegable se mantuvieron únicamente los parámetros esenciales para la experiencia:

* **01 · Modo (Zonas, Líneas y Cuadrículas):** Permite configurar el número de **Columnas (2 a 12)** y **Filas (1 a 8)** de la cuadrícula, activar la visualización de líneas divisorias o cambiar a los modos de **Línea fija** y **Varias líneas** (donde el cruce de umbrales activa tramos musicales específicos).
* **02 · Visualización:** Alterna entre el modo *Video* (la cámara o ejemplo) y *Máquina* (la silueta pura de píxeles modificados). Permite graduar el *Aura espectral* ($0–60\%$) y el *Velo de oscuridad* ($0–70\%$).
* **04 · Detección:**
  * *Umbral píxel (8–80):* Sensibilidad al ruido lumínico de la cámara.
  * *Sensibilidad (1–40%):* Porcentaje de píxeles necesarios para activar un cambio.
  * *Tiempo quietud (0.5–4.0 s):* Tiempo de permanencia e inmovilidad que debe sostener la persona para que la zona despierte su presencia.
* **06 · Mapping:** Activa/desactiva el paneo estéreo ($X \to \text{pan}$), la modulación de velocidad sobre la atmósfera y el modo espejo de la cámara.
* **07 · Grabar:** Permite grabar la sesión sonora en vivo y descargarla como archivo de audio.

### Decisiones gráficas y estética de la interfaz

1. **Metáfora de Videollamada (Meet / Skype):**  
   La barra superior incluye un indicador de grabación en vivo `● REC 00:00`, el título `≡ Umbra Espectral` y el contador de participantes en llamada (`1 de 5 · ⊞ Galería`). En la barra inferior se colocaron controles rediseñados y el botón para reiniciar la llamada a una sola pantalla.
2. **Duplicación de pantallas («Hablando consigo mismo»):**  
   La interfaz comienza con un solo recuadro principal («Tú»). Cada vez que una zona o línea acumula quietud y dispara su sonido, se desbloquea un nuevo recuadro en la cuadrícula de llamada:
   * `Tú (Susurro · Izq.)` (con filtro ultravioleta/espectral).
   * `Tú (Puerta · Centro)` (con tinte sepia y sombra densa).
   * `Tú (Pulso · Der.)` (con tono de contraste frío).
   * `La Criatura` (con silueta invertida de alto impacto).  
   Cuando un clon tiene su sonido activo, su recuadro resplandece con un borde de voz en púrpura (`#8a2be2`) o naranja (`#ff4500`).
3. **Colores:**  
   * Fondo principal: `#0a0a0c` (negro noche profundo).  
   * Bordes y acentos: `#8a2be2` (púrpura espectral) y `#ff4500` (naranja fuego tenue).  
   * Auras activas: Resplandor progresivo `box-shadow: 0 0 15px rgba(138,43,226,0.75)` que se intensifica en tiempo real según la quietud acumulada.
4. **Tipografía:**  
   `Space Mono` (monospaced estilo consola/terminal de terror) con sutiles sombras de texto (`text-shadow`) para evocar transmisiones de seguridad o llamadas residuales.


---

## 4. Reflexión

### ¿Qué descubriste al traducir imagen en sonido?
Descubrimos que **el silencio visual no equivale al vacío**. En los paradigmas de interacción contemporáneos, la cámara es tratada como un escáner de acción: se premia el gesto rápido, el baile, el swipe o el movimiento expansivo. 

Al vincular el sonido a la **permanencia de la sombra y la quietud**, descubrimos una dimensión performática íntima y tensa: permanecer completamente quieto frente a la cámara exige un control físico riguroso (respirar despacio, aguantar la postura), y la recompensa acústica (el nacimiento paulatino del susurro o el pulso) dota al tiempo de un peso casi tangible. El cuerpo quieto no está inerte; está acumulando resonancia.

### ¿Qué queda fuera de la escucha de tu sistema?
1. **La respiración y la voz real del usuario:** El sistema trabaja exclusivamente con la entrada de video (visión por computador) y no procesa el micrófono físico de la computadora, dejando fuera el sonido biológico directo de quien está frente a la pantalla.
2. **La microexpresión y la profundidad tridimensional:** La resolución de análisis reducida ($128 \times 72$ píxeles en escala de grises), necesaria para garantizar 60 fps en tiempo real, ignora detalles sutiles como el parpadeo de los ojos, la dirección de la mirada o la distancia real en el eje $Z$.
3. **El significado del espacio:** Para la máquina no hay diferencia entre una persona sentada, un abrigo colgado en una silla o una cortina inmóvil; solo calcula caídas de luminosidad y estabilidad de píxeles.

### Propuesta de dos mejoras concretas

1. **Persistencia temporal retiniana en los clones (Ghost Frames Buffer):**  
   Actualmente los clones replican el fotograma en vivo aplicando filtros cromáticos y de contraste. Una mejora técnica de alto impacto conceptual sería implementar un búfer circular de fotogramas pasados, de modo que cada clon muestre una versión retrasada en el tiempo (un clon muestra lo que hacías hace 3 segundos; otro muestra una imagen congelada que se desvanece lentamente). Esto profundizaría la sensación de estar dialogando con fantasmas de tu propio pasado inmediato.
2. **Integración de detección de proximidad focal (Micro-respiración):**  
   Incorporar un filtro de análisis de alta frecuencia en el área del pecho o del rostro para detectar los ciclos sutiles de la respiración cuando el cuerpo está inmóvil. De este modo, la quietud no sería solo estática, sino que el ritmo respiratorio del usuario modularía la frecuencia de corte (*cutoff*) del susurro o el filtro de la atmósfera en tiempo real.

---

## 5. Cómo ejecutar el proyecto

No requiere instalación de Node.js ni paquetes externos:

1. Clona o descarga esta carpeta en tu computador.
2. Haz doble clic en el archivo [**`iniciar_servidor.bat`**](iniciar_servidor.bat) (inicia automáticamente un servidor local seguro en Windows en el puerto `8123` y abre el navegador).
3. Alternativamente, abre PowerShell en la carpeta y ejecuta:
   ```powershell
   py -m http.server 8123
   ```
4. Abre **http://localhost:8123** en Chrome o Edge.
5. Presiona el botón **`▶ Activar sonido`** en la esquina superior derecha para habilitar el motor de audio.
