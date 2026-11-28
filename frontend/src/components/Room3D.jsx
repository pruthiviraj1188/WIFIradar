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

// ─── Concentric radar rings radiating across the floor ───────────────────────
function RadarFloorRings({ color = '#06B6D4', count = 5 }) {
  const refs = Array.from({ length: count }, () => useRef())

  useFrame((state) => {
    const t = state.clock.elapsedTime
    refs.forEach((ref, idx) => {
      if (!ref.current) return
      const phase = (t * 0.4 + idx * (1 / count)) % 1
      const scale = 0.6 + phase * 7.0
      ref.current.scale.set(scale, scale, 1)
      if (ref.current.material) {
        ref.current.material.opacity = (1 - phase) * 0.28
      }
    })
  })

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
      {refs.map((ref, i) => (
        <mesh key={i} ref={ref}>
          <ringGeometry args={[0.48, 0.52, 72]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.9}
            transparent
            opacity={0.25}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─── Interior scene ───────────────────────────────────────────────────────────
function SpatialRoom() {
  return (
    <group>
      {/* Brighter navy floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#111E35" roughness={0.3} metalness={0.45} />
      </mesh>

      {/* Fine grid overlay */}
      <gridHelper args={[12, 24, '#243352', '#1A2744']} position={[0, 0.004, 0]} />

      {/* Soft area rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.009, 0.3]}>
        <planeGeometry args={[5.8, 4.6]} />
        <meshStandardMaterial color="#162440" roughness={0.9} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 2.2, -5.5]}>
        <boxGeometry args={[12, 4.4, 0.12]} />
        <meshStandardMaterial color="#0E1C32" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-5.5, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[12, 4.4, 0.12]} />
        <meshStandardMaterial color="#0C1A2E" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Cyan LED cove — back wall base */}
      <mesh position={[0, 0.05, -5.44]}>
        <boxGeometry args={[11.6, 0.05, 0.03]} />
        <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={1.2} />
      </mesh>
      {/* Cyan LED cove — left wall base */}
      <mesh position={[-5.44, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[11.6, 0.05, 0.03]} />
        <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={1.2} />
      </mesh>

      {/* Panoramic back window */}
      <group position={[0.3, 2.35, -5.42]}>
        <mesh>
          <boxGeometry args={[3.4, 1.9, 0.05]} />
          <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[3.15, 1.65]} />
          <meshStandardMaterial color="#0369A1" emissive="#075985" emissiveIntensity={0.5} roughness={0.1} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Sleek low-profile sofa */}
      <group position={[0, 0, -2.9]}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[3.0, 0.38, 1.0]} />
          <meshStandardMaterial color="#1E3A5F" roughness={0.65} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.44, 0.04]}>
          <boxGeometry args={[3.0, 0.1, 0.9]} />
          <meshStandardMaterial color="#274575" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.72, -0.38]}>
          <boxGeometry args={[3.0, 0.6, 0.2]} />
          <meshStandardMaterial color="#1E3A5F" roughness={0.65} />
        </mesh>
      </group>

      {/* Glass coffee table */}
      <group position={[0.1, 0, -0.9]}>
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[1.6, 0.04, 0.9]} />
          <meshStandardMaterial color="#38BDF8" transparent opacity={0.28} roughness={0.05} metalness={0.9} />
        </mesh>
        {[[-0.68, -0.34], [0.68, -0.34], [-0.68, 0.34], [0.68, 0.34]].map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.19, lz]}>
            <cylinderGeometry args={[0.022, 0.022, 0.38, 10]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
      </group>

      {/* TX Router pedestal — back left */}
      <mesh position={[-4.4, 0.45, -4.4]}>
        <cylinderGeometry args={[0.32, 0.36, 0.9, 20]} />
        <meshStandardMaterial color="#0F172A" metalness={0.6} roughness={0.25} />
      </mesh>
    </group>
  )
}

// ─── TX/RX sensor node ────────────────────────────────────────────────────────
function SensorNode({ position, accent = '#06B6D4' }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.36, 0.08, 0.44]} />
        <meshStandardMaterial color="#0A1120" metalness={0.75} roughness={0.2} />
      </mesh>
      {[0.09, -0.09].map((ox, i) => (
        <mesh key={i} position={[ox, 0.22, -0.09]}>
          <cylinderGeometry args={[0.016, 0.016, 0.4, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 0.055, 0.22]}>
        <boxGeometry args={[0.16, 0.022, 0.018]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.0} />
      </mesh>
    </group>
  )
}

// ─── WiFi pulse rings at sensor ──────────────────────────────────────────────
function WifiPulseRings({ position, color = '#06B6D4' }) {
  const rings = [useRef(), useRef(), useRef()]
  useFrame((state) => {
    const t = state.clock.elapsedTime
    rings.forEach((ref, idx) => {
      if (!ref.current) return
      const phase = (t * 0.75 + idx * 0.33) % 1
      ref.current.scale.set(0.4 + phase * 4.5, 0.4 + phase * 4.5, 1)
      if (ref.current.material) ref.current.material.opacity = (1 - phase) * 0.4
    })
  })
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {rings.map((ref, i) => (
        <mesh key={i} ref={ref}>
          <ringGeometry args={[0.26, 0.3, 48]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Smooth sculpted human figure ────────────────────────────────────────────
function HumanSubject({ activity, breathingBpm = 16 }) {
  const rootRef    = useRef()
  const leftLegRef = useRef()
  const rightLegRef= useRef()
  const leftArmRef = useRef()
  const rightArmRef= useRef()
  const auraRef    = useRef()
  const norm = normalizeActivity(activity)

  const bodyColor =
    norm === 'fall'  ? '#EF4444' :
    norm === 'walk'  ? '#38BDF8' :
    norm === 'jump'  ? '#F59E0B' :
    norm === 'sit'   ? '#2DD4BF' : '#22D3EE'

  useFrame((state) => {
    if (!rootRef.current) return
    const t = state.clock.elapsedTime
    const breathFreq = Math.max(0.2, (breathingBpm / 60) * Math.PI * 2)

    rootRef.current.rotation.set(0, 0, 0)
    ;[leftLegRef, rightLegRef, leftArmRef, rightArmRef].forEach((r) => {
      if (r.current) r.current.rotation.set(0, 0, 0)
    })

    if (norm === 'walk') {
      const px = Math.sin(t * 1.1) * 1.7
      const pz = 0.5 + Math.cos(t * 0.8) * 0.7
      rootRef.current.position.set(px, Math.abs(Math.sin(t * 5.2)) * 0.05, pz)
      rootRef.current.rotation.y = Math.atan2(Math.cos(t * 1.1) * 1.1, Math.sin(t * 0.8) * 0.8)
      const sw = Math.sin(t * 5.2) * 0.55
      if (leftLegRef.current)  leftLegRef.current.rotation.x  =  sw
      if (rightLegRef.current) rightLegRef.current.rotation.x = -sw
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = -sw * 0.75
      if (rightArmRef.current) rightArmRef.current.rotation.x =  sw * 0.75
    } else if (norm === 'jump') {
      const hop = Math.abs(Math.sin(t * 4.5))
      rootRef.current.position.set(0.1, hop * 0.65, 0.4)
      if (leftArmRef.current)  leftArmRef.current.rotation.z  =  0.45 + hop * 0.9
      if (rightArmRef.current) rightArmRef.current.rotation.z = -(0.45 + hop * 0.9)
    } else if (norm === 'sit') {
      rootRef.current.position.set(0.1, 0.34, -2.5)
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = -Math.PI / 2.2
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.PI / 2.2
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = -0.35
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.35
    } else if (norm === 'fall') {
      rootRef.current.position.set(0.15, 0.18, 0.65)
      rootRef.current.rotation.z = Math.PI / 2
      rootRef.current.rotation.y = 0.35
      if (leftArmRef.current)  leftArmRef.current.rotation.z  =  0.5
      if (rightArmRef.current) rightArmRef.current.rotation.z = -0.45
    } else {
      rootRef.current.position.set(0.1, Math.sin(t * breathFreq) * 0.014, 0.45)
    }

    if (auraRef.current) {
      auraRef.current.position.x = rootRef.current.position.x
      auraRef.current.position.z = rootRef.current.position.z
      const pulse = norm === 'fall'
        ? 1 + Math.sin(t * 7) * 0.22
        : 1 + Math.sin(t * breathFreq) * 0.11
      auraRef.current.scale.set(pulse, pulse, 1)
    }
  })

  const mat = { color: bodyColor, emissive: bodyColor, emissiveIntensity: 0.55, roughness: 0.25, transparent: true, opacity: 0.92 }

  return (
    <group>
      {/* Breathing aura ring */}
      <mesh ref={auraRef} rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.022, 0.45]}>
        <ringGeometry args={[0.58, 0.72, 56]} />
        <meshStandardMaterial
          color={bodyColor} emissive={bodyColor}
          emissiveIntensity={norm === 'fall' ? 2.2 : 1.1}
          transparent opacity={0.88}
        />
      </mesh>

      {/* Figure root */}
      <group ref={rootRef} position={[0.1, 0, 0.45]}>
        {/* Head — smooth sphere */}
        <mesh position={[0, 1.58, 0]}>
          <sphereGeometry args={[0.135, 24, 24]} />
          <meshStandardMaterial color="#E2E8F0" emissive={bodyColor} emissiveIntensity={0.3} roughness={0.25} />
        </mesh>
        {/* Neck */}
        <mesh position={[0, 1.41, 0]}>
          <capsuleGeometry args={[0.044, 0.08, 6, 10]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.35} />
        </mesh>
        {/* Torso — sculpted capsule */}
        <mesh position={[0, 1.1, 0]}>
          <capsuleGeometry args={[0.165, 0.38, 8, 16]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        {/* Hips */}
        <mesh position={[0, 0.8, 0]}>
          <capsuleGeometry args={[0.14, 0.12, 6, 12]} />
          <meshStandardMaterial color="#1E293B" roughness={0.5} />
        </mesh>

        {/* Left arm */}
        <group ref={leftArmRef} position={[-0.235, 1.3, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.048, 0.32, 6, 10]} />
            <meshStandardMaterial {...mat} />
          </mesh>
          <mesh position={[0, -0.42, 0]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#CBD5E1" roughness={0.3} />
          </mesh>
        </group>
        {/* Right arm */}
        <group ref={rightArmRef} position={[0.235, 1.3, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.048, 0.32, 6, 10]} />
            <meshStandardMaterial {...mat} />
          </mesh>
          <mesh position={[0, -0.42, 0]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#CBD5E1" roughness={0.3} />
          </mesh>
        </group>
        {/* Left leg */}
        <group ref={leftLegRef} position={[-0.1, 0.72, 0]}>
          <mesh position={[0, -0.32, 0]}>
            <capsuleGeometry args={[0.065, 0.5, 6, 10]} />
            <meshStandardMaterial color="#1E293B" roughness={0.5} />
          </mesh>
        </group>
        {/* Right leg */}
        <group ref={rightLegRef} position={[0.1, 0.72, 0]}>
          <mesh position={[0, -0.32, 0]}>
            <capsuleGeometry args={[0.065, 0.5, 6, 10]} />
            <meshStandardMaterial color="#1E293B" roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

// ─── Animated signal path ─────────────────────────────────────────────────────
function SignalPath({ from, to, color = '#06B6D4' }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current?.material)
      ref.current.material.opacity = 0.28 + Math.sin(state.clock.elapsedTime * 3) * 0.2
  })
  return (
    <Line ref={ref} points={[from, to]} color={color} lineWidth={1.6} transparent opacity={0.4} />
  )
}

// ─── Main exported visualization ─────────────────────────────────────────────
function Room3DVisualization({
  activity    = 'stand',
  confidence  = 0.88,
  rssi        = -54,
  breathingBpm= 16,
  roomName    = 'Living Room',
  fullScreen  = false,
}) {
  const norm    = normalizeActivity(activity)
  const isFall  = norm === 'fall'
  const accent  = isFall ? '#EF4444' : '#06B6D4'
  const subjectTarget =
    norm === 'sit'  ? [0.1, 0.9, -2.5] :
    norm === 'fall' ? [0.15, 0.25, 0.65] : [0.1, 1.0, 0.45]

  return (
    <div
      className={`relative w-full bg-[#0A1628] overflow-hidden`}
      style={{ height: fullScreen ? '100%' : '420px' }}
    >
      <Canvas
        camera={{ position: [5.4, 4.2, 5.4], fov: 40 }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#0A1628']} />
        <fog attach="fog" args={['#0A1628', 13, 25]} />

        {/* Lighting — boosted for visibility */}
        <ambientLight intensity={0.90} />
        <directionalLight position={[7, 14, 5]} intensity={1.2} color="#D8EEFF" castShadow />
        {/* Warm accent from lamp corner */}
        <pointLight position={[3.5, 2.0, -3.0]} intensity={2.2} color="#FDE68A" distance={10} />
        {/* Coloured fill from sensor area */}
        <pointLight position={[-4.4, 2.0, -4.4]} intensity={2.4} color={accent} distance={14} />
        {/* Subject fill light */}
        <pointLight position={[0.1, 2.5, 0.5]} intensity={1.6} color={isFall ? '#F87171' : '#67E8F9'} distance={8} />
        {/* General room fill */}
        <pointLight position={[2, 3.5, 2]} intensity={1.0} color="#C7D9FF" distance={12} />

        <SpatialRoom />
        <RadarFloorRings color={accent} count={5} />

        <SensorNode position={[-4.4, 0.95, -4.4]} accent={accent} />
        <WifiPulseRings position={[-4.4, 0.97, -4.4]} color={accent} />
        <SensorNode position={[4.4, 1.25, -4.4]} accent="#38BDF8" />

        <HumanSubject activity={activity} breathingBpm={breathingBpm} />

        <SignalPath from={[-4.4, 0.95, -4.4]} to={[4.4, 1.25, -4.4]} color="#1E3A5F" />
        <SignalPath from={[-4.4, 0.95, -4.4]} to={subjectTarget} color={accent} />
        <SignalPath from={subjectTarget} to={[4.4, 1.25, -4.4]} color={accent} />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={14} blur={2.5} far={5} />
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={14}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  )
}

export default Room3DVisualization
