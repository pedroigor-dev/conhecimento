'use client'

import { useId } from 'react'

type VideoTextTitleProps = {
  className?: string
  lines: string[]
}

export default function VideoTextTitle({ className = '', lines }: VideoTextTitleProps) {
  const maskId = useId().replace(/:/g, '')
  const lineHeight = 108
  const startY = lines.length === 1 ? 160 : 104

  return (
    <svg className={`video-text-svg ${className}`} viewBox="0 0 1000 260" role="img" aria-label={lines.join(' ')}>
      <defs>
        <mask id={maskId}>
          <rect width="100%" height="100%" fill="black" />
          {lines.map((line, index) => (
            <text key={line} x="500" y={startY + index * lineHeight} textAnchor="middle" fill="white">
              {line}
            </text>
          ))}
        </mask>
      </defs>
      <foreignObject width="100%" height="100%" mask={`url(#${maskId})`}>
        <video className="video-text-media" src="/videofonte.mp4" autoPlay muted loop playsInline preload="metadata" />
      </foreignObject>
      {lines.map((line, index) => (
        <text key={`${line}-glow`} className="video-text-wash" x="500" y={startY + index * lineHeight} textAnchor="middle">
          {line}
        </text>
      ))}
    </svg>
  )
}
