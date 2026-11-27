import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line, ContactShadows } from '@react-three/drei'

function normalizeActivity(activity = 'stand') {
  const key = String(activity).toLowerCase()
  if (key.startsWith('walk')) return 'walk'
  if (key.startsWith('sit')) return 'sit'
  if (key.startsWith('jump')) return 'jump'
  if (key.startsWith('fall')) return 'fall'
  return 'stand'
}

function ModernSpatialRoom() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[11, 11]} />
        <meshStandardMaterial color="#0D1322" roughness={0.35} metalness={0.4} />
      </mesh>
      <gridHelper args={[11, 22, '#1E293B', '#141E33']} position={[0, 0.005, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.01, 0.2]}>
        <planeGeometry args={[5.4, 4.2]} />
        <meshStandardMaterial color="#162033" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.012, 0.2]}>
        <planeGeometry args={[5.1, 3.9]} />
        <meshStandardMaterial color="#111928" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.1, -5.2]}>
        <boxGeometry args={[11, 4.2, 0.14]} />
        <meshStandardMaterial color="#0F172A" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[-5.2, 2.1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[11, 4.2, 0.14]} />
        <meshStandardMaterial color="#0B1120" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.06, -5.11]}>
        <boxGeometry args={[10.8, 0.06, 0.04]} />
        <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[-5.11, 0.06, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10.8, 0.06, 0.04]} />
        <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={0.85} />
      </mesh>
      <group position={[0.2, 2.3, -5.1]}>
        <mesh>
          <boxGeometry args={[3.2, 1.8, 0.06]} />
          <meshStandardMaterial color="#1E293B" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[3.0, 1.6]} />
          <meshStandardMaterial color="#0284C7" emissive="#0369A1" emissiveIntensity={0.45} roughness={0.15} />
        </mesh>
      </group>
      <group position={[0, 0, -2.75]}>
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[2.9, 0.44, 1.05]} />
          <meshStandardMaterial color="#1E293B" roughness={0.75} />
        </mesh>
        <mesh position={[-0.68, 0.5, 0.04]}>
          <boxGeometry args={[1.2, 0.14, 0.92]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        <mesh position={[0.68, 0.5, 0.04]}>
          <boxGeometry args={[1.2, 0.14, 0.92]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.78, -0.4]}>
          <boxGeometry args={[2.9, 0.68, 0.24]} />
          <meshStandardMaterial color="#1E293B" roughness={0.75} />
        </mesh>
      </group>
      <group position={[0.1, 0, -0.95]}>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[1.55, 0.05, 0.85]} />
          <meshStandardMaterial color="#38BDF8" transparent opacity={0.35} roughness={0.1} metalness={0.8} />
        </mesh>
        {[[-0.65, -0.32], [0.65, -0.32], [-0.65, 0.32], [0.65, 0.32]].map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.2, lz]}>
            <cylinderGeometry args={[0.025, 0.025, 0.4, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>
      <mesh position={[-4.2, 0.42, -4.2]}>
        <cylinderGeometry args={[0.35, 0.4, 0.84, 24]} />
        <meshStandardMaterial color="#1E293B" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  )
}

function SensorNode({ position, accent = '#06B6D4' }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.38, 0.1, 0.46]} />
        <meshStandardMaterial color="#0F172A" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0.1, 0.24, -0.1]}>
        <cylinderGeometry args={[0.018, 0.018, 0.42, 8]} />
        <meshStandardMaterial color="#64748B" metalness={0.8} />
      </mesh>
      <mesh position={[-0.1, 0.24, -0.1]}>
        <cylinderGeometry args={[0.018, 0.018, 0.42, 8]} />
        <meshStandardMaterial color="#64748B" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.06, 0.23]}>
        <boxGeometry args={[0.18, 0.025, 0.02]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.6} />
      </mesh>
    </group>
  )
}

function HumanSubject({ activity, breathingBpm = 16 }) {
  const rootRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const auraRingRef = useRef()
  const norm = normalizeActivity(activity)

  const suitColor =
    norm === 'fall' ? '#EF4444' :
    norm === 'walk' ? '#38BDF8' :
    norm === 'jump' ? '#F59E0B' :
    norm === 'sit'  ? '#2DD4BF' : '#06B6D4'

  useFrame((state) => {
    if (!rootRef.current) return
    const t = state.clock.elapsedTime
    const breathFreq = Math.max(0.2, (breathingBpm / 60) * Math.PI * 2)

    rootRef.current.rotation.set(0, 0, 0)
    if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0)
    if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, 0)
    if (leftArmRef.current) leftArmRef.current.rotation.set(0, 0, 0)
    if (rightArmRef.current) rightArmRef.current.rotation.set(0, 0, 0)

    if (norm === 'walk') {
      const px = Math.sin(t * 1.1) * 1.7
      const pz = 0.5 + Math.cos(t * 0.8) * 0.7
      const dx = Math.cos(t * 1.1) * 1.7 * 1.1
      const dz = -Math.sin(t * 0.8) * 0.7 * 0.8
      rootRef.current.position.set(px, Math.abs(Math.sin(t * 5.2)) * 0.05, pz)
      rootRef.current.rotation.y = Math.atan2(dx, dz)
      const swing = Math.sin(t * 5.2) * 0.55
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.75
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.75
    } else if (norm === 'jump') {
      const hop = Math.abs(Math.sin(t * 4.5))
      rootRef.current.position.set(0.1, hop * 0.65, 0.4)
      if (leftArmRef.current) leftArmRef.current.rotation.z = 0.45 + hop * 0.9
      if (rightArmRef.current) rightArmRef.current.rotation.z = -(0.45 + hop * 0.9)
    } else if (norm === 'sit') {
      rootRef.current.position.set(0.1, 0.34, -2.4)
      if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.PI / 2.2
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.PI / 2.2
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.35
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.35
    } else if (norm === 'fall') {
      rootRef.current.position.set(0.15, 0.18, 0.65)
      rootRef.current.rotation.z = Math.PI / 2
      rootRef.current.rotation.y = 0.35
      if (leftArmRef.current) leftArmRef.current.rotation.z = 0.5
      if (rightArmRef.current) rightArmRef.current.rotation.z = -0.45
    } else {
      rootRef.current.position.set(0.1, Math.sin(t * breathFreq) * 0.015, 0.45)
    }

    if (auraRingRef.current) {
      auraRingRef.current.position.x = rootRef.current.position.x
      auraRingRef.current.position.z = rootRef.current.position.z
      const pulse = norm === 'fall'
        ? 1 + Math.sin(t * 7) * 0.22
        : 1 + Math.sin(t * breathFreq) * 0.12
      auraRingRef.current.scale.set(pulse, pulse, 1)
    }
  })

  return (
    <group>
      <mesh ref={auraRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.025, 0.45]}>
        <ringGeometry args={[0.62, 0.78, 48]} />
        <meshStandardMaterial
          color={suitColor}
          emissive={suitColor}
          emissiveIntensity={norm === 'fall' ? 1.8 : 1.0}
          transparent
          opacity={0.85}
        />
      </mesh>
      <group ref={rootRef} position={[0.1, 0, 0.45]}>
        <mesh position={[0, 1.56, 0]}>
          <sphereGeometry args={[0.14, 20, 20]} />
          <meshStandardMaterial color="#E2E8F0" emissive={suitColor} emissiveIntensity={0.25} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.39, 0]}>
          <cylinderGeometry args={[0.048, 0.052, 0.1, 12]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <boxGeometry args={[0.36, 0.48, 0.2]} />
          <meshStandardMaterial color={suitColor} emissive={suitColor} emissiveIntensity={0.45} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.82, 0]}>
          <boxGeometry args={[0.34, 0.16, 0.19]} />
          <meshStandardMaterial color="#1E293B" roughness={0.5} />
        </mesh>
        <group ref={leftArmRef} position={[-0.24, 1.32, 0]}>
          <mesh position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.052, 0.34, 8, 12]} />
            <meshStandardMaterial color={suitColor} emissive={suitColor} emissiveIntensity={0.35} roughness={0.4} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.24, 1.32, 0]}>
          <mesh position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.052, 0.34, 8, 12]} />
            <meshStandardMaterial color={suitColor} emissive={suitColor} emissiveIntensity={0.35} roughness={0.4} />
          </mesh>
        </group>
        <group ref={leftLegRef} position={[-0.1, 0.75, 0]}>
          <mesh position={[0, -0.34, 0]}>
            <capsuleGeometry args={[0.068, 0.52, 8, 12]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.1, 0.75, 0]}>
          <mesh position={[0, -0.34, 0]}>
            <capsuleGeometry args={[0.068, 0.52, 8, 12]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function SignalPath({ from, to, color = '#06B6D4' }) {
  const lineRef = useRef()
  useFrame((state) => {
    if (lineRef.current?.material) {
      lineRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 3.0) * 0.22
    }
  })
  return (
    <Line
      ref={lineRef}
      points={[from, to]}
      color={color}
      lineWidth={1.75}
      transparent
      opacity={0.45}
    />
  )
}

function WifiPulseRings({ position, color = '#06B6D4' }) {
  const rings = [useRef(), useRef(), useRef()]
  useFrame((state) => {
    const t = state.clock.elapsedTime
    rings.forEach((ref, idx) => {
      if (!ref.current) return
      const phase = (t * 0.75 + idx * 0.33) % 1
      const scale = 0.4 + phase * 4.2
      ref.current.scale.set(scale, scale, 1)
      if (ref.current.material) {
        ref.current.material.opacity = (1 - phase) * 0.42
      }
    })
  })
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {rings.map((ref, i) => (
        <mesh key={i} ref={ref}>
          <ringGeometry args={[0.28, 0.32, 48]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function Room3DVisualization({
  activity = 'stand',
  confidence = 0.88,
  rssi = -54,
  breathingBpm = 16,
  roomName = 'Living Room',
  fullScreen = false,
}) {
  const norm = normalizeActivity(activity)
  const isFall = norm === 'fall'
  const beamColor = isFall ? '#EF4444' : '#06B6D4'
  const subjectTarget =
    norm === 'sit'  ? [0.1, 0.9, -2.4] :
    norm === 'fall' ? [0.15, 0.25, 0.65] : [0.1, 1.0, 0.45]

  return (
    <div className={`relative w-full ${fullScreen ? 'h-full min-h-[540px]' : 'h-[420px]'} bg-[#070B14] overflow-hidden`}>
      <Canvas camera={{ position: [7.8, 6.0, 7.8], fov: 44 }} shadows>
        <color attach="background" args={['#070B14']} />
        <fog attach="fog" args={['#070B14', 14, 28]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[8, 14, 6]} intensity={0.85} color="#E0F2FE" />
        <pointLight position={[-4.2, 2.2, -4.2]} intensity={1.2} color={beamColor} distance={10} />
        <pointLight position={[0.1, 2.5, 0.45]} intensity={0.9} color={isFall ? '#EF4444' : '#38BDF8'} distance={8} />
        <ModernSpatialRoom />
        <SensorNode position={[-4.2, 0.9, -4.2]} accent={beamColor} />
        <WifiPulseRings position={[-4.2, 0.92, -4.2]} color={beamColor} />
        <SensorNode position={[4.2, 1.2, -4.2]} accent="#38BDF8" />
        <HumanSubject activity={activity} breathingBpm={breathingBpm} />
        <SignalPath from={[-4.2, 0.9, -4.2]} to={[4.2, 1.2, -4.2]} color="#334155" />
        <SignalPath from={[-4.2, 0.9, -4.2]} to={subjectTarget} color={beamColor} />
        <SignalPath from={subjectTarget} to={[4.2, 1.2, -4.2]} color={beamColor} />
        <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={12} blur={2.2} far={4} />
        <OrbitControls enablePan={false} minDistance={5} maxDistance={16} maxPolarAngle={Math.PI / 2.15} />
      </Canvas>

      {/* Top-Left Spatial HUD Pill */}
      <div className="absolute top-4 left-4 flex items-center gap-2.5 backdrop-blur-xl bg-slate-950/70 border border-white/10 px-3.5 py-2 rounded-full text-xs shadow-lg">
        <span className={`w-2 h-2 rounded-full ${isFall ? 'bg-red-500 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
        <span className="font-mono uppercase tracking-wider text-cyan-400">Spatial CSI</span>
        <span className="text-white/20">|</span>
        <span className="font-medium text-slate-100">{roomName}</span>
      </div>

      {/* Bottom Floating Telemetry Strip */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl bg-slate-950/75 border border-white/10 px-4 py-2.5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-5 text-xs">
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Posture</span>
            <span className={`font-mono font-semibold uppercase ${isFall ? 'text-red-400' : 'text-cyan-300'}`}>
              {activity}
            </span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Confidence</span>
            <span className="font-mono font-medium text-slate-100 tabular-nums">
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Respiration</span>
            <span className="font-mono font-medium text-emerald-300 tabular-nums">
              {breathingBpm} BPM
            </span>
          </div>
          <div className="h-6 w-px bg-white/10 hidden sm:block" />
          <div className="hidden sm:block">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Signal</span>
            <span className="font-mono font-medium text-slate-200 tabular-nums">{rssi} dBm</span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
          Drag to orbit · Scroll to zoom
        </span>
      </div>
    </div>
  )
}

export default Room3DVisualization
