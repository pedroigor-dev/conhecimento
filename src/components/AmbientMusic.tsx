'use client'

import { useRef, useState } from 'react'

export default function AmbientMusic() {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const toggleMusic = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = 0.34

    if (audio.paused) {
      audio.play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => setIsMusicPlaying(false))
      return
    }

    audio.pause()
    setIsMusicPlaying(false)
  }

  return (
    <>
      <audio ref={audioRef} src="/fundo.mp3" loop preload="none" />
      <button
        className={`music-toggle ${isMusicPlaying ? 'is-playing' : ''}`}
        type="button"
        aria-label={isMusicPlaying ? 'Pausar musica ambiente' : 'Tocar musica ambiente'}
        aria-pressed={isMusicPlaying}
        onClick={toggleMusic}
      >
        <span className="music-toggle-icon" aria-hidden="true" />
      </button>
    </>
  )
}
