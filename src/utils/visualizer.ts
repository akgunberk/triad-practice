import * as THREE from 'three'
import { noise2D, noise3D } from './simplex'
import { getFrequencyData } from './audio'

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let group: THREE.Group
let ball: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshPhongMaterial>
let ballWire: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshBasicMaterial>
let plane1: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshLambertMaterial>
let plane2: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshLambertMaterial>
let animationId = 0

// Store original vertex positions for displacement
let ballOrigPositions: Float32Array
let plane1OrigPositions: Float32Array
let plane2OrigPositions: Float32Array

// Beat-driven intensity
let beatIntensity = 0
let targetBeatIntensity = 0

function modulate(val: number, minVal: number, maxVal: number, outMin: number, outMax: number): number {
  const fr = (val - minVal) / (maxVal - minVal)
  return outMin + Math.max(0, Math.min(1, fr)) * (outMax - outMin)
}

export function init(container: HTMLElement) {
  scene = new THREE.Scene()
  group = new THREE.Group()

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000)
  camera.position.set(0, 0, 55)
  camera.lookAt(scene.position)
  scene.add(camera)

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  // Icosahedron ball — solid + wireframe overlay for depth
  const icoGeo = new THREE.IcosahedronGeometry(10, 4)
  const icoMat = new THREE.MeshPhongMaterial({
    color: 0x1a0033,
    emissive: 0x4a0080,
    emissiveIntensity: 0.4,
    shininess: 30,
    specular: 0x8844cc,
    flatShading: true,
    transparent: true,
    opacity: 0.92,
  })
  ball = new THREE.Mesh(icoGeo, icoMat)
  ball.position.set(0, 0, 0)
  group.add(ball)
  ballOrigPositions = new Float32Array(icoGeo.attributes.position!.array)

  // Wireframe overlay on the ball for that edgy venom look
  const wireGeo = new THREE.IcosahedronGeometry(10, 4)
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xaa66ff,
    wireframe: true,
    transparent: true,
    opacity: 0,
  })
  ballWire = new THREE.Mesh(wireGeo, wireMat)
  ballWire.position.set(0, 0, 0)
  ballWire.visible = false
  group.add(ballWire)

  // Wireframe planes
  const planeGeo1 = new THREE.PlaneGeometry(800, 800, 20, 20)
  const planeMat = new THREE.MeshLambertMaterial({
    color: 0x3a0a5e,
    side: THREE.DoubleSide,
    wireframe: true,
  })

  plane1 = new THREE.Mesh(planeGeo1, planeMat)
  plane1.rotation.x = -0.5 * Math.PI
  plane1.position.set(0, 30, 0)
  group.add(plane1)
  plane1OrigPositions = new Float32Array(planeGeo1.attributes.position!.array)

  const planeGeo2 = new THREE.PlaneGeometry(800, 800, 20, 20)
  plane2 = new THREE.Mesh(planeGeo2, planeMat.clone())
  plane2.rotation.x = -0.5 * Math.PI
  plane2.position.set(0, -30, 0)
  group.add(plane2)
  plane2OrigPositions = new Float32Array(planeGeo2.attributes.position!.array)

  // Lighting — brighter for solid material
  const ambientLight = new THREE.AmbientLight(0x443366, 1.5)
  scene.add(ambientLight)

  const spotLight = new THREE.SpotLight(0xbb66ff, 3)
  spotLight.position.set(-10, 40, 20)
  spotLight.castShadow = true
  scene.add(spotLight)

  const spotLight2 = new THREE.SpotLight(0x6633cc, 2)
  spotLight2.position.set(15, -20, 30)
  scene.add(spotLight2)

  // Rim light from behind for dramatic silhouette
  const backLight = new THREE.PointLight(0x8855ff, 2, 120)
  backLight.position.set(0, 0, -30)
  scene.add(backLight)

  scene.add(group)

  render()
}

function makeRoughBall(bassFr: number, treFr: number) {
  const posAttr = ball.geometry.attributes.position!
  const pos = posAttr.array as Float32Array
  const wirePos = ballWire.geometry.attributes.position!.array as Float32Array
  const radius = ball.geometry.parameters.radius
  const amp = 7
  const time = performance.now()
  const rf = 0.00001

  for (let i = 0; i < pos.length; i += 3) {
    const ox = ballOrigPositions[i]!
    const oy = ballOrigPositions[i + 1]!
    const oz = ballOrigPositions[i + 2]!

    const len = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1
    const nx = ox / len
    const ny = oy / len
    const nz = oz / len

    const noiseVal = noise3D(
      nx + time * rf * 7,
      ny + time * rf * 8,
      nz + time * rf * 9
    )
    const distance = (radius + bassFr) + noiseVal * amp * treFr

    pos[i] = nx * distance
    pos[i + 1] = ny * distance
    pos[i + 2] = nz * distance

    // Wireframe tracks slightly larger
    wirePos[i] = nx * distance * 1.01
    wirePos[i + 1] = ny * distance * 1.01
    wirePos[i + 2] = nz * distance * 1.01
  }

  posAttr.needsUpdate = true
  ball.geometry.computeVertexNormals()
  ballWire.geometry.attributes.position!.needsUpdate = true

  // Pulse emissive on beat
  const mat = ball.material
  mat.emissiveIntensity = 0.4 + beatIntensity * 1.2
}

function makeRoughGround(
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshLambertMaterial>,
  origPositions: Float32Array,
  distortionFr: number
) {
  const posAttr = mesh.geometry.attributes.position!
  const pos = posAttr.array as Float32Array
  const amp = 2
  const time = Date.now()

  for (let i = 0; i < pos.length; i += 3) {
    const ox = origPositions[i]!
    const oy = origPositions[i + 1]!
    const distance = (noise2D(ox + time * 0.0003, oy + time * 0.0001) + 0) * distortionFr * amp
    pos[i + 2] = distance
  }

  posAttr.needsUpdate = true
  mesh.geometry.computeVertexNormals()
}

function render() {
  // Smooth beat intensity decay
  beatIntensity += (targetBeatIntensity - beatIntensity) * 0.12
  if (targetBeatIntensity > 0) {
    targetBeatIntensity *= 0.93
    if (targetBeatIntensity < 0.01) targetBeatIntensity = 0
  }

  // Get real FFT data from audio
  const freq = getFrequencyData()

  // Combine FFT data with beat intensity for when no audio is actively playing
  const bassFr = Math.max(freq.lowerMaxFr, beatIntensity * 0.8)
  const treFr = Math.max(freq.upperAvgFr, beatIntensity * 0.3)
  const groundUpper = Math.max(freq.upperAvgFr, beatIntensity * 0.4)
  const groundLower = Math.max(freq.lowerMaxFr, beatIntensity * 0.6)

  const lowerMaxFr = modulate(Math.pow(bassFr, 0.8), 0, 1, 0, 8)
  const upperAvgFr = modulate(treFr, 0, 1, 0, 4)

  makeRoughBall(lowerMaxFr, upperAvgFr)
  makeRoughGround(plane1, plane1OrigPositions, modulate(groundUpper, 0, 1, 0.5, 4))
  makeRoughGround(plane2, plane2OrigPositions, modulate(groundLower, 0, 1, 0.5, 4))

  group.rotation.y += 0.005
  renderer.render(scene, camera)
  animationId = requestAnimationFrame(render)
}

export function triggerBeat() {
  targetBeatIntensity = 1.0
}

export function onResize(width: number, height: number) {
  if (!camera || !renderer) return
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

export function dispose() {
  cancelAnimationFrame(animationId)
  ball?.geometry.dispose()
  ball?.material.dispose()
  ballWire?.geometry.dispose()
  ballWire?.material.dispose()
  plane1?.geometry.dispose()
  plane1?.material.dispose()
  plane2?.geometry.dispose()
  plane2?.material.dispose()
  renderer?.dispose()
  renderer?.domElement.remove()
}
