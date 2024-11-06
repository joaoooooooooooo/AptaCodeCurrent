import * as THREE from 'three'
import { useMemo, useRef, useCallback, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, CameraShake, Icosahedron } from '@react-three/drei'

// Function to create a circular texture
function createCircleTexture(size = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) return null

  context.beginPath()
  context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  context.fillStyle = 'white'
  context.fill()

  return new THREE.CanvasTexture(canvas)
}

// Functions to create positions for different shapes
function createTorusPositions(count, radius = 4, tubeRadius = 1) {
  const positions = new Float32Array(count * 2)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI * 2
    const randomOffset = Math.random() * 0.956 - 0.25 // Random offset for dispersion
    positions.set(
      [
        (radius + tubeRadius * Math.cos(phi)) * Math.cos(theta) + randomOffset,
        (radius + tubeRadius * Math.cos(phi)) * Math.sin(theta) + randomOffset,
        tubeRadius * Math.sin(phi) + randomOffset
      ],
      i * 3
    )
  }
  return positions
}

function createIcosahedronPositions(count, radius = 5) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions.set([radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi)], i * 3)
  }
  return positions
}

function createSpherePositions(count, radius = 5) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions.set([radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi)], i * 3)
  }
  return positions
}

function createBoxPositions(count, size = 6) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions.set([(Math.random() - 0.5) * size, (Math.random() - 0) * size, (Math.random() - 0.5) * size], i * 3)
  }
  return positions
}

function createTorusKnotPositions(count, tubeRadius = 1.7, tube = 3, p = 3, q = 3) {
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 3
    const phi = Math.random() * Math.PI * 2
    const randomOffset = Math.random() * 2 - 0.25 // Random offset for dispersion

    // TorusKnot-specific calculations
    const cosQTheta = Math.cos(q * phi)
    const sinQTheta = Math.sin(q * theta)
    const cosPTheta = Math.cos(p * theta)
    const sinPTheta = Math.sin(p * theta)

    // Adjust calculations to make the tube more prominent
    const x = (tubeRadius + tube * cosQTheta) * cosPTheta + randomOffset
    const y = (tubeRadius + tube * cosQTheta) * sinPTheta + randomOffset
    const z = tube * sinQTheta + randomOffset

    positions.set([x, y, z], i * 2.5)
  }

  return positions
}

function Particles({ count, shapeType, hoverFactor, particleSize, particleColor, disableHover }) {
  const black = new THREE.Color('black')
  const baseColor = new THREE.Color(particleColor)
  const radius = 2 // Size of the hover effect range

  const [hoveredIndex, setHoveredIndex] = useState(null)
  const originalPositions = useRef(new Float32Array(count * 3))
  const targetPositions = useRef(new Float32Array(count * 3))

  const shapeGenerators = {
    TorusKnot: createTorusKnotPositions,
    Torus: createTorusPositions,
    Icosahedron: createIcosahedronPositions,
    Sphere: createSpherePositions,
    Box: createBoxPositions
  }

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    const selectedShape = shapeGenerators[shapeType]
    const shapePositions = selectedShape(count)
    positions.set(shapePositions)
    originalPositions.current.set(shapePositions)
    targetPositions.current.set(shapePositions)

    for (let i = 0; i < count; i++) {
      baseColor.toArray(colors, i * 3)
    }

    return [positions, colors]
  }, [count, shapeType, particleColor])

  const points = useRef(null)
  const circleTexture = useMemo(() => createCircleTexture(), [])

  const hover = useCallback(
    (e) => {
      if (disableHover) return
      e.stopPropagation()
      const index = e.index
      setHoveredIndex(index)
      black.toArray(points.current.geometry.attributes.color.array, index * 3)
      points.current.geometry.attributes.color.needsUpdate = false
    },
    [disableHover]
  )

  const unhover = useCallback(
    (e) => {
      if (disableHover) return
      setHoveredIndex(null)
      baseColor.toArray(points.current.geometry.attributes.color.array, e.index * 3)
      points.current.geometry.attributes.color.needsUpdate = false
    },
    [disableHover]
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const hoverDist = 2 // Reduced from 5 to 3 for a smaller hover effect radius
    const smoothFactor = 0.1 // Adjust this for smoother transitions back to the original position
    const distortionStrength = 5 // Reduced from 10 for a less aggressive dispersion

    positions.forEach((p, i) => {
      const originalPos = originalPositions.current.slice(i * 3, i * 3 + 3)
      const targetPos = targetPositions.current.slice(i * 3, i * 3 + 3)
      const distanceToHovered =
        hoveredIndex !== null
          ? Math.sqrt(
              Math.pow(positions[i * 3] - positions[hoveredIndex * 3], 2) +
                Math.pow(positions[i * 3 + 1] - positions[hoveredIndex * 3 + 1], 2) +
                Math.pow(positions[i * 3 + 2] - positions[hoveredIndex * 3 + 2], 2)
            )
          : Infinity

      if (distanceToHovered < hoverDist && hoveredIndex !== null) {
        // Apply a one-time directional push away from the hover center
        const direction = [
          positions[i * 3] - positions[hoveredIndex * 3],
          positions[i * 3 + 1] - positions[hoveredIndex * 3 + 1],
          positions[i * 3 + 2] - positions[hoveredIndex * 3 + 2]
        ]
        const length = Math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2)
        direction[0] /= length
        direction[1] /= length
        direction[1] /= length
        targetPos[0] = originalPos[0] + direction[0] * distortionStrength
        targetPos[1] = originalPos[1] + direction[1] * distortionStrength
        targetPos[2] = originalPos[2] + direction[2] * distortionStrength
      } else {
        // Smooth return to original position if not in hover effect radius
        targetPos[0] = THREE.MathUtils.lerp(targetPos[0], originalPos[0], smoothFactor)
        targetPos[1] = THREE.MathUtils.lerp(targetPos[1], originalPos[1], smoothFactor)
        targetPos[2] = THREE.MathUtils.lerp(targetPos[2], originalPos[2], smoothFactor)
      }

      positions[i * 3] = THREE.MathUtils.lerp(positions[i * 3], targetPos[0], smoothFactor)
      positions[i * 3 + 1] = THREE.MathUtils.lerp(positions[i * 3 + 1], targetPos[1], smoothFactor)
      positions[i * 3 + 2] = THREE.MathUtils.lerp(positions[i * 3 + 2], targetPos[2], smoothFactor)
    })

    points.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={points} onPointerOver={hover} onPointerOut={unhover}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        attach="material"
        size={particleSize}
        sizeAttenuation={true}
        map={circleTexture} // Use the circular texture
        alphaTest={0.5}
        transparent={true}
        vertexColors={true}
        opacity={1}
      />
    </points>
  )
}

export default function App() {
  // Default values
  const autoRotateSpeed = 1
  const zoomSpeed = 0
  const particleCount = 10000
  const fogColor = '#c1c1c1'
  const fogNear = 6.6
  const fogFar = 13
  const hoverFactor = 100
  const disableHover = false
  const shapeType = 'TorusKnot'
  const backgroundColor = '#eeeeee'
  const particleSize = 0.03
  const particleColor = '#030303'

  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 10], fov: 90 }} style={{ background: backgroundColor }}>
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
      <Particles
        count={particleCount}
        shapeType={shapeType}
        hoverFactor={hoverFactor}
        particleSize={particleSize}
        particleColor={particleColor}
        disableHover={disableHover}
      />
      <OrbitControls
        makeDefault
        enableZoom={false} // Disables zooming
        enablePan={false} // Disables panning
        autoRotate
        autoRotateSpeed={autoRotateSpeed}
      />
      <CameraShake yawFrequency={0.13} maxYaw={1} pitchFrequency={1} maxPitch={0.1} rollFrequency={0} maxRoll={1} intensity={0.2} />
    </Canvas>
  )
}
