import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'

function normalizeActivity(activity = 'stand') {
  const key = String(activity).toLowerCase()
  if (key.startsWith('walk')) return 'walk'
  if (key.startsWith('sit')) return 'sit'
  if (key.startsWith('jump')) return 'jump'
  if (key.startsWith('fall')) return 'fall'
  return 'stand'
}

function ArchitecturalRoom() {
  return (
    <group>
      {/* Matte warm archival floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#EBE8E0" roughness={0.95} />
      </mesh>

      {/* Back & Left Architectural Walls */}
      <mesh position={[0, 2.2, -5]}>
        <boxGeometry args={[10, 4.4, 0.12]} />
        <meshStandardMaterial color="#DFDCD3" roughness={0.9} />
      </mesh>
      <mesh position={[-5, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 4.4, 0.12]} />
        <meshStandardMaterial color="#D6D3C9" roughness={0.9} />
      </mesh>

      {/* Subtle architectural baseboard */}
      <mesh position={[0, 0.08, -4.93]}>
        <boxGeometry args={[10, 0.16, 0.04]} />
        <meshStandardMaterial color="#C7C3B8" />
      </mesh>
      <mesh position={[-4.93, 0.08, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 0.16, 0.04]} />
        <meshStandardMaterial color="#C7C3B8" />
      </mesh>
    </group>
  )
}

function SensorNode({ position, accent = '#181816' }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.38, 0.12, 0.48]} />
        <meshStandardMaterial color="#1E1E1C" roughness={0.4} />
      </mesh>
      <mesh position={[0.1, 0.24, -0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
        <meshStandardMaterial color="#3A3935" />
      </mesh>
      <mesh position={[0, 0.07, 0.24]}>
        <boxGeometry args={[0.12, 0.03, 0.02]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

function SubjectMarker({ activity }) {
  const groupRef = useRef()
  const norm = normalizeActivity(activity)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    if (norm === 'walk') {
      groupRef.current.position.x = Math.sin(t * 1.4) * 1.8
      groupRef.current.position.z = Math.cos(t * 0.7) * 0.9
      groupRef.current.position.y = 0.9 + Math.abs(Math.sin(t * 5)) * 0.06
      groupRef.current.rotation.z = 0
    } else if (norm === 'jump') {
      groupRef.current.position.x = 0
      groupRef.current.position.z = 0
      groupRef.current.position.y = 0.9 + Math.abs(Math.sin(t * 4.5)) * 0.75
      groupRef.current.rotation.z = 0
    } else if (norm === 'sit') {
      groupRef.current.position.x = 0
      groupRef.current.position.z = 0
      groupRef.current.position.y = 0.55
      groupRef.current.rotation.z = 0
    } else if (norm === 'fall') {
      groupRef.current.position.x = 0.3
      groupRef.current.position.z = 0.2
      groupRef.current.position.y = 0.28
      groupRef.current.rotation.z = Math.PI / 2
    } else {
      groupRef.current.position.x = 0
      groupRef.current.position.z = 0
      groupRef.current.position.y = 0.9 + Math.sin(t * 1.2) * 0.02
      groupRef.current.rotation.z = 0
    }
  })

  const colorMap = {
    fall: '#B42318',
    walk: '#1E6B47',
    sit: '#4A4842',
    jump: '#9A580A',
    stand: '#181816',
  }

  return (
    <group ref={groupRef} position={[0, 0.9, 0]}>
      <mesh>
        <capsuleGeometry args={[0.26, norm === 'sit' ? 0.6 : 1.05, 8, 16]} />
        <meshStandardMaterial color={colorMap[norm]} roughness={0.55} />
      </mesh>
    </group>
  )
}

function SignalPath({ from, to, color = '#5C5A54' }) {
  const lineRef = useRef()

  useFrame((state) => {
    if (lineRef.current?.material) {
      lineRef.current.material.opacity = 0.25 + Math.sin(state.clock.elapsedTime * 2.5) * 0.18
    }
  })

  return (
    <Line
      ref={lineRef}
      points={[from, to]}
      color={color}
      lineWidth={1.5}
      transparent
      opacity={0.4}
    />
  )
}

function Room3DVisualization({
  activity = 'stand',
  confidence = 0.88,
  rssi = -54,
  roomName = 'Living Room',
}) {
  const norm = normalizeActivity(activity)
  const isFall = norm === 'fall'

  return (
    <div className="relative w-full h-[360px] bg-[#EFECE4] border border-hairline rounded-md overflow-hidden">
      <Canvas camera={{ position: [7.5, 6.8, 7.5], fov: 48 }}>
        <color attach="background" args={['#EFECE4']} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[8, 12, 6]} intensity={0.85} />
        <pointLight position={[-8, 6, -6]} intensity={0.35} />

        <ArchitecturalRoom />
        <SensorNode position={[-4.1, 1.0, -4.1]} accent="#1E6B47" />
        <SensorNode position={[4.1, 1.0, -4.1]} accent="#181816" />
        <SubjectMarker activity={activity} />

        <SignalPath from={[-4.1, 1.0, -4.1]} to={[4.1, 1.0, -4.1]} color="#7D7970" />
        <SignalPath
          from={[-4.1, 1.0, -4.1]}
          to={[0, isFall ? 0.3 : 0.9, 0]}
          color={isFall ? '#B42318' : '#1E6B47'}
        />
        <SignalPath
          from={[0, isFall ? 0.3 : 0.9, 0]}
          to={[4.1, 1.0, -4.1]}
          color={isFall ? '#B42318' : '#1E6B47'}
        />

        <OrbitControls enablePan={false} minDistance={5} maxDistance={16} />
        <gridHelper args={[10, 10, '#C7C3B8', '#DDD9CE']} position={[0, 0.01, 0]} />
      </Canvas>

      {/* Top-left HUD */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-surface/95 border border-hairline px-3 py-1.5 rounded text-xs">
        <span className="font-mono uppercase tracking-wider text-ink-muted">Spatial RF</span>
        <span className="text-hairline">|</span>
        <span className="font-medium text-ink">{roomName}</span>
      </div>

      {/* Bottom-left Telemetry Strip */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 bg-surface/95 border border-hairline px-3.5 py-2 rounded">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-ink-muted uppercase tracking-wider text-[10px] block">Posture</span>
            <span className={`font-mono font-semibold uppercase ${isFall ? 'text-signal-alert' : 'text-ink'}`}>
              {activity}
            </span>
          </div>
          <div className="h-6 w-px bg-hairline" />
          <div>
            <span className="text-ink-muted uppercase tracking-wider text-[10px] block">Confidence</span>
            <span className="font-mono font-medium text-ink tabular-nums">
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <div className="h-6 w-px bg-hairline" />
          <div>
            <span className="text-ink-muted uppercase tracking-wider text-[10px] block">RSSI</span>
            <span className="font-mono font-medium text-ink tabular-nums">{rssi} dBm</span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-ink-muted">
          Drag to orbit · Scroll to zoom
        </span>
      </div>
    </div>
  )
}

export default Room3DVisualization
