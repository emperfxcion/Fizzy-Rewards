'use client'
import React from 'react'
import { pctFill } from '@/lib/utils'

type Props = { stamps: number, threshold?: number, size?: number }
export default function CupProgress({ stamps, threshold = 10, size = 180 }: Props) {
  const percent = pctFill(stamps, threshold)
  const height = size
  const width = size * 0.6
  const fillHeight = (percent / 100) * (height - 24)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label={`${stamps} of ${threshold} stamps`}>
      <rect x="10" y="12" width={width-20} height={height-24} rx="18" ry="18" fill="none" stroke="#111" strokeWidth="3"/>
      <path d={`M ${width-12} 60 C ${width+18} ${height*0.35}, ${width+18} ${height*0.65}, ${width-12} ${height-60}`} fill="none" stroke="#111" strokeWidth="6"/>
      <clipPath id="cupClip"><rect x="10" y="12" width={width-20} height={height-24} rx="18" ry="18"/></clipPath>
      <g clipPath="url(#cupClip)">
        <rect x="10" y={height-12-fillHeight} width={width-20} height={fillHeight} fill="#FF2F86" opacity="0.9"/>
        <circle cx={width*0.35} cy={height-30} r="4" fill="#FFF" opacity="0.7"/>
        <circle cx={width*0.45} cy={height-50} r="3" fill="#FFF" opacity="0.7"/>
        <circle cx={width*0.55} cy={height-70} r="2.5" fill="#FFF" opacity="0.7"/>
      </g>
      <text x={width/2} y="30" textAnchor="middle" fontFamily="Bebas Neue" fontSize="20" fill="#111">{stamps}/{threshold}</text>
    </svg>
  )
}
