"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const DEFAULT_SCRIPT =
  "Bem-vindo ao Grave e Leia! Escreva ou cole aqui o seu roteiro. " +
  "Ajuste a velocidade e o tamanho da fonte nas configuracoes ao lado. " +
  "Quando estiver pronto, aperte o botao vermelho para gravar.";

function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function formatTime(totalSeconds) {
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor(totalSeconds / 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Teleprompter({ scriptText, setScriptText, settings, setSettings }) {
  const [editing, setEditing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [ready, setReady] = useState(false);
  const [followDevice, setFollowDevice] = useState(true);
  const [showPrompter, setShowPrompter] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // fundo (video ou imagem) usado durante a gravacao
  const [backgroundMode, setBackgroundMode] = useState("none"); // none | video | image
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundMuted, setBackgroundMuted] = useState(true);
  const [backgroundVolume, setBackgroundVolume] = useState(80);

  const videoRef = useRef(null);
  const videoBackRef = useRef(null);
  const videoFrontRef = useRef(null);
  const bgVideoRef = useRef(null);
  const bgImageRef = useRef(null);
  const canvasRef = useRef(null);
  const promptRef = useRef(null);
  const stageRef = useRef(null);

  const streamRef = useRef(null);
  const backStreamRef = useRef(null);
  const frontStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const rafRef = useRef(null);
  const clockRef = useRef(0);
  const lastTsRef = useRef(0);
  const recordStartRef = useRef(0);
  const timerIntervalRef = useRef(null);

  const hasBackground = backgroundMode !== "none" && backgroundUrl;
  const needsCanvas = settings.presentation || settings.animatedText || hasBackground;

  const stopAllTracks = () => {
    [streamRef, backStreamRef, frontStreamRef].forEach((r) => {
      r.current?.getTracks().forEach((t) => t.stop());
      r.current = null;
    });
  };

  // ------- Segue a rotacao fisica do celular -------
  useEffect(() => {
    if (!followDevice) return;

    const applyOrientation = () => {
      const isPortrait =
        typeof window !== "undefined" && window.matchMedia
          ? window.matchMedia("(orientation: portrait)").matches
          : true;
      setSettings((s) => ({
        ...s,
        orientation: isPortrait ? "vertical" : "horizontal",
      }));
    };

    applyOrientation();

    const mql =
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(orientation: portrait)")
        : null;

    mql?.addEventListener?.("change", applyOrientation);
    window.addEventListener("resize", applyOrientation);

    return () => {
      mql?.removeEventListener?.("change", applyOrientation);
      window.removeEventListener("resize", applyOrientation);
    };
  }, [followDevice, setSettings]);

  // ------- Camera(s) -------
  const initCamera = useCallback(async () => {
    setCameraError("");
    stopAllTracks();
    try {
      if (settings.presentation) {
        // Traseira = fundo (tela toda) | Frontal = quadrado pequeno
        const back = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        const front = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "user" } },
          audio: true,
        });
        backStreamRef.current = back;
        frontStreamRef.current = front;
        if (videoBackRef.current) videoBackRef.current.srcObject = back;
        if (videoFrontRef.current) videoFrontRef.current.srcObject = front;
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: settings.facing } },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      }
      setReady(true);
    } catch (err) {
      setReady(false);
      if (settings.presentation) {
        setCameraError(
          "Nao foi possivel abrir as duas cameras ao mesmo tempo neste aparelho/navegador. Desative o modo apresentacao ou tente outro navegador."
        );
      } else {
        setCameraError("Nao foi possivel acessar a camera/microfone. Verifique as permissoes do navegador.");
      }
    }
  }, [settings.presentation, settings.facing]);

  useEffect(() => {
    initCamera();
    return () => stopAllTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initCamera]);

  // ------- Upload de fundo (video ou imagem) -------
  const handleBackgroundUpload = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBackgroundUrl(url);
    if (file.type.startsWith("video/")) {
      setBackgroundMode("video");
    } else if (file.type.startsWith("image/")) {
      setBackgroundMode("image");
    }
  };

  const clearBackground = () => {
    setBackgroundMode("none");
    setBackgroundUrl("");
  };

  // aplica mudo/volume no elemento de video de fundo
  useEffect(() => {
    if (bgVideoRef.current) {
      bgVideoRef.current.muted = backgroundMuted;
      bgVideoRef.current.volume = backgroundVolume / 100;
    }
  }, [backgroundMuted, backgroundVolume, backgroundUrl]);

  // toca/pausa o video de fundo junto com o "Testar leitura" / gravacao
  useEffect(() => {
    const v = bgVideoRef.current;
    if (!v || backgroundMode !== "video") return;
    if (playing) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [playing, backgroundMode]);

  // ------- Timer de gravacao -------
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - recordStartRef.current) / 1000));
      }, 500);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isRecording, isPaused]);

  // ------- Loop principal: rolagem do texto + desenho do canvas -------
  useEffect(() => {
    const words = scriptText.trim().length ? scriptText.trim().split(/\s+/) : [];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    const step = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      if (playing) clockRef.current += dt;

      if (promptRef.current) {
        const pxPerSecond = 18 + settings.speed * 14;
        const offset = clockRef.current * pxPerSecond;
        promptRef.current.style.transform = `translateY(-${offset}px)`;
      }

      if (needsCanvas && ctx && canvas) {
        const W = canvas.width;
        const H = canvas.height;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);

        const drawCover = (media, dx, dy, dw, dh, radius = 0) => {
          if (!media) return;
          const isVideoEl = media.tagName === "VIDEO";
          if (isVideoEl && media.readyState < 2) return;
          const mw = isVideoEl ? media.videoWidth : media.naturalWidth;
          const mh = isVideoEl ? media.videoHeight : media.naturalHeight;
          if (!mw || !mh) return;
          const scale = Math.max(dw / mw, dh / mh);
          const sw = dw / scale;
          const sh = dh / scale;
          const sx = (mw - sw) / 2;
          const sy = (mh - sh) / 2;
          ctx.save();
          if (radius) {
            ctx.beginPath();
            ctx.moveTo(dx + radius, dy);
            ctx.arcTo(dx + dw, dy, dx + dw, dy + dh, radius);
            ctx.arcTo(dx + dw, dy + dh, dx, dy + dh, radius);
            ctx.arcTo(dx, dy + dh, dx, dy, radius);
            ctx.arcTo(dx, dy, dx + dw, dy, radius);
            ctx.closePath();
            ctx.clip();
          }
          ctx.drawImage(media, sx, sy, sw, sh, dx, dy, dw, dh);
          ctx.restore();
        };

        if (settings.presentation) {
          // fundo = camera traseira / quadrado pequeno = camera frontal
          drawCover(videoBackRef.current, 0, 0, W, H);
          const pipW = W * 0.32;
          const pipH = pipW * (16 / 9);
          const margin = 24;
          ctx.save();
          ctx.strokeStyle = "#FFB020";
          ctx.lineWidth = 4;
          drawCover(videoFrontRef.current, W - pipW - margin, margin, pipW, pipH, 16);
          ctx.strokeRect(W - pipW - margin, margin, pipW, pipH);
          ctx.restore();
        } else if (hasBackground) {
          // fundo = video/imagem enviada / quadrado pequeno = sua camera
          const bgEl = backgroundMode === "video" ? bgVideoRef.current : bgImageRef.current;
          drawCover(bgEl, 0, 0, W, H);

          const pipW = W * 0.34;
          const pipH = pipW * (16 / 9);
          const margin = 24;
          ctx.save();
          ctx.strokeStyle = "#3DDC97";
          ctx.lineWidth = 4;
          drawCover(videoRef.current, W - pipW - margin, H - pipH - margin, pipW, pipH, 16);
          ctx.strokeRect(W - pipW - margin, H - pipH - margin, pipW, pipH);
          ctx.restore();
        } else {
          drawCover(videoRef.current, 0, 0, W, H);
        }

        if (settings.animatedText && words.length) {
          const wordsPerSecond = 1.6 + settings.speed * 0.9;
          const idx = Math.floor(clockRef.current * wordsPerSecond) % words.length;
          const windowSize = 7;
          const start = Math.max(0, idx - 2);
          const visible = words.slice(start, start + windowSize);

          const fontPx = Math.round(H * 0.045);
          ctx.font = `700 ${fontPx}px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const lines = wrapCanvasText(ctx, visible.join(" "), W * 0.86);
          const boxH = lines.length * (fontPx + 10) + 40;
          const boxY = H - boxH - H * 0.06;

          ctx.fillStyle = "rgba(10,11,13,0.55)";
          ctx.fillRect(W * 0.05, boxY, W * 0.9, boxH);

          let y = boxY + 30 + fontPx / 2;
          const hue = (clockRef.current * 60) % 360;
          lines.forEach((line) => {
            const lineWords = line.split(" ");
            let totalWidth = ctx.measureText(line).width;
            let x = W / 2 - totalWidth / 2;
            ctx.textAlign = "left";
            lineWords.forEach((w, i) => {
              const globalIdx = start + visible.join(" ").split(" ").indexOf(w, i);
              const isCurrent = w === words[idx] && Math.abs(globalIdx - idx) <= 0;
              ctx.fillStyle = isCurrent ? `hsl(${hue}, 90%, 60%)` : "#F4F1EA";
              const wWidth = ctx.measureText(w + " ").width;
              ctx.fillText(w, x, y);
              x += wWidth;
            });
            y += fontPx + 10;
          });
          ctx.textAlign = "center";
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, settings, scriptText, needsCanvas, hasBackground, backgroundMode]);

  const resetScroll = () => {
    clockRef.current = 0;
    if (promptRef.current) promptRef.current.style.transform = "translate(0,0)";
  };

  const pickMimeType = () => {
    const options = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    return options.find((o) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(o)) || "";
  };

  const getRecordingStream = () => {
    if (needsCanvas) {
      const canvasStream = canvasRef.current.captureStream(30);
      const audioSource = settings.presentation ? frontStreamRef.current : streamRef.current;
      const audioTrack = audioSource?.getAudioTracks?.()[0];
      if (audioTrack) canvasStream.addTrack(audioTrack);
      return canvasStream;
    }
    return streamRef.current;
  };

  const startRecording = () => {
    setDownloadUrl("");
    resetScroll();
    const stream = getRecordingStream();
    if (!stream) {
      setCameraError("Camera ainda nao esta pronta.");
      return;
    }
    const mimeType = pickMimeType();
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
      setDownloadUrl(URL.createObjectURL(blob));
    };
    recorder.start(250);
    recorderRef.current = recorder;
    recordStartRef.current = Date.now();
    setElapsed(0);
    setIsRecording(true);
    setIsPaused(false);
    setPlaying(true);
  };

  const togglePause = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (isPaused) {
      recorder.resume();
      setIsPaused(false);
      setPlaying(true);
      recordStartRef.current = Date.now() - elapsed * 1000;
    } else {
      recorder.pause();
      setIsPaused(true);
      setPlaying(false);
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
    setIsPaused(false);
    setPlaying(false);
  };

  const isVertical = settings.orientation === "vertical";
  const mediaAspect = isVertical ? "9 / 16" : "16 / 9";
  const canvasSize = isVertical ? { w: 720, h: 1280 } : { w: 1280, h: 720 };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 20 }} className="studio-grid">
      {/* PALCO */}
      <div>
        <div
          ref={stageRef}
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: isVertical ? "column" : "row",
            maxHeight: "72vh",
            maxWidth: isVertical ? 420 : "100%",
            margin: "0 auto",
            background: "#000",
          }}
        >
          {/* AREA DO TEXTO (teleprompter) */}
          {!editing && showPrompter && (
            <div
              style={{
                flex: isVertical ? "0 0 30%" : "0 0 32%",
                minHeight: isVertical ? 140 : "auto",
                minWidth: isVertical ? "auto" : 220,
                background: "linear-gradient(180deg, #14161A 0%, #0A0B0D 100%)",
                borderBottom: isVertical ? "1px solid var(--line)" : "none",
                borderRight: isVertical ? "none" : "1px solid var(--line)",
                overflow: "hidden",
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
              }}
            >
              <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                <div
                  ref={promptRef}
                  style={{
                    padding: "20px 18px",
                    color: "#fff",
                    fontSize: settings.fontSize,
                    lineHeight: 1.4,
                    fontWeight: 600,
                    textShadow: "0 2px 10px rgba(0,0,0,0.6)",
                  }}
                >
                  {scriptText || DEFAULT_SCRIPT}
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 40,
                  background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
                  pointerEvents: "none",
                }}
              />
            </div>
          )}

          {/* AREA DA CAMERA / GRAVACAO */}
          <div
            style={{
              flex: 1,
              position: "relative",
              aspectRatio: editing ? "auto" : mediaAspect,
              minHeight: 0,
              background: "#000",
            }}
          >
            {!ready && !cameraError && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted)",
                  fontSize: 14,
                  zIndex: 2,
                }}
              >
                Carregando camera...
              </div>
            )}

            {needsCanvas ? (
              <canvas ref={canvasRef} width={canvasSize.w} height={canvasSize.h} style={{ width: "100%", height: "100%", display: "block" }} />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            )}

            {/* fonte oculta da camera quando ela e usada so como PIP sobre um fundo */}
            {!settings.presentation && hasBackground && (
              <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
                <video ref={videoRef} autoPlay playsInline muted />
              </div>
            )}

            {/* elementos ocultos usados como fonte para o canvas no modo apresentacao */}
            {settings.presentation && (
              <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
                <video ref={videoBackRef} autoPlay playsInline muted />
                <video ref={videoFrontRef} autoPlay playsInline muted />
              </div>
            )}

            {/* fonte oculta do fundo (video ou imagem enviados) */}
            {hasBackground && (
              <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
                {backgroundMode === "video" ? (
                  <video ref={bgVideoRef} src={backgroundUrl} loop playsInline />
                ) : (
                  <img ref={bgImageRef} src={backgroundUrl} alt="" />
                )}
              </div>
            )}

            {editing && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(10,11,13,0.92)", padding: 20 }}>
                <textarea
                  className="input"
                  style={{ height: "100%", resize: "none", fontSize: 16, lineHeight: 1.5 }}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Escreva o seu roteiro aqui..."
                  autoFocus
                />
              </div>
            )}

            {isRecording && (
              <div style={{ position: "absolute", top: 16, left: 16, display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.55)", padding: "6px 12px", borderRadius: 999 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--rec)", animation: isPaused ? "none" : "pulse 1s infinite" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#fff" }}>
                  {isPaused ? "PAUSADO" : "GRAVANDO"} · {formatTime(elapsed)}
                </span>
              </div>
            )}
          </div>
        </div>

        {cameraError && (
          <p style={{ color: "var(--rec)", fontSize: 13, marginTop: 10 }}>{cameraError}</p>
        )}

        {/* controles */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", marginTop: 18, flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={() => setEditing((v) => !v)}>
            {editing ? "Ver teleprompter" : "Editar texto"}
          </button>

          <button className="btn btn-secondary" onClick={() => setShowPrompter((v) => !v)}>
            {showPrompter ? "🙈 Ocultar teleprompter" : "👁 Ativar teleprompter"}
          </button>

          {!isRecording && (
            <button className="btn btn-secondary" onClick={() => setPlaying((v) => !v)}>
              {playing ? "⏸ Pausar leitura" : "▶ Testar leitura"}
            </button>
          )}

          {!isRecording ? (
            <button className="btn btn-primary" onClick={startRecording} disabled={!ready}>
              ● Gravar
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={togglePause}>
                {isPaused ? "▶ Retomar" : "⏸ Pausar"}
              </button>
              <button className="btn btn-primary" onClick={stopRecording}>
                ■ Parar
              </button>
            </>
          )}

          <button className="btn btn-ghost" onClick={resetScroll}>↺ Reiniciar texto</button>
        </div>

        {downloadUrl && (
          <div className="card" style={{ marginTop: 18 }}>
            <p style={{ margin: "0 0 10px", fontSize: 14, color: "var(--muted)" }}>Gravacao pronta:</p>
            <video src={downloadUrl} controls style={{ width: "100%", borderRadius: 10, marginBottom: 12 }} />
            <a href={downloadUrl} download="grave-e-leia.webm" className="btn btn-primary btn-block">
              Baixar video
            </a>
          </div>
        )}

        <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.25 } }`}</style>
      </div>

      {/* ABA DE GRAVACAO / CONFIGURACOES */}
      <div className="card" style={{ alignSelf: "start" }}>
        <span className="eyebrow">Aba de gravacao</span>
        <h3 style={{ margin: "10px 0 18px" }}>Configuracoes</h3>

        <div className="card" style={{ background: "var(--panel-2)", marginBottom: 18, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: 14 }}>Girar com o celular</strong>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>
                A orientacao muda automaticamente ao rotacionar o aparelho
              </p>
            </div>
            <Switch checked={followDevice} onChange={setFollowDevice} />
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label>Orientacao{followDevice ? " (automatica)" : ""}</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={settings.orientation === "vertical" ? "btn btn-primary" : "btn btn-secondary"}
              style={{ flex: 1, padding: "10px" }}
              disabled={followDevice}
              onClick={() => setSettings((s) => ({ ...s, orientation: "vertical" }))}
            >
              Vertical
            </button>
            <button
              className={settings.orientation === "horizontal" ? "btn btn-primary" : "btn btn-secondary"}
              style={{ flex: 1, padding: "10px" }}
              disabled={followDevice}
              onClick={() => setSettings((s) => ({ ...s, orientation: "horizontal" }))}
            >
              Horizontal
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label>Camera</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={settings.facing === "user" ? "btn btn-primary" : "btn btn-secondary"}
              style={{ flex: 1, padding: "10px" }}
              disabled={settings.presentation}
              onClick={() => setSettings((s) => ({ ...s, facing: "user" }))}
            >
              Frontal
            </button>
            <button
              className={settings.facing === "environment" ? "btn btn-primary" : "btn btn-secondary"}
              style={{ flex: 1, padding: "10px" }}
              disabled={settings.presentation}
              onClick={() => setSettings((s) => ({ ...s, facing: "environment" }))}
            >
              Traseira
            </button>
          </div>
        </div>

        <div className="card" style={{ background: "var(--panel-2)", marginBottom: 18, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: 14 }}>Modo apresentacao</strong>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>
                Traseira no fundo + frontal no quadrado pequeno
              </p>
            </div>
            <Switch
              checked={settings.presentation}
              onChange={(v) => {
                setSettings((s) => ({ ...s, presentation: v }));
                if (v) clearBackground();
              }}
            />
          </div>
        </div>

        {/* FUNDO COM VIDEO OU IMAGEM */}
        <div className="card" style={{ background: "var(--panel-2)", marginBottom: 18, padding: 16 }}>
          <strong style={{ fontSize: 14 }}>Fundo com video ou imagem</strong>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 12px" }}>
            Sua camera aparece em um quadrado pequeno sobre o fundo escolhido
          </p>

          {!hasBackground ? (
            <label className="btn btn-secondary btn-block" style={{ cursor: "pointer", textAlign: "center" }}>
              + Escolher video ou imagem
              <input
                type="file"
                accept="video/*,image/*"
                style={{ display: "none" }}
                disabled={settings.presentation}
                onChange={(e) => {
                  handleBackgroundUpload(e.target.files?.[0]);
                  setSettings((s) => ({ ...s, presentation: false }));
                }}
              />
            </label>
          ) : (
            <>
              <button className="btn btn-ghost btn-block" onClick={clearBackground} style={{ marginBottom: 12 }}>
                ✕ Remover fundo
              </button>

              {backgroundMode === "video" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 13 }}>Video de fundo mudo</span>
                    <Switch checked={backgroundMuted} onChange={setBackgroundMuted} />
                  </div>
                  {!backgroundMuted && (
                    <div>
                      <label style={{ fontSize: 13 }}>Volume do video de fundo: {backgroundVolume}%</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={backgroundVolume}
                        onChange={(e) => setBackgroundVolume(Number(e.target.value))}
                        style={{ width: "100%" }}
                      />
                    </div>
                  )}
                  <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                    O audio do video de fundo e so para voce ouvir durante a gravacao — o video final grava o audio do seu microfone.
                  </p>
                </>
              )}
            </>
          )}
        </div>

        <div style={{ marginBottom: 18 }}>
          <label>Velocidade do texto: {settings.speed}</label>
          <input
            type="range"
            min={1}
            max={10}
            value={settings.speed}
            onChange={(e) => setSettings((s) => ({ ...s, speed: Number(e.target.value) }))}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label>Tamanho da fonte: {settings.fontSize}px</label>
          <input
            type="range"
            min={16}
            max={64}
            value={settings.fontSize}
            onChange={(e) => setSettings((s) => ({ ...s, fontSize: Number(e.target.value) }))}
            style={{ width: "100%" }}
          />
        </div>

        <div className="card" style={{ background: "var(--panel-2)", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: 14 }}>Video animado</strong>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>Legenda colorida gravada junto com o video</p>
            </div>
            <Switch checked={settings.animatedText} onChange={(v) => setSettings((s) => ({ ...s, animatedText: v }))} />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .studio-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 46,
        height: 26,
        borderRadius: 999,
        border: "none",
        background: checked ? "var(--teal)" : "var(--line)",
        position: "relative",
        flexShrink: 0,
        transition: "background 0.15s ease",
      }}
      aria-pressed={checked}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#0A0B0D",
          transition: "left 0.15s ease",
        }}
      />
    </button>
  );
}
