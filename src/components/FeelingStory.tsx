'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { stories, type StorySlug } from './storyData'
import VideoTextTitle from './VideoTextTitle'

type FeelingStoryProps = {
  slug: StorySlug
}

const storyTheme = {
  'self-esteem': {
    color: '#c9ced7',
    glow: '#737985',
  },
  anxiety: {
    color: '#ffd077',
    glow: '#b76511',
  },
  insecurity: {
    color: '#8fe3ad',
    glow: '#2f8f59',
  },
  dysmorphia: {
    color: '#c2a0ff',
    glow: '#6337b7',
  },
} satisfies Record<string, { color: string; glow: string }>

const cleanStoryText = (text: string) =>
  text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/^>\s?/, ''))
    .join('\n')
    .trim()

export default function FeelingStory({ slug }: FeelingStoryProps) {
  const story = stories[slug]
  const theme = storyTheme[story.theme]
  const titleLines = story.title.includes(' ') ? story.title.split(' ') : [story.title]
  const [fullText, setFullText] = useState('')
  const [typedText, setTypedText] = useState('')
  const pageRef = useRef<HTMLElement>(null)
  const canvasMountRef = useRef<HTMLDivElement>(null)
  const paragraphs = useMemo(() => typedText.split(/\n\s*\n/), [typedText])

  useEffect(() => {
    const mount = canvasMountRef.current
    const page = pageRef.current
    if (!mount || !page) return

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80)
    camera.position.set(0, 0, 12)

    const color = new THREE.Color(theme.color)
    const glow = new THREE.Color(theme.glow)
    const particleCount = 520
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i += 1) {
      const spread = 16
      positions[i * 3] = (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12
      const mixed = color.clone().lerp(glow, Math.random() * 0.55)
      colors[i * 3] = mixed.r
      colors[i * 3 + 1] = mixed.g
      colors[i * 3 + 2] = mixed.b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    const clock = new THREE.Clock()
    let scrollProgress = 0
    let frameId = 0

    const updateScroll = () => {
      const maxScroll = Math.max(1, page.scrollHeight - page.clientHeight)
      scrollProgress = page.scrollTop / maxScroll
    }

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    const render = () => {
      const elapsed = clock.getElapsedTime()
      particles.rotation.y = elapsed * 0.025 + scrollProgress * 0.42
      particles.rotation.x = Math.sin(elapsed * 0.28) * 0.08 + scrollProgress * 0.18
      camera.position.y = -scrollProgress * 2.2
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(render)
    }

    page.scrollTop = 0
    page.addEventListener('scroll', updateScroll, { passive: true })
    window.addEventListener('resize', resize)
    resize()
    updateScroll()
    render()

    return () => {
      cancelAnimationFrame(frameId)
      page.removeEventListener('scroll', updateScroll)
      window.removeEventListener('resize', resize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [theme.color, theme.glow])

  useEffect(() => {
    let isMounted = true

    fetch(`/${story.file}`)
      .then((response) => response.text())
      .then((text) => {
        if (isMounted) setFullText(cleanStoryText(text))
      })
      .catch(() => {
        if (isMounted) setFullText('Este relato ainda esta encontrando as palavras certas.')
      })

    return () => {
      isMounted = false
    }
  }, [story.file])

  useEffect(() => {
    if (!fullText) return

    let index = 0
    let timeoutId = 0

    const typeNext = () => {
      index = Math.min(index + 5, fullText.length)
      setTypedText(fullText.slice(0, index))

      if (index < fullText.length) {
        timeoutId = window.setTimeout(typeNext, fullText[index - 1] === '\n' ? 34 : 14)
      }
    }

    typeNext()

    return () => window.clearTimeout(timeoutId)
  }, [fullText])

  return (
    <main ref={pageRef} className={`story-page story-${story.theme}`}>
      <div ref={canvasMountRef} className="story-three-layer" />
      <div className="story-fog story-fog-one" />
      <div className="story-fog story-fog-two" />
      <Link className="story-back-link" href="/?skipIntro=1">
        Voltar
      </Link>
      <article className="story-article">
        <p className="story-kicker">relato</p>
        <h1 className="story-heading">
          <span className="story-glitch-title" data-title={titleLines.join('\n')}>
            <VideoTextTitle className="story-video-title" lines={titleLines} />
          </span>
        </h1>
        <div className="story-text" aria-live="polite">
          {paragraphs.map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>
          ))}
          <span className="story-caret" aria-hidden="true" />
        </div>
      </article>
    </main>
  )
}
