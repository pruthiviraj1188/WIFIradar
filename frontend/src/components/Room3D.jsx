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

function HouseLivingRoom() {
  return (
    <group>
      {/* Warm hardwood floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#C8A882" roughness={0.78} />
      </mesh>

      {/* Subtle wood plank lines */}
      {[-4, -2.5, -1, 0.5, 2, 3.5].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, z]}>
          <planeGeometry args={[10, 0.025]} />
          <meshStandardMaterial color="#B08E67" roughness={0.9} />
        </mesh>
      ))}

      {/* Cozy woven area rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.012, 0.2]}>
        <planeGeometry args={[5.2, 4.0]} />
        <meshStandardMaterial color="#EAE3D2" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.015, 0.2]}>
        <planeGeometry args={[4.8, 3.6]} />
        <meshStandardMaterial color="#D9CEB8" roughness={0.95} />
      </mesh>

      {/* Back & Left House Walls */}
      <mesh position={[0, 2.2, -5]}>
        <boxGeometry args={[10, 4.4, 0.14]} />
        <meshStandardMaterial color="#F2EFE8" roughness={0.9} />
      </mesh>
      <mesh position={[-5, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 4.4, 0.14]} />
        <meshStandardMaterial color="#EAE6DD" roughness={0.9} />
      </mesh>

      {/* White wooden baseboards */}
      <mesh position={[0, 0.09, -4.91]}>
        <boxGeometry args={[10, 0.18, 0.05]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
      </mesh>
      <mesh position={[-4.91, 0.09, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 0.18, 0.05]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
      </mesh>

      {/* Window on Back Wall */}
      <group position={[0.2, 2.4, -4.9]}>
        <mesh>
          <boxGeometry args={[2.5, 1.7, 0.06]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[2.25, 1.45]} />
          <meshStandardMaterial color="#BAE6FD" emissive="#7DD3FC" emissiveIntensity={0.25} roughness={0.2} />
        </mesh>
        {/* Window crossbars */}
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.06, 1.45, 0.02]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[2.25, 0.06, 0.02]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Curtains */}
        <mesh position={[-1.35, -0.1, 0.08]}>
          <boxGeometry args={[0.42, 2.1, 0.08]} />
          <meshStandardMaterial color="#94A3B8" roughness={0.85} />
        </mesh>
        <mesh position={[1.35, -0.1, 0.08]}>
          <boxGeometry args={[0.42, 2.1, 0.08]} />
          <meshStandardMaterial color="#94A3B8" roughness={0.85} />
        </mesh>
      </group>

      {/* Wooden Door on Left Wall */}
      <group position={[-4.9, 1.25, -2.6]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.25, 2.5, 0.08]} />
          <meshStandardMaterial color="#8B5A2B" roughness={0.7} />
        </mesh>
        <mesh position={[0.45, -0.05, 0.07]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#EAB308" metalness={0.7} roughness={0.25} />
        </mesh>
      </group>

      {/* Framed Wall Art on Left Wall */}
      <group position={[-4.91, 2.45, 1.4]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.3, 0.95, 0.05]} />
          <meshStandardMaterial color="#5C4033" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[1.12, 0.78]} />
          <meshStandardMaterial color="#D97757" roughness={0.8} />
        </mesh>
      </group>

      {/* Living Room Sofa (against back wall, person sits here during 'sit') */}
      <group position={[0, 0, -2.65]}>
        {/* Sofa Base */}
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[2.8, 0.48, 1.05]} />
          <meshStandardMaterial color="#475569" roughness={0.85} />
        </mesh>
        {/* Seat Cushions */}
        <mesh position={[-0.65, 0.52, 0.04]}>
          <boxGeometry args={[1.15, 0.14, 0.92]} />
          <meshStandardMaterial color="#64748B" roughness={0.85} />
        </mesh>
        <mesh position={[0.65, 0.52, 0.04]}>
          <boxGeometry args={[1.15, 0.14, 0.92]} />
          <meshStandardMaterial color="#64748B" roughness={0.85} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.78, -0.4]}>
          <boxGeometry args={[2.8, 0.72, 0.26]} />
          <meshStandardMaterial color="#475569" roughness={0.85} />
        </mesh>
        {/* Armrests */}
        <mesh position={[-1.32, 0.56, 0]}>
          <boxGeometry args={[0.22, 0.42, 1.05]} />
          <meshStandardMaterial color="#334155" roughness={0.85} />
        </mesh>
        <mesh position={[1.32, 0.56, 0]}>
          <boxGeometry args={[0.22, 0.42, 1.05]} />
          <meshStandardMaterial color="#334155" roughness={0.85} />
        </mesh>
        {/* Throw Pillow */}
        <mesh position={[-0.95, 0.74, -0.15]} rotation={[0.2, 0.3, 0]}>
          <boxGeometry args={[0.38, 0.36, 0.14]} />
          <meshStandardMaterial color="#E07A5F" roughness={0.85} />
        </mesh>
      </group>

      {/* Coffee Table */}
      <group position={[0.1, 0, -0.9]}>
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[1.5, 0.08, 0.85]} />
          <meshStandardMaterial color="#7C5338" roughness={0.55} />
        </mesh>
        {[[-0.62, -0.32], [0.62, -0.32], [-0.62, 0.32], [0.62, 0.32]].map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.2, lz]}>
            <cylinderGeometry args={[0.035, 0.03, 0.4, 8]} />
            <meshStandardMaterial color="#4A3222" roughness={0.6} />
          </mesh>
        ))}
        {/* Mug on table */}
        <mesh position={[0.35, 0.51, 0.1]}>
          <cylinderGeometry args={[0.05, 0.045, 0.1, 12]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
        </mesh>
      </group>

      {/* TV Console + Flatscreen TV on Left Wall */}
      <group position={[-4.45, 0, 1.4]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[2.1, 0.64, 0.55]} />
          <meshStandardMaterial color="#6B4423" roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.12, -0.05]}>
          <boxGeometry args={[1.75, 0.98, 0.06]} />
          <meshStandardMaterial color="#111827" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.68, -0.05]}>
          <boxGeometry args={[0.25, 0.12, 0.12]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      </group>

      {/* Floor Lamp (Back Right Corner) */}
      <group position={[3.7, 0, -3.5]}>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.22, 0.24, 0.06, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.75, 10]} />
          <meshStandardMaterial color="#475569" metalness={0.5} />
        </mesh>
        <mesh position={[0, 1.82, 0]}>
          <cylinderGeometry args={[0.18, 0.32, 0.38, 16]} />
          <meshStandardMaterial color="#FEF3C7" emissive="#FDE68A" emissiveIntensity={0.45} roughness={0.7} />
        </mesh>
      </group>

      {/* Potted Indoor Plant */}
      <group position={[-4.0, 0, 3.8]}>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.24, 0.18, 0.44, 14]} />
          <meshStandardMaterial color="#B45309" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <sphereGeometry args={[0.34, 12, 12]} />
          <meshStandardMaterial color="#2E7D32" roughness={0.85} />
        </mesh>
        <mesh position={[0.18, 0.78, -0.1]}>
          <sphereGeometry args={[0.22, 10, 10]} />
          <meshStandardMaterial color="#388E3C" roughness={0.85} />
        </mesh>
      </group>

      {/* Small Side Table for Wi-Fi Router */}
      <mesh position={[-4.1, 0.42, -4.1]}>
        <boxGeometry args={[0.75, 0.84, 0.75]} />
        <meshStandardMaterial color="#7C5338" roughness={0.65} />
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
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

function HumanSubject({ activity }) {
  const rootRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const alertRingRef = useRef()
  const norm = normalizeActivity(activity)

  const shirtColor =
    norm === 'fall' ? '#DC2626' :
    norm === 'walk' ? '#2563EB' :
    norm === 'jump' ? '#D97706' :
    norm === 'sit'  ? '#0D9488' : '#1E6B47'

  useFrame((state) => {
    if (!rootRef.current) return
    const t = state.clock.elapsedTime

    // Reset rotations
    rootRef.current.rotation.set(0, 0, 0)
    if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0)
    if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, 0)
    if (leftArmRef.current) leftArmRef.current.rotation.set(0, 0, 0)
    if (rightArmRef.current) rightArmRef.current.rotation.set(0, 0, 0)

    if (norm === 'walk') {
      const px = Math.sin(t * 1.1) * 1.65
      const pz = 0.5 + Math.cos(t * 0.8) * 0.65
      const dx = Math.cos(t * 1.1) * 1.65 * 1.1
      const dz = -Math.sin(t * 0.8) * 0.65 * 0.8
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
      // Seated naturally on the living room sofa facing forward (+Z)
      rootRef.current.position.set(0.1, 0.34, -2.35)
      if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.PI / 2.2
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.PI / 2.2
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.35
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.35
    } else if (norm === 'fall') {
      // Lying on the living room rug
      rootRef.current.position.set(0.15, 0.18, 0.65)
      rootRef.current.rotation.z = Math.PI / 2
      rootRef.current.rotation.y = 0.35
      if (leftArmRef.current) leftArmRef.current.rotation.z = 0.5
      if (rightArmRef.current) rightArmRef.current.rotation.z = -0.45
      if (alertRingRef.current) {
        const s = 1 + Math.sin(t * 6) * 0.14
        alertRingRef.current.scale.set(s, s, 1)
      }
    } else {
      // Standing upright on the rug with subtle breathing sway
      rootRef.current.position.set(0.1, Math.sin(t * 1.6) * 0.015, 0.45)
    }
  })

  return (
    <group>
      {/* Pulsing red alert ring on floor during fall */}
      {norm === 'fall' && (
        <mesh ref={alertRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0.15, 0.025, 0.65]}>
          <ringGeometry args={[0.75, 0.95, 32]} />
          <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.8} transparent opacity={0.85} />
        </mesh>
      )}

      {/* Articulated Human Figure (origin at feet y = 0) */}
      <group ref={rootRef} position={[0.1, 0, 0.45]}>
        {/* Head */}
        <mesh position={[0, 1.56, 0]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color="#F1C27D" roughness={0.6} />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 1.63, -0.02]}>
          <sphereGeometry args={[0.145, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial color="#2C221E" roughness={0.85} />
        </mesh>
        {/* Neck */}
        <mesh position={[0, 1.39, 0]}>
          <cylinderGeometry args={[0.05, 0.055, 0.1, 10]} />
          <meshStandardMaterial color="#F1C27D" roughness={0.6} />
        </mesh>

        {/* Torso (Shirt) */}
        <mesh position={[0, 1.12, 0]}>
          <boxGeometry args={[0.36, 0.48, 0.2]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} />
        </mesh>

        {/* Pelvis (Trousers) */}
        <mesh position={[0, 0.82, 0]}>
          <boxGeometry args={[0.34, 0.16, 0.19]} />
          <meshStandardMaterial color="#1E293B" roughness={0.8} />
        </mesh>

        {/* Left Arm (shoulder pivot at y=1.32) */}
        <group ref={leftArmRef} position={[-0.24, 1.32, 0]}>
          <mesh position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.055, 0.34, 6, 10]} />
            <meshStandardMaterial color={shirtColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.45, 0]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color="#F1C27D" roughness={0.6} />
          </mesh>
        </group>

        {/* Right Arm (shoulder pivot at y=1.32) */}
        <group ref={rightArmRef} position={[0.24, 1.32, 0]}>
          <mesh position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.055, 0.34, 6, 10]} />
            <meshStandardMaterial color={shirtColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.45, 0]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color="#F1C27D" roughness={0.6} />
          </mesh>
        </group>

        {/* Left Leg (hip pivot at y=0.75) */}
        <group ref={leftLegRef} position={[-0.1, 0.75, 0]}>
          <mesh position={[0, -0.34, 0]}>
            <capsuleGeometry args={[0.07, 0.52, 6, 10]} />
            <meshStandardMaterial color="#1E293B" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.68, 0.04]}>
            <boxGeometry args={[0.11, 0.08, 0.2]} />
            <meshStandardMaterial color="#111827" roughness={0.7} />
          </mesh>
        </group>

        {/* Right Leg (hip pivot at y=0.75) */}
        <group ref={rightLegRef} position={[0.1, 0.75, 0]}>
          <mesh position={[0, -0.34, 0]}>
            <capsuleGeometry args={[0.07, 0.52, 6, 10]} />
            <meshStandardMaterial color="#1E293B" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.68, 0.04]}>
            <boxGeometry args={[0.11, 0.08, 0.2]} />
            <meshStandardMaterial color="#111827" roughness={0.7} />
          </mesh>
        </group>
      </group>
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

function WifiPulseRings({ position, color = '#1E6B47' }) {
  const ring1 = useRef()
  const ring2 = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    ;[ring1, ring2].forEach((ref, idx) => {
      if (!ref.current) return
      const phase = (t * 0.8 + idx * 0.5) % 1
      const scale = 0.4 + phase * 2.4
      ref.current.scale.set(scale, scale, 1)
      if (ref.current.material) {
        ref.current.material.opacity = (1 - phase) * 0.45
      }
    })
  })

  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={ring1}>
        <ringGeometry args={[0.25, 0.3, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.4} />
      </mesh>
      <mesh ref={ring2}>
        <ringGeometry args={[0.25, 0.3, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.4} />
      </mesh>
    </group>
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
  const subjectTarget =
    norm === 'sit'  ? [0.1, 0.9, -2.35] :
    norm === 'fall' ? [0.15, 0.25, 0.65] : [0.1, 1.0, 0.45]

  return (
    <div className="relative w-full h-[380px] bg-[#EFECE4] border border-hairline rounded-md overflow-hidden">
      <Canvas camera={{ position: [7.6, 6.2, 7.6], fov: 46 }}>
        <color attach="background" args={['#EFECE4']} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[8, 12, 6]} intensity={0.9} />
        <pointLight position={[3.7, 2.0, -3.5]} intensity={0.45} color="#FDE68A" />

        <HouseLivingRoom />
        <SensorNode position={[-4.1, 0.9, -4.1]} accent="#1E6B47" />
        <WifiPulseRings position={[-4.1, 0.92, -4.1]} color={isFall ? '#B42318' : '#1E6B47'} />
        <SensorNode position={[4.1, 1.2, -4.1]} accent="#181816" />
        <HumanSubject activity={activity} />

        <SignalPath from={[-4.1, 0.9, -4.1]} to={[4.1, 1.2, -4.1]} color="#7D7970" />
        <SignalPath
          from={[-4.1, 0.9, -4.1]}
          to={subjectTarget}
          color={isFall ? '#B42318' : '#1E6B47'}
        />
        <SignalPath
          from={subjectTarget}
          to={[4.1, 1.2, -4.1]}
          color={isFall ? '#B42318' : '#1E6B47'}
        />

        <OrbitControls enablePan={false} minDistance={5} maxDistance={16} />
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
