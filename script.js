(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // ================= ESTADO GLOBAL =================
  const S = {
    src: "demo",
    view: "mix",
    cols: 3,
    rows: 3,
    showLines: true,
    thr: 28,
    sens: 0.03,
    cool: 1600, // tiempo de permanencia / cooldown
    vol: 0.8,
    tint: 0.28,
    veil: 0.15,
    mode: "zonas",
    lx: 0.5,
    nl: 3,
    segs: 7,
    sdur: 6,
    steps: 16,
    bright: 90,
    mapVel: true,
    mapPan: true,
    mirror: true,
    mapDir: false,
    invert: false
  };

  // Toast flotante
  let toastT = 0;
  function toast(msg) {
    const t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.hidden = true; }, 2800);
  }

  // Cronómetro de videollamada
  let callSeconds = 0;
  setInterval(() => {
    callSeconds++;
    const m = String(Math.floor(callSeconds / 60)).padStart(2, "0");
    const s = String(callSeconds % 60).padStart(2, "0");
    const el = $("callTimer");
    if (el) el.textContent = `${m}:${s}`;
  }, 1000);

  // ================= DOCK LATERAL =================
  document.querySelectorAll(".trigger").forEach((tr) => tr.addEventListener("click", () => {
    const id = tr.dataset.panel, open = tr.getAttribute("aria-expanded") === "true";
    document.querySelectorAll(".trigger").forEach((t) => {
      t.setAttribute("aria-expanded", "false");
      const p = $(t.dataset.panel);
      if (p) p.hidden = true;
    });
    if (!open) {
      tr.setAttribute("aria-expanded", "true");
      const p = $(id);
      if (p) p.hidden = false;
    }
  }));

  document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => {
    const p = b.closest(".panel");
    if (p) {
      p.hidden = true;
      const tr = document.querySelector(`[data-panel="${p.id}"]`);
      if (tr) tr.setAttribute("aria-expanded", "false");
    }
  }));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll("[data-close]").forEach((b) => {
        const p = b.closest(".panel");
        if (p && !p.hidden) b.click();
      });
    }
  });

  // ================= FUENTES DE VIDEO =================
  const video = document.createElement("video");
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  let stream = null;

  // Fuente de ejemplo sintética con "fantasmitas" que flotan y cruzan líneas
  const demo = document.createElement("canvas");
  demo.width = 640;
  demo.height = 360;
  const dctx = demo.getContext("2d");

  const fantasmitas = [
    { x: 90,  y: 120, vx: 55,  vy: 20, r: 24, phase: 0.0, color: "#8a2be2", lastC: -1, lastR: -1, crossedLines: {} },
    { x: 320, y: 190, vx: -50, vy: -25, r: 28, phase: 1.2, color: "#ff4500", lastC: -1, lastR: -1, crossedLines: {} },
    { x: 530, y: 140, vx: 60,  vy: 30, r: 22, phase: 2.5, color: "#8a2be2", lastC: -1, lastR: -1, crossedLines: {} },
    { x: 200, y: 270, vx: -40, vy: 35, r: 25, phase: 3.8, color: "#9a7bff", lastC: -1, lastR: -1, crossedLines: {} },
    { x: 440, y: 240, vx: 45,  vy: -35, r: 20, phase: 5.1, color: "#ff6633", lastC: -1, lastR: -1, crossedLines: {} }
  ];

  let demoTime = 0;

  function drawDemo(dt) {
    demoTime += dt;
    // Fondo de cuarto oscuro
    dctx.fillStyle = "#090a0e";
    dctx.fillRect(0, 0, 640, 360);

    // Gradiente espectral
    const grad = dctx.createLinearGradient(0, 0, 640, 360);
    grad.addColorStop(0, "rgba(45, 20, 75, 0.2)");
    grad.addColorStop(0.5, "rgba(15, 12, 28, 0.45)");
    grad.addColorStop(1, "rgba(8, 8, 12, 0.9)");
    dctx.fillStyle = grad;
    dctx.fillRect(0, 0, 640, 360);

    // Mover y dibujar fantasmitas
    const W = 640, H = 360;
    const cw = W / S.cols;
    const rh = H / S.rows;
    const now = performance.now();

    for (const f of fantasmitas) {
      f.phase += dt * 3.5;
      f.x += f.vx * dt;
      f.y += (f.vy + Math.sin(f.phase) * 22) * dt;

      // Rebotes suaves en los bordes
      if (f.x < 35) { f.x = 35; f.vx = Math.abs(f.vx); }
      if (f.x > W - 35) { f.x = W - 35; f.vx = -Math.abs(f.vx); }
      if (f.y < 35) { f.y = 35; f.vy = Math.abs(f.vy); }
      if (f.y > H - 35) { f.y = H - 35; f.vy = -Math.abs(f.vy); }

      // DETECTAR CAMBIO DE CUADRÍCULA (CRUCE DE LÍNEA DE CUADRADO)
      const curC = Math.min(S.cols - 1, Math.max(0, Math.floor(f.x / cw)));
      const curR = Math.min(S.rows - 1, Math.max(0, Math.floor(f.y / rh)));
      const k = curR * S.cols + curC;

      if (f.lastC !== -1 && (f.lastC !== curC || f.lastR !== curR)) {
        // ¡El fantasmita cruzó la línea y cambió de cuadrado!
        onCellEnter(curC, curR, k, now);
      }
      f.lastC = curC;
      f.lastR = curR;

      // DETECTAR CRUCE DE LÍNEAS FIJAS O MÚLTIPLES
      if (S.mode === "linea" || S.mode === "lineas") {
        const xs = lineXs();
        xs.forEach((lx, li) => {
          const lineX = lx * W;
          const prevSide = f.crossedLines[li];
          const curSide = f.x > lineX ? 1 : -1;
          if (prevSide !== undefined && prevSide !== curSide) {
            // ¡Cruzó la línea vertical!
            const s = Math.min(S.segs - 1, Math.max(0, Math.floor(f.y / (H / S.segs))));
            onLineCross(li, lx, s, curSide < 0, now);
          }
          f.crossedLines[li] = curSide;
        });
      }

      // Dibujar cuerpo etéreo del fantasmita
      dctx.save();
      dctx.shadowColor = f.color;
      dctx.shadowBlur = 18;

      // Cabeza redonda
      dctx.fillStyle = f.color;
      dctx.beginPath();
      dctx.arc(f.x, f.y - 6, f.r * 0.85, Math.PI, 0, false);

      // Falda/cola ondeante con curvas
      const tailY = f.y + f.r * 1.1;
      const wave = Math.sin(f.phase * 1.8) * 6;
      dctx.lineTo(f.x + f.r * 0.85, tailY);
      dctx.quadraticCurveTo(f.x + f.r * 0.4, tailY - wave, f.x, tailY);
      dctx.quadraticCurveTo(f.x - f.r * 0.4, tailY + wave, f.x - f.r * 0.85, tailY);
      dctx.closePath();
      dctx.fill();

      // Ojos brillantes
      dctx.fillStyle = "#ffffff";
      const eyeDx = f.vx > 0 ? 3 : -3;
      dctx.beginPath();
      dctx.arc(f.x - 7 + eyeDx, f.y - 6, 3, 0, Math.PI * 2);
      dctx.arc(f.x + 7 + eyeDx, f.y - 6, 3, 0, Math.PI * 2);
      dctx.fill();

      // Pupilas oscuras
      dctx.fillStyle = "#0a0a0c";
      dctx.beginPath();
      dctx.arc(f.x - 7 + eyeDx * 1.5, f.y - 6, 1.5, 0, Math.PI * 2);
      dctx.arc(f.x + 7 + eyeDx * 1.5, f.y - 6, 1.5, 0, Math.PI * 2);
      dctx.fill();

      dctx.restore();
    }
  }

  function setSrc(src, status) {
    S.src = src;
    prev = null;
    $("srcDemo").setAttribute("aria-pressed", String(src === "demo"));
    $("srcCam").setAttribute("aria-pressed", String(src === "cam" || src === "camoff"));
    $("srcFile").setAttribute("aria-pressed", String(src === "file"));
    $("camCtx").hidden = !(src === "cam" || src === "camoff");
    $("vidCtx").hidden = src !== "file";
    $("camOff").textContent = src === "camoff" ? "Encender cámara" : "Apagar cámara";
    toast(status);
  }

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  }

  async function startCam() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("sin API");
      stopStream();
      video.pause();
      video.removeAttribute("src");
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 }, audio: false });
      video.srcObject = stream;
      await video.play();
      setSrc("cam", "Cámara activa · Videollamada");
    } catch (e) {
      toast("Para usar la cámara, abre la página desde localhost o HTTPS");
    }
  }

  $("srcDemo").addEventListener("click", () => {
    stopStream();
    video.pause();
    setSrc("demo", "Fuente: Escena espectral sintética");
  });

  $("srcCam").addEventListener("click", startCam);

  $("camOff").addEventListener("click", () => {
    if (S.src === "cam") {
      stopStream();
      video.srcObject = null;
      setSrc("camoff", "Cámara apagada");
    } else {
      startCam();
    }
  });

  $("srcFile").addEventListener("click", () => $("fileInput").click());
  $("vChange").addEventListener("click", () => $("fileInput").click());

  $("fileInput").addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    stopStream();
    video.srcObject = null;
    video.src = URL.createObjectURL(f);
    video.loop = $("vLoop").getAttribute("aria-pressed") === "true";
    try { await video.play(); } catch (_) {}
    setSrc("file", "Video cargado: " + f.name);
    e.target.value = "";
  });

  $("vPlay").addEventListener("click", () => { video.play().catch(() => {}); });
  $("vPause").addEventListener("click", () => video.pause());
  $("vLoop").addEventListener("click", (e) => {
    video.loop = !video.loop;
    e.currentTarget.setAttribute("aria-pressed", String(video.loop));
    toast(video.loop ? "Loop activado" : "Loop desactivado");
  });

  // ================= CLONES Y VIDEOLLAMADA =================
  const cloneTiles = {
    susurro: $("tileSusurro"),
    puerta: $("tilePuerta"),
    pulso: $("tilePulso"),
    criatura: $("tileCriatura")
  };

  const cloneCanvases = {
    susurro: $("canvasSusurro"),
    puerta: $("canvasPuerta"),
    pulso: $("canvasPulso"),
    criatura: $("canvasCriatura")
  };

  const activeClones = new Set();
  const cloneActiveCount = { susurro: 0, puerta: 0, pulso: 0, criatura: 0 };

  function updateParticipantCount() {
    const count = 1 + activeClones.size;
    const grid = $("callGrid");
    if (grid) grid.setAttribute("data-count", String(count));
    const pCountEl = $("participantCount");
    if (pCountEl) pCountEl.textContent = `${count} de ${1 + Object.keys(cloneTiles).length}`;
  }

  function activateCloneTile(name, isOrange = false) {
    const tile = cloneTiles[name];
    if (!tile) return;
    tile.hidden = false;
    activeClones.add(name);
    updateParticipantCount();
    cloneActiveCount[name] = (cloneActiveCount[name] || 0) + 1;
    tile.classList.add(isOrange ? "speaking-orange" : "speaking");
  }

  function deactivateCloneTile(name) {
    cloneActiveCount[name] = Math.max(0, (cloneActiveCount[name] || 1) - 1);
    if (cloneActiveCount[name] === 0) {
      const tile = cloneTiles[name];
      if (tile) tile.classList.remove("speaking", "speaking-orange");
    }
  }

  // Botón para reiniciar llamada a 1 sola pantalla
  $("resetClonesBtn").addEventListener("click", () => {
    Object.values(cloneTiles).forEach((tile) => {
      tile.hidden = true;
      tile.classList.remove("speaking", "speaking-orange");
    });
    activeClones.clear();
    Object.keys(cloneActiveCount).forEach((k) => { cloneActiveCount[k] = 0; });
    updateParticipantCount();
    toast("Llamada reiniciada a 1 pantalla");
  });

  // ================= MOTOR DE AUDIO (POLIFÓNICO CON SUPERPOSICIÓN) =================
  let ac = null, master = null, recDest = null;
  const soundBuffers = {};
  let soundsLoaded = false;

  const SOUND_PATHS = {
    atmosfera: "sonidos/atmosfera.mp3",
    criatura: "sonidos/criatura.wav",
    susurro: "sonidos/mujersusurro.mp3",
    puerta: "sonidos/puerta.wav",
    pulso: "sonidos/pulso.wav"
  };

  let atmoSource = null;
  let atmoGain = null;

  async function loadAudioBuffer(key, path) {
    try {
      const res = await fetch(path);
      const arrayBuf = await res.arrayBuffer();
      const decoded = await ac.decodeAudioData(arrayBuf);
      soundBuffers[key] = decoded;
      return true;
    } catch (e) {
      console.warn("No se pudo cargar el audio:", path, e);
      return false;
    }
  }

  async function loadAllSounds() {
    const promises = Object.entries(SOUND_PATHS).map(([k, p]) => loadAudioBuffer(k, p));
    await Promise.all(promises);
    soundsLoaded = true;
    toast("Sonidos espectrales cargados");
  }

  function initAudio() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = S.vol;

    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;

    recDest = ac.createMediaStreamDestination();

    master.connect(comp);
    comp.connect(ac.destination);
    comp.connect(recDest);

    loadAllSounds().then(() => {
      startAtmosferaLoop();
    });
  }

  // Reproducir atmósfera de fondo continua
  function startAtmosferaLoop() {
    if (!ac || !soundBuffers.atmosfera) return;
    if (atmoSource) {
      try { atmoSource.stop(); } catch (_) {}
    }
    atmoSource = ac.createBufferSource();
    atmoSource.buffer = soundBuffers.atmosfera;
    atmoSource.loop = true;

    atmoGain = ac.createGain();
    atmoGain.gain.value = 0.22; // Volumen de fondo base

    atmoSource.connect(atmoGain);
    atmoGain.connect(master);
    atmoSource.start();
  }

  // Modular atmósfera ante movimientos rápidos
  function modulateAtmosfera(intensity) {
    if (!atmoGain || !ac || ac.state !== "running") return;
    const targetGain = S.mapVel ? Math.min(0.95, 0.22 + intensity * 2.8) : 0.45;
    atmoGain.gain.setTargetAtTime(targetGain, ac.currentTime, 0.12);
  }

  // Criatura (cambio brusco de luz; suena mucho más fuerte que el resto)
  let lastCriaturaTime = 0;
  let criaturaPlaying = false;
  function playCriatura() {
    if (!ac || ac.state !== "running" || !soundBuffers.criatura) return;
    const now = performance.now();
    if (now - lastCriaturaTime < 2800) return;
    lastCriaturaTime = now;
    criaturaPlaying = true;

    // Efecto visual de temblor en la llamada
    const grid = $("callGrid");
    if (grid) {
      grid.classList.add("criatura-active");
      setTimeout(() => grid.classList.remove("criatura-active"), 450);
    }

    // Ducking: atenuar temporalmente la atmósfera para que el rugido de la Criatura domine
    if (atmoGain && ac) {
      atmoGain.gain.cancelScheduledValues(ac.currentTime);
      atmoGain.gain.setTargetAtTime(0.06, ac.currentTime, 0.04);
      setTimeout(() => {
        if (atmoGain && ac && ac.state === "running") {
          atmoGain.gain.setTargetAtTime(0.22, ac.currentTime, 0.4);
        }
      }, 2200);
    }

    const src = ac.createBufferSource();
    src.buffer = soundBuffers.criatura;

    // GANANCIA DESTACADA: Suena significativamente más fuerte que el resto de los sonidos
    const g = ac.createGain();
    g.gain.value = Math.min(2.5, S.vol * 2.0);

    src.connect(g);
    g.connect(master);

    activateCloneTile("criatura");
    src.onended = () => {
      criaturaPlaying = false;
      deactivateCloneTile("criatura");
    };

    src.start();
    $("lastNote").textContent = "CRIATURA";
    $("lastEvent").textContent = "¡PRESENCIA BRUSCA!";
    $("lastZone").textContent = "Entorno global";
  }

  // REPRODUCIR SONIDOS POSICIONALES (POLIFONÍA: SE SUPERPONEN TODOS)
  function playPositionalSound(key, panValue, zoneLabel, isCenter = false, rate = 1.0) {
    if (!ac || ac.state !== "running" || !soundBuffers[key]) return;

    // Crea un nuevo nodo en cada disparo para permitir superposición simultánea
    const src = ac.createBufferSource();
    src.buffer = soundBuffers[key];
    src.playbackRate.value = rate;

    const panner = ac.createStereoPanner ? ac.createStereoPanner() : null;
    if (panner && S.mapPan) panner.pan.value = panValue;

    // Nivel equilibrado para no tapar a la Criatura cuando se active
    const g = ac.createGain();
    const currentVol = criaturaPlaying ? S.vol * 0.35 : S.vol * 0.65;
    g.gain.value = currentVol;

    if (panner) {
      src.connect(panner);
      panner.connect(g);
    } else {
      src.connect(g);
    }
    g.connect(master);

    activateCloneTile(key, isCenter);
    src.onended = () => {
      deactivateCloneTile(key);
    };

    src.start();

    // Actualizar lectura
    $("lastNote").textContent = key.toUpperCase();
    $("lastEvent").textContent = isCenter ? "Presencia en centro" : "Sombra / Cruce de línea";
    $("lastZone").textContent = zoneLabel;
    $("lastStill").textContent = "Activo";
  }

  const soundOn = () => ac && ac.state === "running";

  function updSoundBtn() {
    const on = soundOn();
    $("soundBtn").setAttribute("aria-pressed", String(on));
    $("soundBtn").textContent = on ? "■ Apagar sonido" : "▶ Activar sonido";
    $("recBtn").disabled = !on && !recording;
  }

  $("soundBtn").addEventListener("click", async () => {
    if (!ac) initAudio();
    try {
      if (ac.state === "running") {
        await ac.suspend();
      } else {
        await ac.resume();
        if (soundsLoaded && !atmoSource) startAtmosferaLoop();
      }
    } catch (_) {}
    updSoundBtn();
  });

  // ================= GRABACIÓN DE AUDIO =================
  let recorder = null, recording = false, recChunks = [], recBlob = null;
  function pickMime() {
    if (!window.MediaRecorder) return null;
    for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"]) {
      if (MediaRecorder.isTypeSupported(m)) return m;
    }
    return "";
  }

  $("recBtn").addEventListener("click", () => {
    if (!ac) return;
    const mime = pickMime();
    if (mime === null) {
      $("recHint").textContent = "Este navegador no permite grabar audio.";
      return;
    }
    if (!recording) {
      recChunks = [];
      recorder = new MediaRecorder(recDest.stream, mime ? { mimeType: mime } : undefined);
      recorder.ondataavailable = (e) => { if (e.data.size) recChunks.push(e.data); };
      recorder.onstop = () => {
        recBlob = new Blob(recChunks, { type: recorder.mimeType || "audio/webm" });
        $("recDl").disabled = false;
        $("recHint").textContent = "Grabación lista para descargar.";
        $("stRec").textContent = "lista";
      };
      recorder.start();
      recording = true;
      $("recBtn").setAttribute("aria-pressed", "true");
      $("recBtn").textContent = "■ Detener";
      $("stRec").textContent = "grabando";
    } else {
      recorder.stop();
      recording = false;
      $("recBtn").setAttribute("aria-pressed", "false");
      $("recBtn").textContent = "● Grabar";
    }
  });

  $("recDl").addEventListener("click", () => {
    if (!recBlob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(recBlob);
    a.download = "sesion-umbra-espectral.webm";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("Descargando grabación de sesión");
  });

  // ================= DETECCIÓN DINÁMICA POR CUADRÍCULAS Y LÍNEAS =================
  const PW = 128, PH = 72;
  const proc = document.createElement("canvas");
  proc.width = PW;
  proc.height = PH;
  const pctx = proc.getContext("2d", { willReadFrequently: true });

  let prev = null;
  const mask = new Uint8Array(PW * PH);

  // Arrays dinámicos según columnas y filas de cuadrículas
  let zoneStillTime = [], zoneAura = [], zoneBaseBright = [], zoneTriggered = [], zoneMotion = [], zoneFlash = [], zoneLastTrigger = [];

  function ensureGrid() {
    const total = S.cols * S.rows;
    if (zoneStillTime.length !== total) {
      zoneStillTime = new Array(total).fill(0);
      zoneAura = new Array(total).fill(0);
      zoneBaseBright = new Array(total).fill(120);
      zoneTriggered = new Array(total).fill(false);
      zoneMotion = new Array(total).fill(0);
      zoneFlash = new Array(total).fill(0);
      zoneLastTrigger = new Array(total).fill(0);
    }
  }
  ensureGrid();

  // Líneas del modo Línea y Líneas
  const MAXL = 4, MAXS = 12;
  const lEnergy = new Array(MAXL * MAXS).fill(0);
  const lFlash = new Array(MAXL * MAXS).fill(0);
  const lLast = new Array(MAXL * MAXS).fill(0);

  function lineXs() {
    if (S.mode === "linea") return [S.lx];
    const a = [];
    for (let i = 0; i < S.nl; i++) a.push((i + 1) / (S.nl + 1));
    return a;
  }

  // Disparo al entrar a una celda (por movimiento de fantasma o cámara)
  function onCellEnter(c, r, k, now) {
    if (now - (zoneLastTrigger[k] || 0) < 240) return; // breve debounce por celda
    zoneLastTrigger[k] = now;
    zoneFlash[k] = 1.0;

    const third = S.cols / 3;
    const isLeft = c < third;
    const isCenter = c >= third && c < third * 2;
    const isRight = c >= third * 2;

    const pan = S.mapPan ? (c / (S.cols - 1 || 1)) * 2 - 1 : 0;
    const pitchRate = 0.85 + ((S.rows - 1 - r) / (S.rows || 1)) * 0.35; // Altura determina tono

    if (isLeft) {
      playPositionalSound("susurro", Math.min(-0.3, pan), `Zona (${c + 1},${r + 1})`, false, pitchRate);
    } else if (isCenter) {
      playPositionalSound("puerta", pan * 0.4, `Zona (${c + 1},${r + 1})`, true, pitchRate);
    } else {
      playPositionalSound("pulso", Math.max(0.3, pan), `Zona (${c + 1},${r + 1})`, false, pitchRate);
    }
  }

  // Disparo al cruzar una línea vertical
  function onLineCross(li, lx, s, goingLeft, now) {
    const k = li * MAXS + s;
    if (now - (lLast[k] || 0) < 240) return;
    lLast[k] = now;
    lFlash[k] = 1.0;

    const pan = S.mapPan ? lx * 2 - 1 : 0;
    let pitchRate = 0.8 + ((S.segs - 1 - s) / S.segs) * 0.45;
    if (S.mapDir && goingLeft) pitchRate *= 0.5; // Dirección izquierda suena más grave (octava abajo)

    const isLeft = lx < 0.38;
    const isCenter = lx >= 0.38 && lx <= 0.62;

    if (isLeft) {
      playPositionalSound("susurro", Math.min(-0.35, pan), `Línea ${li + 1} · T${s + 1}`, false, pitchRate);
    } else if (isCenter) {
      playPositionalSound("puerta", 0.0, `Línea ${li + 1} · T${s + 1}`, true, pitchRate);
    } else {
      playPositionalSound("pulso", Math.max(0.35, pan), `Línea ${li + 1} · T${s + 1}`, false, pitchRate);
    }
  }

  function activeSource() {
    return S.src === "demo" ? demo : (S.src === "cam" || S.src === "file") && video.readyState >= 2 ? video : null;
  }

  let prevGlobalBrightness = 120;

  function analyse(now, dt) {
    const src = activeSource();
    if (!src) return;

    pctx.save();
    if (S.src === "cam" && S.mirror) {
      pctx.translate(PW, 0);
      pctx.scale(-1, 1);
    }
    pctx.drawImage(src, 0, 0, PW, PH);
    pctx.restore();

    const imgData = pctx.getImageData(0, 0, PW, PH).data;
    const gray = new Uint8Array(PW * PH);
    let totalLuma = 0;

    for (let i = 0, j = 0; i < gray.length; i++, j += 4) {
      const g = (imgData[j] * 0.3 + imgData[j + 1] * 0.59 + imgData[j + 2] * 0.11) | 0;
      gray[i] = g;
      totalLuma += g;
    }

    const currentGlobalBrightness = totalLuma / gray.length;

    // DETECCIÓN CRIATURA: Cambio brusco de luz
    if (prev) {
      const brightnessDiff = Math.abs(currentGlobalBrightness - prevGlobalBrightness);
      if (brightnessDiff > 32) {
        playCriatura();
      }
    }
    prevGlobalBrightness = currentGlobalBrightness;

    ensureGrid();
    const total = S.cols * S.rows;
    let changedPixels = 0;
    const counts = new Array(total).fill(0);
    const zoneLumas = new Array(total).fill(0);
    const cellW = PW / S.cols;
    const cellH = PH / S.rows;
    const zonePixelCount = cellW * cellH;

    if (prev) {
      for (let i = 0; i < gray.length; i++) {
        const df = Math.abs(gray[i] - prev[i]);
        if (df > S.thr) {
          mask[i] = df;
          changedPixels++;
        } else {
          mask[i] = 0;
        }

        const y = Math.floor(i / PW);
        const x = i % PW;
        const col = Math.min(S.cols - 1, Math.floor(x / cellW));
        const row = Math.min(S.rows - 1, Math.floor(y / cellH));
        const zIdx = row * S.cols + col;

        if (mask[i]) counts[zIdx]++;
        zoneLumas[zIdx] += gray[i];
      }
    }

    const globalMotion = changedPixels / (PW * PH);

    // Modular atmósfera ante movimientos rápidos
    if (globalMotion > 0.08) {
      modulateAtmosfera(globalMotion);
    } else {
      modulateAtmosfera(0);
    }

    // SI ESTÁ EN MODO LÍNEA O LÍNEAS: Detección óptica sobre las líneas
    if ((S.mode === "linea" || S.mode === "lineas") && prev) {
      const xs = lineXs(), segH = PH / S.segs;
      xs.forEach((lx, li) => {
        const px = Math.min(PW - 2, Math.max(1, Math.round(lx * PW)));
        for (let s = 0; s < S.segs; s++) {
          const y0 = Math.floor(s * segH), y1 = Math.max(y0 + 1, Math.floor((s + 1) * segH)), k = li * MAXS + s;
          let n = 0;
          for (let y = y0; y < y1; y++) {
            for (let x = px - 1; x <= px + 1; x++) if (mask[y * PW + x]) n++;
          }
          lEnergy[k] = lEnergy[k] * 0.4 + (n / (3 * (y1 - y0))) * 0.6;
          if (lEnergy[k] > S.sens && now - (lLast[k] || 0) > 280) {
            onLineCross(li, lx, s, false, now);
          }
        }
      });
    }

    // ANÁLISIS DE CUADRÍCULA: QUIETUD, SOMBRA Y CRUCE DE CUADRADOS
    const targetStillTime = S.cool / 1000;

    for (let r = 0; r < S.rows; r++) {
      for (let c = 0; c < S.cols; c++) {
        const k = r * S.cols + c;
        const avgLuma = zoneLumas[k] / Math.max(1, zonePixelCount);
        const motionFraction = counts[k] / Math.max(1, zonePixelCount);

        zoneMotion[k] = (zoneMotion[k] || 0) * 0.6 + motionFraction * 0.4;

        if (!zoneBaseBright[k] || zoneBaseBright[k] === 120) zoneBaseBright[k] = avgLuma;
        zoneBaseBright[k] = zoneBaseBright[k] * 0.995 + avgLuma * 0.005;

        // Disparo por movimiento brusco que entra a la celda
        if (motionFraction > S.sens * 1.8 && now - (zoneLastTrigger[k] || 0) > 300) {
          onCellEnter(c, r, k, now);
        }

        // Detección de quietud y permanencia
        const isDarkened = avgLuma < zoneBaseBright[k] - 12;
        const isStill = zoneMotion[k] < (S.sens * 1.5);
        const hasPresence = isDarkened || (zoneMotion[k] > 0.01 && isStill);

        if (hasPresence) {
          zoneStillTime[k] = (zoneStillTime[k] || 0) + dt;
          zoneAura[k] = Math.min(1.0, zoneStillTime[k] / targetStillTime);

          if (zoneStillTime[k] >= targetStillTime && !zoneTriggered[k]) {
            zoneTriggered[k] = true;
            onCellEnter(c, r, k, now);
          }
        } else {
          zoneStillTime[k] = Math.max(0, (zoneStillTime[k] || 0) - dt * 2.5);
          zoneAura[k] = zoneStillTime[k] / targetStillTime;
          if (zoneStillTime[k] <= 0.1) {
            zoneTriggered[k] = false;
          }
        }
      }
    }

    prev = gray;
  }

  // ================= DIBUJO EN CANVAS Y CLONES =================
  const view = $("view");
  const vctx = view.getContext("2d");
  const maskC = document.createElement("canvas");
  maskC.width = PW;
  maskC.height = PH;
  const mctx = maskC.getContext("2d");
  const mimg = mctx.createImageData(PW, PH);

  function fitCanvas(c) {
    if (!c) return 1;
    const r = c.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    return dpr;
  }

  function drawView(dt) {
    fitCanvas(view);
    const W = view.width, H = view.height;
    vctx.fillStyle = "#0a0a0c";
    vctx.fillRect(0, 0, W, H);

    const src = activeSource();
    if (!src) return;

    // 1. Dibujar video o máscara de máquina
    if (S.view === "mask") {
      for (let i = 0; i < PW * PH; i++) {
        const j = i * 4, m = mask[i];
        if (m) {
          mimg.data[j] = 138;
          mimg.data[j + 1] = 43;
          mimg.data[j + 2] = 226;
          mimg.data[j + 3] = 220;
        } else {
          mimg.data[j] = 10;
          mimg.data[j + 1] = 10;
          mimg.data[j + 2] = 14;
          mimg.data[j + 3] = 255;
        }
      }
      mctx.putImageData(mimg, 0, 0);
      vctx.imageSmoothingEnabled = false;
      vctx.drawImage(maskC, 0, 0, W, H);
      vctx.imageSmoothingEnabled = true;
    } else {
      vctx.save();
      if (S.src === "cam" && S.mirror) {
        vctx.translate(W, 0);
        vctx.scale(-1, 1);
      }
      vctx.drawImage(src, 0, 0, W, H);
      vctx.restore();

      if (S.veil > 0) {
        vctx.fillStyle = `rgba(10, 10, 12, ${S.veil})`;
        vctx.fillRect(0, 0, W, H);
      }
    }

    // 2. DIBUJAR LÍNEAS DE CUADRÍCULA Y AURAS
    const cw = W / S.cols;
    const ch = H / S.rows;

    for (let r = 0; r < S.rows; r++) {
      for (let c = 0; c < S.cols; c++) {
        const k = r * S.cols + c;
        const x = c * cw;
        const y = r * ch;

        // Dibujar bordes de las cuadrículas
        if (S.showLines || S.mode === "zonas") {
          const third = S.cols / 3;
          const isCenter = c >= third && c < third * 2;
          vctx.strokeStyle = isCenter ? "rgba(255, 69, 0, 0.28)" : "rgba(138, 43, 226, 0.28)";
          vctx.lineWidth = 1;
          vctx.strokeRect(x, y, cw, ch);
        }

        // Destello breve cuando un fantasma entra/cruza el cuadrado
        if (zoneFlash[k] > 0.05) {
          vctx.fillStyle = `rgba(138, 43, 226, ${zoneFlash[k] * 0.25})`;
          vctx.fillRect(x, y, cw, ch);
          zoneFlash[k] = Math.max(0, zoneFlash[k] - dt * 2.8);
        }

        // Auras con resplandor por quietud acumulada
        const aura = zoneAura[k] || 0;
        if (aura > 0.05) {
          vctx.save();
          const third = S.cols / 3;
          const isCenter = c >= third && c < third * 2;
          const colorHex = isCenter ? "#ff4500" : "#8a2be2";
          const rgbaFill = isCenter ? `rgba(255, 69, 0, ${aura * 0.35})` : `rgba(138, 43, 226, ${aura * 0.35})`;

          vctx.fillStyle = rgbaFill;
          vctx.fillRect(x + 3, y + 3, cw - 6, ch - 6);

          vctx.strokeStyle = colorHex;
          vctx.shadowColor = colorHex;
          vctx.shadowBlur = 18 * aura;
          vctx.lineWidth = 2 + aura * 3;
          vctx.strokeRect(x + 3, y + 3, cw - 6, ch - 6);

          vctx.fillStyle = "#ffffff";
          vctx.font = "9px 'Space Mono', monospace";
          vctx.fillText(`quietud: ${Math.round(aura * 100)}%`, x + 8, y + 18);
          vctx.restore();
        }
      }
    }

    // 3. DIBUJAR LÍNEAS VERTICALES DE DISPARO (MODOS LÍNEA Y LÍNEAS)
    if (S.mode === "linea" || S.mode === "lineas") {
      const xs = lineXs(), segH = H / S.segs;
      xs.forEach((lx, li) => {
        const x = Math.round(lx * W) + 0.5;
        const isCenter = lx >= 0.38 && lx <= 0.62;
        const color = isCenter ? "#ff4500" : "#8a2be2";

        // Línea principal
        vctx.save();
        vctx.strokeStyle = color;
        vctx.lineWidth = 1.5;
        vctx.beginPath();
        vctx.moveTo(x, 0);
        vctx.lineTo(x, H);
        vctx.stroke();

        // Ticks de tramos
        vctx.lineWidth = 1;
        vctx.strokeStyle = "rgba(238, 240, 255, 0.4)";
        for (let s = 1; s < S.segs; s++) {
          const y = Math.round(s * segH) + 0.5;
          vctx.beginPath();
          vctx.moveTo(x - 6, y);
          vctx.lineTo(x + 6, y);
          vctx.stroke();
        }

        // Tramos activos resplandecientes al cruzar
        for (let s = 0; s < S.segs; s++) {
          const k = li * MAXS + s;
          const f = lFlash[k] || 0;
          if (f > 0.05) {
            vctx.strokeStyle = color;
            vctx.shadowColor = color;
            vctx.shadowBlur = 15 * f;
            vctx.lineWidth = 4;
            vctx.beginPath();
            vctx.moveTo(x, s * segH);
            vctx.lineTo(x, (s + 1) * segH);
            vctx.stroke();
            lFlash[k] = Math.max(0, lFlash[k] - dt * 2.5);
          }
        }
        vctx.restore();
      });
    }

    // 4. RENDERIZAR CLONES ESPECTRALES EN SUS CUADROS DE VIDEOLLAMADA
    for (const name of activeClones) {
      const cCanvas = cloneCanvases[name];
      if (cCanvas && !cloneTiles[name].hidden) {
        fitCanvas(cCanvas);
        const ctx = cCanvas.getContext("2d");
        ctx.save();
        if (S.src === "cam" && S.mirror) {
          ctx.translate(cCanvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(src, 0, 0, cCanvas.width, cCanvas.height);
        ctx.restore();

        ctx.fillStyle = name === "puerta" ? "rgba(255, 69, 0, 0.12)" : "rgba(138, 43, 226, 0.12)";
        ctx.fillRect(0, 0, cCanvas.width, cCanvas.height);
      }
    }
  }

  // ================= PANTALLA COMPLETA =================
  $("fsBtn").addEventListener("click", () => {
    const stage = $("stage");
    if (!document.fullscreenElement) {
      stage.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // ================= CONTROLES DE PANELES ACTIVOS =================
  function setMode(m) {
    S.mode = m;
    prev = null;
    lEnergy.fill(0);
    lFlash.fill(0);
    document.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.mode === m)));
    document.querySelectorAll("#pMode [data-show]").forEach((el) => {
      el.hidden = !el.dataset.show.split(" ").includes(m);
    });
    $("stMode").textContent = m === "zonas" ? `zonas ${S.cols}×${S.rows}` : m;
  }

  document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

  // Panel 02: Visualización
  document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach((x) => x.setAttribute("aria-pressed", "false"));
    b.setAttribute("aria-pressed", "true");
    S.view = b.dataset.view;
    $("stVis").textContent = S.view;
  }));

  function bindRange(id, outId, key, fmt, onChange) {
    const el = $(id), out = $(outId);
    if (!el || !out) return;
    el.addEventListener("input", () => {
      const v = parseFloat(el.value);
      S[key] = v;
      out.textContent = fmt ? fmt(v) : v;
      if (onChange) onChange(v);
    });
  }

  // Sliders de cuadrícula y líneas
  bindRange("cols", "colsOut", "cols", (v) => v, () => {
    ensureGrid();
    $("stMode").textContent = `zonas ${S.cols}×${S.rows}`;
  });
  bindRange("rows", "rowsOut", "rows", (v) => v, () => {
    ensureGrid();
    $("stMode").textContent = `zonas ${S.cols}×${S.rows}`;
  });
  bindRange("lx", "lxOut", "lx", (v) => v + " %", (v) => { S.lx = v / 100; });
  bindRange("nl", "nlOut", "nl");
  bindRange("segs", "segsOut", "segs");

  bindRange("tint", "tintOut", "tint", (v) => v + " %");
  bindRange("veil", "veilOut", "veil", (v) => v + " %");
  bindRange("thr", "thrOut", "thr");
  bindRange("sens", "sensOut", "sens", (v) => v + " %");
  bindRange("cool", "coolOut", "cool", (v) => (v / 1000).toFixed(1) + " s");

  if ($("showLines")) $("showLines").addEventListener("change", (e) => { S.showLines = e.target.checked; });
  if ($("mapDir")) $("mapDir").addEventListener("change", (e) => { S.mapDir = e.target.checked; });
  if ($("mapVel")) $("mapVel").addEventListener("change", (e) => { S.mapVel = e.target.checked; });
  if ($("mapPan")) $("mapPan").addEventListener("change", (e) => { S.mapPan = e.target.checked; });
  if ($("mirror")) $("mirror").addEventListener("change", (e) => { S.mirror = e.target.checked; });

  setMode("zonas");

  // ================= BUCLE PRINCIPAL (ANIMACIÓN) =================
  let lastT = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;

    if (S.src === "demo") {
      drawDemo(dt);
    }

    analyse(now, dt);
    drawView(dt);
  }

  requestAnimationFrame(loop);
})();
