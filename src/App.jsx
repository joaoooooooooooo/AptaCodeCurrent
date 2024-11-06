import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, CameraShake } from '@react-three/drei'
import { Leva, useControls, folder } from 'leva'

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
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI * 2
    positions.set(
      [(radius + tubeRadius * Math.cos(phi)) * Math.cos(theta), (radius + tubeRadius * Math.cos(phi)) * Math.sin(theta), tubeRadius * Math.sin(phi)],
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
    positions.set([(Math.random() - 0.5) * size, (Math.random() - 0.5) * size, (Math.random() - 0.5) * size], i * 3)
  }
  return positions
}

function createCloudPositions(count, tubeRadius = 1.7, tube = 3, p = 2.1, q = 1) {
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI * 2

    // TorusKnot-specific calculations
    const cosQTheta = Math.cos(q * phi)
    const sinQTheta = Math.sin(q * theta)
    const cosPTheta = Math.cos(p * theta)
    const sinPTheta = Math.sin(p * theta)

    // Adjust calculations to make the tube more prominent
    const x = (tubeRadius + tube * cosQTheta) * cosPTheta
    const y = (tubeRadius + tube * cosQTheta) * sinPTheta
    const z = tube * sinQTheta

    positions.set([x, y, z], i * 2.7)
  }

  return positions
}

function createTorusKnotPositions(count, tubeRadius = 1.7, tube = 3, p = 3, q = 3) {
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI * 2

    // TorusKnot-specific calculations
    const cosQTheta = Math.cos(q * phi)
    const sinQTheta = Math.sin(q * theta)
    const cosPTheta = Math.cos(p * theta)
    const sinPTheta = Math.sin(p * theta)

    // Adjust calculations to make the tube more prominent
    const x = (tubeRadius + tube * cosQTheta) * cosPTheta
    const y = (tubeRadius + tube * cosQTheta) * sinPTheta
    const z = tube * sinQTheta

    positions.set([x, y, z], i * 3)
  }

  return positions
}

// Function to create positions for a Mobius Strip
function createMobiusStripPositions(count, radius = 3, width = 4) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2 // u ∈ [0, 2π]
    const v = (Math.random() - 0.15) * width // v ∈ [-width/2, width/2]

    const x = (radius + v * Math.cos(u / 2)) * Math.cos(u)
    const y = (radius + v * Math.cos(u / 2)) * Math.sin(u)
    const z = v * Math.sin(u / 2)

    positions.set([x, y, z], i * 2.9)
  }
  return positions
}

// Function to create positions for a Trefoil Knot
function createTrefoilKnotPositions(count, scale = 7) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2 // t ∈ [0, 2π]

    const x = scale * Math.sin(t) + 2 * Math.sin(2 * t)
    const y = scale * Math.cos(t) - 2 * Math.cos(1 * t)
    const z = -Math.sin(3 * t)

    positions.set([y, z], i * 1.5)
  }
  return positions
}

function Particles({ count, shapeType, particleSize, particleColor, interactions, movement }) {
  const baseColor = new THREE.Color(particleColor)
  const velocities = useRef(new Float32Array(count * 3))
  const originalPositions = useRef(new Float32Array(count * 3))

  const shapeGenerators = {
    TorusKnot: createTorusKnotPositions,
    Torus: createTorusPositions,
    Icosahedron: createIcosahedronPositions,
    Sphere: createSpherePositions,
    Box: createBoxPositions,
    MobiusStrip: createMobiusStripPositions,
    TrefoilKnot: createTrefoilKnotPositions,
    Cloud: createCloudPositions
  }

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    const selectedShape = shapeGenerators[shapeType]
    const shapePositions = selectedShape(count)
    positions.set(shapePositions)
    originalPositions.current.set(shapePositions)

    for (let i = 0; i < count; i++) {
      baseColor.toArray(colors, i * 3)

      // Initialize velocities
      velocities.current[i * 3 + 0] = (Math.random() - 0.5) * movement.speed
      velocities.current[i * 3 + 1] = (Math.random() - 0.5) * movement.speed
      velocities.current[i * 3 + 2] = (Math.random() - 0.5) * movement.speed
    }

    return [positions, colors]
  }, [count, shapeType, particleColor, movement.speed])

  const points = useRef(null)

  // Pre-allocate vectors and objects for performance
  const mouseNDC = useRef(new THREE.Vector2())
  const raycaster = useRef(new THREE.Raycaster())
  const planeNormal = useRef(new THREE.Vector3())
  const plane = useRef(new THREE.Plane())
  const mousePosition = useRef(new THREE.Vector3())

  // Create circle texture
  const circleTexture = useMemo(() => createCircleTexture(), [])

  useFrame((state) => {
    // Update mouse position in NDC
    mouseNDC.current.set(state.mouse.x, state.mouse.y)

    // Update raycaster
    raycaster.current.setFromCamera(mouseNDC.current, state.camera)

    // Update plane perpendicular to camera, passing through origin
    state.camera.getWorldDirection(planeNormal.current).normalize()
    plane.current.setFromNormalAndCoplanarPoint(planeNormal.current, new THREE.Vector3(0, 0, 0))

    // Intersect ray with plane
    raycaster.current.ray.intersectPlane(plane.current, mousePosition.current)

    const damping = movement.damping
    const returnForce = movement.returnForce
    const maxVelocity = movement.maxVelocity

    // For each particle
    for (let i = 0; i < count; i++) {
      const idx = i * 3

      // Particle position
      const px = positions[idx]
      const py = positions[idx + 1]
      const pz = positions[idx + 2]

      // Compute distance to mouse position
      const dx = px - mousePosition.current.x
      const dy = py - mousePosition.current.y
      const dz = pz - mousePosition.current.z

      const distanceToMouse = Math.sqrt(dx * dx + dy * dy + dz * dz)

      // Initialize variables for repulsion
      let force = 0

      // Apply repulsion forces
      if (distanceToMouse < interactions.big_repulse.distance) {
        // Big repulsion
        force = interactions.big_repulse.strength / (distanceToMouse * distanceToMouse)
      } else if (distanceToMouse < interactions.repulse.distance) {
        // Normal repulsion
        force = interactions.repulse.strength / (distanceToMouse * distanceToMouse)
      }

      if (force > 0) {
        // Normalize direction
        const directionX = dx / distanceToMouse
        const directionY = dy / distanceToMouse
        const directionZ = dz / distanceToMouse

        // Apply force to velocities
        velocities.current[idx] += directionX * force
        velocities.current[idx + 1] += directionY * force
        velocities.current[idx + 2] += directionZ * force
      }

      // Apply damping to velocities
      velocities.current[idx] *= damping
      velocities.current[idx + 1] *= damping
      velocities.current[idx + 2] *= damping

      // Move particles back to original positions when undisturbed
      const opx = originalPositions.current[idx]
      const opy = originalPositions.current[idx + 1]
      const opz = originalPositions.current[idx + 2]

      velocities.current[idx] += (opx - px) * returnForce
      velocities.current[idx + 1] += (opy - py) * returnForce
      velocities.current[idx + 2] += (opz - pz) * returnForce

      // Apply restless movement if enabled
      if (movement.restless.enabled) {
        velocities.current[idx] += (Math.random() - 0.5) * movement.restless.value
        velocities.current[idx + 1] += (Math.random() - 0.5) * movement.restless.value
        velocities.current[idx + 2] += (Math.random() - 0.5) * movement.restless.value
      }

      // Cap velocities to prevent them from becoming too large
      velocities.current[idx] = Math.max(Math.min(velocities.current[idx], maxVelocity), -maxVelocity)
      velocities.current[idx + 1] = Math.max(Math.min(velocities.current[idx + 1], maxVelocity), -maxVelocity)
      velocities.current[idx + 2] = Math.max(Math.min(velocities.current[idx + 2], maxVelocity), -maxVelocity)

      // Update positions
      positions[idx] += velocities.current[idx]
      positions[idx + 1] += velocities.current[idx + 1]
      positions[idx + 2] += velocities.current[idx + 2]
    }

    points.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        attach="material"
        size={particleSize}
        sizeAttenuation={true}
        map={circleTexture}
        alphaTest={0.5}
        transparent={true}
        vertexColors={true}
        opacity={1}
      />
    </points>
  )
}

export default function App() {
  // Use Leva controls
  const {
    shapeType,
    particleCount,
    particleSize,
    particleColor,
    backgroundColor,
    autoRotateSpeed,
    fogColor,
    fogNear,
    fogFar,
    repulseDistance,
    repulseStrength,
    bigRepulseDistance,
    bigRepulseStrength,
    speed,
    damping,
    returnForce,
    maxVelocity,
    restlessEnabled,
    restlessValue
  } = useControls(
    {
      'Parâmetros de Forma': folder(
        {
          shapeType: {
            label: 'Tipo de forma',
            value: 'Torus',
            options: {
              Torus: 'Torus',
              TorusKnot: 'TorusKnot',
              Icosaedro: 'Icosahedron',
              Esfera: 'Sphere',
              Caixa: 'Box',
              Abstrato: 'Cloud',
              'Fita de Möbius': 'MobiusStrip',
              'Nó Trevo': 'TrefoilKnot'
            }
          },
          particleCount: {
            label: 'Número de partículas',
            value: 10000,
            min: 1000,
            max: 20000,
            step: 1000
          },
          particleSize: {
            label: 'Tamanho da partícula',
            value: 0.03,
            min: 0.01,
            max: 0.1,
            step: 0.005
          },
          particleColor: {
            label: 'Cor da partícula',
            value: '#030303'
          },
          backgroundColor: {
            label: 'Cor de fundo',
            value: '#eeeeee'
          }
        },
        { collapsed: false }
      ),
      'Parâmetros de Câmera': folder(
        {
          autoRotateSpeed: {
            label: 'Velocidade de rotação automática',
            value: 0.1,
            min: 0,
            max: 5,
            step: 0.1
          },
          fogColor: {
            label: 'Cor da névoa',
            value: '#c1c1c1'
          },
          fogNear: {
            label: 'Névoa perto',
            value: 6.6,
            min: 0,
            max: 20,
            step: 0.1
          },
          fogFar: {
            label: 'Névoa longe',
            value: 13,
            min: 0,
            max: 50,
            step: 0.1
          }
        },
        { collapsed: true }
      ),
      Interações: folder(
        {
          repulseDistance: {
            label: 'Distância de repulsão',
            value: 22,
            min: 0,
            max: 50,
            step: 1
          },
          repulseStrength: {
            label: 'Força de repulsão',
            value: 1,
            min: 0,
            max: 20,
            step: 0.5
          },
          bigRepulseDistance: {
            label: 'Distância de grande repulsão',
            value: 5,
            min: 0,
            max: 50,
            step: 1
          },
          bigRepulseStrength: {
            label: 'Força de grande repulsão',
            value: 10,
            min: 0,
            max: 50,
            step: 1
          }
        },
        { collapsed: false }
      ),
      Movimento: folder(
        {
          speed: {
            label: 'Velocidade',
            value: 0.1,
            min: 0,
            max: 1,
            step: 0.01
          },
          damping: {
            label: 'Amortecimento',
            value: 0.095,
            min: 0,
            max: 1,
            step: 0.005
          },
          returnForce: {
            label: 'Força de retorno',
            value: 0.01,
            min: 0,
            max: 0.1,
            step: 0.001
          },
          maxVelocity: {
            label: 'Velocidade máxima',
            value: 1,
            min: 0,
            max: 10,
            step: 0.1
          },
          restlessEnabled: {
            label: 'Inquieto',
            value: true
          },
          restlessValue: {
            label: 'Valor de inquietação',
            value: 0.01,
            min: 0,
            max: 0.1,
            step: 0.001
          }
        },
        { collapsed: false }
      )
    },
    { collapsed: false }
  )

  // Construct the interactions and movement objects from the controls
  const interactionsParams = {
    repulse: {
      distance: repulseDistance,
      strength: repulseStrength
    },
    big_repulse: {
      distance: bigRepulseDistance,
      strength: bigRepulseStrength
    }
  }

  const movementParams = {
    speed: speed,
    damping: damping,
    returnForce: returnForce,
    maxVelocity: maxVelocity,
    restless: {
      enabled: restlessEnabled,
      value: restlessValue
    }
  }

  return (
    <>
      <Leva collapsed={false} />
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 10], fov: 90 }} style={{ background: backgroundColor }}>
        <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
        <Particles
          count={particleCount}
          shapeType={shapeType}
          particleSize={particleSize}
          particleColor={particleColor}
          interactions={interactionsParams}
          movement={movementParams}
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
    </>
  )
}
