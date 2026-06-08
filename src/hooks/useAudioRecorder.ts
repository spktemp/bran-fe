import { useCallback, useEffect, useRef, useState } from "react"

export type AudioRecorderStatus = "idle" | "recording" | "stopped" | "error"

export function useAudioRecorder() {
  const [status, setStatus] = useState<AudioRecorderStatus>("idle")
  const [durationMs, setDurationMs] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const startedAtRef = useRef<number>(0)

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    cleanupStream()
    mediaRecorderRef.current = null
    chunksRef.current = []
    startedAtRef.current = 0
    setStatus("idle")
    setDurationMs(0)
    setBlob(null)
    setError(null)
  }, [clearTimer, cleanupStream])

  useEffect(() => {
    return () => {
      clearTimer()
      cleanupStream()
    }
  }, [clearTimer, cleanupStream])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Audio recording is not supported in this browser")
      setStatus("error")
      return
    }

    reset()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : ""

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      startedAtRef.current = Date.now()
      setStatus("recording")
      setDurationMs(0)

      timerRef.current = window.setInterval(() => {
        setDurationMs(Date.now() - startedAtRef.current)
      }, 200)
    } catch (err) {
      cleanupStream()
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone permission denied"
          : err instanceof Error
            ? err.message
            : "Failed to start recording"
      setError(message)
      setStatus("error")
    }
  }, [cleanupStream, reset])

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      clearTimer()
      const recorder = mediaRecorderRef.current

      if (!recorder || status !== "recording") {
        resolve(blob)
        return
      }

      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm"
        const recorded = new Blob(chunksRef.current, { type })
        setBlob(recorded)
        setDurationMs(Date.now() - startedAtRef.current)
        setStatus("stopped")
        cleanupStream()
        resolve(recorded)
      }

      if (recorder.state !== "inactive") {
        recorder.stop()
      } else {
        resolve(blob)
      }
    })
  }, [blob, cleanupStream, clearTimer, status])

  return { status, durationMs, blob, error, start, stop, reset }
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
