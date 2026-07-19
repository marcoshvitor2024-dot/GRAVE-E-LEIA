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

export default function Teleprompter({ scriptText, setScriptText, settings, setSettings }) {
  const [editing, setEditing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [ready, setReady] = useState(false);

  const videoRef = useRef(null);
  const videoBackRef = useRef(null);
  const videoFrontRef = useRef(null);
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

  const needsCanvas = settings.presentation || settings.animatedText;

  const stopAllTracks = () => {
    [streamRef, backStreamRef, frontStreamRef].forEach((r) => {
      r.current?.getTracks().forEach((t) => t.stop());
      r.current = null;
    });
  };

  const initCamera = useCallback(async () => {
    setCameraError("");
    stopAllTracks();
    try {
      if (settings.presentation) {
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

  // Loop principal: rolagem do texto + desenho do canvas (quando necessario)
  useEffect(() => {
    const words = scriptText.trim().length ? scriptText.trim().split(/\s+/) : [];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    const step = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      if (playing) clockRef.current += dt;

      // rolagem do overlay HTML do teleprompter (manipulacao direta do DOM p/ performance)
      if (promptRef.current) {
        const pxPerSecond = 18 + settings.speed * 14;
        const offset = clockRef.current * pxPerSecond;
        promptRef.current.style.transform =
          settings.orientation === "vertical"
            ? `translateY(-${offset}px)`
            : `translateX(-${offset}px)`;
      }

      // desenho do canvas (modo apresentacao e/ou texto animado)
      if (needsCanvas && ctx && canvas) {
        const W = canvas.width;
        const H = canvas.height;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);

        const drawCover = (video, dx, dy, dw, dh, radius = 0) => {
          if (!video || video.readyState < 2) return;
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          if (!vw || !vh) return;
          const scale = Math.max(dw / vw, dh / vh);
          const sw = dw / scale;
          const sh = dh / scale;
          const sx = (vw - sw) / 2;
          const sy = (vh - sh) / 2;
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
          ctx.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);
          ctx.restore();
        };

        if (settings.presentation) {
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
  }, [playing, settings, scriptText, needsCanvas]);

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

  const aspect = settings.orientation === "vertical" ? "9 / 16" : "16 / 9";
  const canvasSize =
    settings.orientation === "vertical" ? { w: 720, h: 1280 } : { w: 1280, h: 720 };

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
            aspectRatio: aspect,
            maxHeight: "72vh",
            margin: "0 auto",
            background: "#000",
          }}
        >
          {needsCanvas ? (
            <canvas ref={canvasRef} width={canvasSize.w} height={canvasSize.h} style={{ width: "100%", height: "100%", display: "block" }} />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          )}

          {/* elementos ocultos usados como fonte para o canvas no modo apresentacao */}
          {settings.presentation && (
            <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
              <video ref={videoBackRef} autoPlay playsInline muted />
              <video ref={videoFrontRef} autoPlay playsInline muted />
            </div>
          )}

          {/* overlay do teleprompter (guia de leitura, nao gravado) */}
          {!editing && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: settings.orientation === "vertical" ? "flex-start" : "center",
                justifyContent: settings.orientation === "vertical" ? "center" : "flex-start",
                overflow: "hidden",
                pointerEvents: "none",
                background:
                  settings.orientation === "vertical"
                    ? "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)"
                    : "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)",
              }}
            >
              <div
                ref={promptRef}
                style={{
                  padding: settings.orientation === "vertical" ? "24px 20px 0" : "0 24px",
                  whiteSpace: settings.orientation === "vertical" ? "normal" : "nowrap",
                  color: "#fff",
                  fontSize: settings.fontSize,
                  lineHeight: 1.4,
                  fontWeight: 600,
                  textShadow: "0 2px 10px rgba(0,0,0,0.6)",
                  maxWidth: settings.orientation === "vertical" ? "100%" : "none",
                }}
              >
                {scriptText || DEFAULT_SCRIPT}
              </div>
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
                {isPaused ? "PAUSADO" : "GRAVANDO"}
              </span>
            </div>
          )}
        </div>

        {cameraError && (
          <p style={{ color: "var(--rec)", fontSize: 13, marginTop: 10 }}>{cameraError}</p>
        )}

        {/* controles */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", marginTop: 18, flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={() => setEditing((v) => !v)}>
            {editing ? "Ver teleprompter" : "Editar texto"}
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

        <div style={{ marginBottom: 18 }}>
          <label>Orientacao</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={settings.orientation === "vertical" ? "btn btn-primary" : "btn btn-secondary"}
              style={{ flex: 1, padding: "10px" }}
              onClick={() => setSettings((s) => ({ ...s, orientation: "vertical" }))}
            >
              Vertical
            </button>
            <button
              className={settings.orientation === "horizontal" ? "btn btn-primary" : "btn btn-secondary"}
              style={{ flex: 1, padding: "10px" }}
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
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>Grava com as duas cameras ao mesmo tempo</p>
            </div>
            <Switch checked={settings.presentation} onChange={(v) => setSettings((s) => ({ ...s, presentation: v }))} />
          </div>
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
