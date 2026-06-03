'use client'

import { useCallback, useEffect, useState } from 'react'
import FaceScene from './FaceScene'
import IntroLoader from './IntroLoader'

export default function ExperienceGate() {
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const shouldSkipIntro = searchParams.get('skipIntro') === '1' || window.sessionStorage.getItem('hasEnteredExperience') === '1'

    if (shouldSkipIntro) {
      setHasEntered(true)
    }
  }, [])

  const enterExperience = useCallback(() => {
    window.sessionStorage.setItem('hasEnteredExperience', '1')
    setHasEntered(true)
  }, [])

  return hasEntered ? <FaceScene /> : <IntroLoader onEnter={enterExperience} />
}
