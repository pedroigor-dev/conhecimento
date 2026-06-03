'use client'

import { useCallback, useEffect, useState } from 'react'

type IntroLoaderProps = {
  onEnter: () => void
}

const phrases = [
  'Olá, meu nome é Pedro',
  'O que você verá aqui não são personagens... Cada rosto representa algo que eu enfrento.',
  'Alguns dias em silêncio. Outros, não.',
  'Esta é a forma mais honesta que encontrei de mostrar isso.',
]

export default function IntroLoader({ onEnter }: IntroLoaderProps) {
  const [text, setText] = useState('')
  const [isLeaving, setIsLeaving] = useState(false)

  const leaveIntro = useCallback(() => {
    if (isLeaving) return
    setIsLeaving(true)
    window.setTimeout(onEnter, 1150)
  }, [isLeaving, onEnter])

  useEffect(() => {
    if (isLeaving) return

    let phraseIndex = 0
    let charIndex = 0
    let isDeleting = false
    let timeoutId = 0

    const typeNext = () => {
      const phrase = phrases[phraseIndex]
      setText(phrase.slice(0, charIndex))

      if (!isDeleting && charIndex <= phrase.length) {
        charIndex += 1
        timeoutId = window.setTimeout(typeNext, 72)
        return
      }

      if (!isDeleting) {
        isDeleting = true
        timeoutId = window.setTimeout(typeNext, phraseIndex === phrases.length - 1 ? 2200 : 1700)
        return
      }

      if (charIndex > 0) {
        charIndex -= 1
        timeoutId = window.setTimeout(typeNext, 36)
        return
      }

      isDeleting = false
      phraseIndex += 1

      if (phraseIndex >= phrases.length) {
        timeoutId = window.setTimeout(leaveIntro, 420)
        return
      }

      timeoutId = window.setTimeout(typeNext, 460)
    }

    typeNext()

    return () => window.clearTimeout(timeoutId)
  }, [leaveIntro])

  return (
    <main className={`intro-loader-screen ${isLeaving ? 'is-leaving' : ''}`}>
      <div className="intro-loader-copy">
        <p className="intro-loader-kicker">antes de entrar</p>
        <p className="intro-loader-text">
          {text}
          <span className="intro-loader-caret" aria-hidden="true" />
        </p>
      </div>
      <button className="intro-loader-skip" type="button" onClick={leaveIntro}>
        Pular
      </button>
    </main>
  )
}
