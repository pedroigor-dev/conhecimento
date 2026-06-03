'use client'

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { gsap } from 'gsap'
import VideoTextTitle from './VideoTextTitle'

const feelings = [
  {
    mood: 'self-esteem',
    storySlug: 'autoestima',
    side: 'left',
    title: 'Baixa autoestima',
    text: 'Eu não queria odiar meu reflexo. Eu queria atravessar o dia sem negociar com ele.',
    endX: 13,
    endY: 30,
    line: 'M 49 38 C 34 21, 22 22, 13 30',
  },
  {
    mood: 'insecurity',
    storySlug: 'inseguranca',
    side: 'left',
    title: 'Insegurança',
    text: 'É uma luta íntima para voltar a habitar o próprio rosto.',
    endX: 14,
    endY: 72,
    line: 'M 49 58 C 34 63, 23 70, 14 72',
  },
  {
    mood: 'dysmorphia',
    storySlug: 'dismorfiacorporal',
    side: 'right',
    title: 'Dismorfia corporal',
    text: 'O espelho vira uma sentença variável: cada detalhe cresce até ocupar tudo.',
    endX: 87,
    endY: 30,
    line: 'M 51 37 C 66 21, 78 22, 87 30',
  },
  {
    mood: 'anxiety',
    storySlug: 'ansiedade',
    side: 'right',
    title: 'Ansiedade',
    text: 'Minha cabeça antecipa olhares que talvez nunca tenham existido.',
    endX: 86,
    endY: 72,
    line: 'M 51 57 C 66 63, 77 70, 86 72',
  },
]

const vertexShader = `
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  float pulse = sin((uv.y * 9.0) + uTime * 1.4) * 0.025;
  float scan = sin((uv.x * 18.0) - uTime * 0.9) * 0.018;
  float proximity = 1.0 - smoothstep(0.0, 0.75, distance(uv, vec2(0.5) + uMouse * 0.12));
  pos.z += pulse + scan + proximity * 0.12;
  pos.x += uMouse.x * 0.08 * (uv.y - 0.5);
  pos.y += uMouse.y * 0.05 * (uv.x - 0.5);
  pos.z += uScroll * 0.32;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const fragmentShader = `
uniform sampler2D uTexture;
uniform sampler2D uMoodTextureFrom;
uniform sampler2D uMoodTextureTo;
uniform vec3 uMoodTintFrom;
uniform vec3 uMoodTintTo;
uniform float uTime;
uniform vec2 uMouse;
uniform float uIntensity;
uniform float uMoodMix;
uniform float uMoodTransition;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float wave = sin(uv.y * 42.0 + uTime * 2.0) * 0.0025;
  vec2 drift = uMouse * 0.004;
  float r = texture2D(uTexture, uv + vec2(wave, 0.0) + drift).r;
  float g = texture2D(uTexture, uv).g;
  float b = texture2D(uTexture, uv - vec2(wave, 0.0) - drift).b;
  float a = texture2D(uTexture, uv).a;
  vec4 moodFrom = texture2D(uMoodTextureFrom, uv - drift * 0.6);
  vec4 moodTo = texture2D(uMoodTextureTo, uv - drift * 0.6);
  vec3 color = vec3(r, g, b);
  float blackMask = smoothstep(0.018, 0.12, max(max(r, g), b));
  float moodMaskFrom = smoothstep(0.018, 0.12, max(max(moodFrom.r, moodFrom.g), moodFrom.b));
  float moodMaskTo = smoothstep(0.018, 0.12, max(max(moodTo.r, moodTo.g), moodTo.b));
  vec3 moodColor = mix(moodFrom.rgb * uMoodTintFrom, moodTo.rgb * uMoodTintTo, uMoodTransition);
  float moodMask = mix(moodMaskFrom, moodMaskTo, uMoodTransition);
  float moodAlpha = mix(moodFrom.a * moodMaskFrom, moodTo.a * moodMaskTo, uMoodTransition);
  float grain = fract(sin(dot(uv * uTime, vec2(12.9898,78.233))) * 43758.5453);
  color += (grain - 0.5) * 0.07;
  color *= 1.0 + uIntensity * 0.35;
  color = mix(color, moodColor, uMoodMix * moodMask);
  color += vec3(0.04, 0.11, 0.18) * smoothstep(0.25, 1.0, distance(uv, vec2(0.5)));
  gl_FragColor = vec4(color, max(a * blackMask, moodAlpha * uMoodMix));
}
`

export default function FaceScene() {
  const [activeFeeling, setActiveFeeling] = useState<(typeof feelings)[number] | null>(null)
  const [isStoryTransitioning, setIsStoryTransitioning] = useState(false)
  const router = useRouter()
  const mountRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    const root = rootRef.current
    if (!mount || !root) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x020407, 0.08)

    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 80)
    camera.position.set(0, 0.08, 7.3)

    const faceRig = new THREE.Group()
    const eyeRig = new THREE.Group()
    scene.add(faceRig, eyeRig)

    const textureLoader = new THREE.TextureLoader()
    const texture = textureLoader.load('/image-Photoroom%20(22).png')
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    const anxietyTexture = textureLoader.load('/ansiedade.png')
    anxietyTexture.colorSpace = THREE.SRGBColorSpace
    anxietyTexture.anisotropy = 8
    const selfEsteemTexture = textureLoader.load('/autoestima.png')
    selfEsteemTexture.colorSpace = THREE.SRGBColorSpace
    selfEsteemTexture.anisotropy = 8
    const insecurityTexture = textureLoader.load('/inseguran%C3%A7a.png')
    insecurityTexture.colorSpace = THREE.SRGBColorSpace
    insecurityTexture.anisotropy = 8
    const dysmorphiaTexture = textureLoader.load('/dismorfiacorporal.png')
    dysmorphiaTexture.colorSpace = THREE.SRGBColorSpace
    dysmorphiaTexture.anisotropy = 8

    const uniforms = {
      uTexture: { value: texture },
      uMoodTextureFrom: { value: anxietyTexture },
      uMoodTextureTo: { value: anxietyTexture },
      uMoodTintFrom: { value: new THREE.Vector3(1.18, 1.02, 0.78) },
      uMoodTintTo: { value: new THREE.Vector3(1.18, 1.02, 0.78) },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uIntensity: { value: 0 },
      uMoodMix: { value: 0 },
      uMoodTransition: { value: 1 },
    }

    const faceMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    })

    const face = new THREE.Mesh(new THREE.PlaneGeometry(3.35, 6.7, 96, 160), faceMaterial)
    face.position.set(0, -0.18, 0)
    faceRig.add(face)

    const particleCount = 900
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i += 1) {
      const radius = 2.1 + Math.random() * 6.2
      const angle = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 8
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(angle) * radius - 3.5
      colors[i * 3] = 0.18 + Math.random() * 0.18
      colors[i * 3 + 1] = 0.45 + Math.random() * 0.32
      colors[i * 3 + 2] = 0.68 + Math.random() * 0.28
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        size: 0.018,
        vertexColors: true,
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    scene.add(particles)

    const mouse = new THREE.Vector2(0, 0)
    const smoothMouse = new THREE.Vector2(0, 0)
    const clock = new THREE.Clock()

    const moveCursor = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth - 0.5) * 2
      mouse.y = -(event.clientY / window.innerHeight - 0.5) * 2

      if (cursorRef.current) {
        gsap.to(cursorRef.current, { x: event.clientX, y: event.clientY, duration: 0.08, ease: 'power2.out' })
      }

      if (ringRef.current) {
        gsap.to(ringRef.current, { x: event.clientX, y: event.clientY, duration: 0.42, ease: 'power3.out' })
      }
    }

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      const mobile = window.innerWidth < 780
      faceRig.scale.setScalar(mobile ? 0.72 : 0.86)
      eyeRig.scale.setScalar(mobile ? 0.72 : 0.86)
    }

    let frameId = 0

    const render = () => {
      const elapsed = clock.getElapsedTime()
      smoothMouse.lerp(mouse, 0.07)
      uniforms.uTime.value = elapsed
      uniforms.uMouse.value.copy(smoothMouse)
      faceRig.rotation.y = smoothMouse.x * 0.16
      faceRig.rotation.x = -smoothMouse.y * 0.08
      faceRig.position.y = Math.sin(elapsed * 0.55) * 0.045
      particles.rotation.y = elapsed * 0.018 + smoothMouse.x * 0.08
      particles.rotation.x = smoothMouse.y * 0.035
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(render)
    }

    resize()
    render()
    window.addEventListener('mousemove', moveCursor)
    window.addEventListener('resize', resize)

    let currentMoodSettings: {
      texture: THREE.Texture
      tint: THREE.Vector3
      intensity: number
    } | null = null

    const handleFeelingChange = (event: Event) => {
      const mood = (event as CustomEvent<{ mood: string | null }>).detail.mood
      const moodSettings = {
        anxiety: {
          texture: anxietyTexture,
          tint: new THREE.Vector3(1.18, 1.02, 0.78),
          intensity: 0.72,
        },
        'self-esteem': {
          texture: selfEsteemTexture,
          tint: new THREE.Vector3(0.9, 0.92, 0.96),
          intensity: 0.48,
        },
        insecurity: {
          texture: insecurityTexture,
          tint: new THREE.Vector3(0.82, 1.08, 0.9),
          intensity: 0.58,
        },
        dysmorphia: {
          texture: dysmorphiaTexture,
          tint: new THREE.Vector3(1.02, 0.82, 1.24),
          intensity: 0.66,
        },
      } as const
      const settings = mood ? moodSettings[mood as keyof typeof moodSettings] : null

      if (settings) {
        const fromSettings = currentMoodSettings ?? settings
        uniforms.uMoodTextureFrom.value = fromSettings.texture
        uniforms.uMoodTextureTo.value = settings.texture
        uniforms.uMoodTintFrom.value.copy(fromSettings.tint)
        uniforms.uMoodTintTo.value.copy(settings.tint)
        uniforms.uMoodTransition.value = 0
        gsap.to(uniforms.uMoodTransition, {
          value: 1,
          duration: 1.45,
          ease: 'power3.inOut',
        })
      }

      gsap.to(uniforms.uMoodMix, {
        value: settings ? 1 : 0,
        duration: 1.45,
        ease: 'power3.inOut',
      })
      gsap.to(uniforms.uIntensity, {
        value: settings?.intensity ?? 0,
        duration: 1.45,
        ease: 'power3.inOut',
      })
      currentMoodSettings = settings
    }

    window.addEventListener('feelingchange', handleFeelingChange)

    const ctx = gsap.context(() => {
      const opening = gsap.timeline({ defaults: { ease: 'power3.out' } })
      opening
        .fromTo(faceRig.scale, { x: 0.54, y: 0.54, z: 0.54 }, { x: faceRig.scale.x, y: faceRig.scale.y, z: faceRig.scale.z, duration: 2.1 })
        .fromTo('.intro-copy > *', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.18 }, 0.45)
        .fromTo('.connector', { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: 1.55, stagger: 0.16 }, 0.95)
        .fromTo('.feeling-label', { opacity: 0 }, { opacity: 1, duration: 1.1, stagger: 0.12 }, 1.25)
    }, root)

    return () => {
      ctx.revert()
      cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('resize', resize)
      window.removeEventListener('feelingchange', handleFeelingChange)
      texture.dispose()
      anxietyTexture.dispose()
      selfEsteemTexture.dispose()
      insecurityTexture.dispose()
      dysmorphiaTexture.dispose()
      face.geometry.dispose()
      faceMaterial.dispose()
      particleGeometry.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  const selectFeeling = (feeling: (typeof feelings)[number]) => {
    setActiveFeeling(feeling)
    window.dispatchEvent(new CustomEvent('feelingchange', { detail: { mood: feeling.mood } }))
  }

  const openStory = (event: ReactMouseEvent<HTMLAnchorElement>, slug: string) => {
    event.preventDefault()
    if (isStoryTransitioning) return

    setIsStoryTransitioning(true)
    window.setTimeout(() => router.push(`/relato/${slug}`), 920)
  }

  return (
    <main
      ref={rootRef}
      className={`relative h-screen overflow-hidden bg-black text-white ${activeFeeling?.mood === 'anxiety' ? 'is-anxiety' : ''} ${activeFeeling?.mood === 'self-esteem' ? 'is-self-esteem' : ''} ${activeFeeling?.mood === 'insecurity' ? 'is-insecurity' : ''} ${activeFeeling?.mood === 'dysmorphia' ? 'is-dysmorphia' : ''}`}
    >
      <video className="abstract-background" src="/arteabstrata.mp4" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
      <div ref={mountRef} className="absolute inset-0 z-10" />
      <div className="fixed inset-0 z-[1] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.12)_38%,rgba(0,0,0,0.88)_100%)]" />
      <div className="mood-wash mood-wash-anxiety" />
      <div className="mood-wash mood-wash-self-esteem" />
      <div className="mood-wash mood-wash-insecurity" />
      <div className="mood-wash mood-wash-dysmorphia" />
      <div className="fixed inset-0 z-[2] noise-overlay" />
      <div className="vhs-overlay" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 z-[3] bg-[linear-gradient(90deg,rgba(0,0,0,0.78),transparent_30%,transparent_70%,rgba(0,0,0,0.78))]" />

      <section className="relative flex h-screen items-center justify-center overflow-hidden">
        <svg
          className="connector-layer pointer-events-none absolute inset-0 z-[6] h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {feelings.map((feeling) => (
            <path key={feeling.title} className={`connector connector-${feeling.side}`} pathLength="1" d={feeling.line} />
          ))}
        </svg>

        <div className="intro-copy pointer-events-none absolute left-1/2 top-[7vh] z-20 w-[min(86vw,720px)] -translate-x-1/2 text-center">
          <p className="text-[0.68rem] uppercase tracking-[0.72em] text-cyan-100/45">Mapa do que sinto</p>
          <VideoTextTitle className="main-video-title mt-5" lines={['Anatomia do', 'invisível']} />
        </div>

        <div className="pointer-events-none absolute inset-0 z-30">
          {feelings.map((feeling) => (
            <button
              key={feeling.title}
              className={`feeling-label ${activeFeeling?.title === feeling.title ? 'is-active' : ''}`}
              data-side={feeling.side}
              type="button"
              style={{
                left: feeling.side === 'left' ? 'clamp(1rem, 5vw, 6rem)' : undefined,
                right: feeling.side === 'right' ? 'clamp(1rem, 5vw, 6rem)' : undefined,
                top: `${feeling.endY}%`,
              }}
              onClick={() => selectFeeling(feeling)}
            >
              <span className="feeling-label-dot" />
              <span className="feeling-label-text">{feeling.title}</span>
            </button>
          ))}
        </div>

        {activeFeeling ? (
          <div className="feeling-statement absolute bottom-[7vh] left-1/2 z-20 w-[min(78vw,720px)] -translate-x-1/2 text-center">
            <p className="text-[0.66rem] uppercase tracking-[0.52em] text-cyan-100/45">{activeFeeling.title}</p>
            <p key={activeFeeling.title} className="mt-4 text-balance font-serif text-[clamp(1.35rem,2.7vw,3rem)] leading-[1.04] text-white/86">{activeFeeling.text}</p>
            <Link className="read-more-link" href={`/relato/${activeFeeling.storySlug}`} onClick={(event) => openStory(event, activeFeeling.storySlug)}>
              Leia mais
            </Link>
          </div>
        ) : null}
      </section>

      {isStoryTransitioning ? <div className="story-transition-fog" aria-hidden="true" /> : null}
      <div ref={cursorRef} className="custom-cursor" />
      <div ref={ringRef} className="custom-cursor-ring" />
    </main>
  )
}
