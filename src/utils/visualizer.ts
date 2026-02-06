import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { getFrequencyData } from './audio'

// ─── GLSL: 3D simplex noise on GPU ───
const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}
`

const SPHERE_VERTEX = /* glsl */ `
${NOISE_GLSL}
uniform float u_time;
uniform float u_bass;
uniform float u_treble;
uniform float u_beat;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplacement;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec3 pos = position;

  // Multi-octave noise displacement
  float noiseFreq = 1.5 + u_treble * 0.5;
  float noiseAmp = 0.3 + u_bass * 0.8 + u_beat * 0.6;
  float n = fbm(pos * noiseFreq * 0.1 + u_time * 0.3);

  // Second layer — faster, finer detail
  float n2 = snoise(pos * 0.25 + u_time * 0.7) * 0.4;

  float displacement = (n + n2) * noiseAmp;
  vDisplacement = displacement;

  vec3 newPos = pos + normal * displacement;
  vPosition = (modelViewMatrix * vec4(newPos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
}
`

const SPHERE_FRAGMENT = /* glsl */ `
uniform float u_time;
uniform float u_beat;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform vec3 u_colorC;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplacement;

void main() {
  // Fresnel rim glow — bright edges
  vec3 viewDir = normalize(-vPosition);
  float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);

  // Displacement-based color gradient
  float d = clamp(vDisplacement * 1.5 + 0.5, 0.0, 1.0);

  // 3-color gradient: deep core → mid → bright peaks
  vec3 baseColor = mix(u_colorA, u_colorB, d);
  baseColor = mix(baseColor, u_colorC, d * d);

  // Add fresnel glow
  vec3 rimColor = u_colorC * 1.8;
  vec3 finalColor = mix(baseColor, rimColor, fresnel * (0.6 + u_beat * 0.4));

  // Boost emission on peaks and beats
  float emission = 0.3 + fresnel * 0.7 + d * 0.3 + u_beat * 0.5;
  finalColor *= emission;

  // Subtle pulsing brightness
  finalColor *= 1.0 + sin(u_time * 2.0) * 0.05;

  gl_FragColor = vec4(finalColor, 1.0);
}
`

const GLOW_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const GLOW_FRAGMENT = /* glsl */ `
uniform vec3 u_glowColor;
uniform float u_beat;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vec3 viewDir = normalize(-vPosition);
  float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);
  float alpha = fresnel * (0.25 + u_beat * 0.2);
  vec3 color = u_glowColor * (1.0 + u_beat * 0.5);
  gl_FragColor = vec4(color, alpha);
}
`

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let composer: EffectComposer
let group: THREE.Group
let sphereUniforms: Record<string, THREE.IUniform>
let glowUniforms: Record<string, THREE.IUniform>
let animationId = 0

// Camera orbit
let cameraAngle = 0
const CAM_RADIUS = 38
const CAM_HEIGHT = 8
const CAM_SPEED = 0.15

// Color interpolation targets
let targetColorA = new THREE.Color(0x0a0020)
let targetColorB = new THREE.Color(0x6a1aad)
let targetColorC = new THREE.Color(0xff66ff)
let targetGlow = new THREE.Color(0x9944ff)

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
  camera.position.set(0, CAM_HEIGHT, CAM_RADIUS)
  camera.lookAt(scene.position)
  scene.add(camera)

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.5
  container.appendChild(renderer.domElement)

  // Bloom — tamed for UI readability
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.9,   // strength — reduced from 1.4
    0.5,   // radius
    0.25   // threshold — raised so UI stays readable
  )
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(bloomPass)
  composer.addPass(new OutputPass())

  // ─── Main sphere: custom shader ───
  sphereUniforms = {
    u_time: { value: 0 },
    u_bass: { value: 0 },
    u_treble: { value: 0 },
    u_beat: { value: 0 },
    u_colorA: { value: new THREE.Color(0x0a0020) },  // deep void
    u_colorB: { value: new THREE.Color(0x6a1aad) },  // mid purple
    u_colorC: { value: new THREE.Color(0xff66ff) },  // hot pink peaks
  }

  const sphereGeo = new THREE.IcosahedronGeometry(10, 64)
  const sphereMat = new THREE.ShaderMaterial({
    uniforms: sphereUniforms,
    vertexShader: SPHERE_VERTEX,
    fragmentShader: SPHERE_FRAGMENT,
  })
  const sphere = new THREE.Mesh(sphereGeo, sphereMat)
  group.add(sphere)

  // ─── Outer glow halo ───
  glowUniforms = {
    u_glowColor: { value: new THREE.Color(0x9944ff) },
    u_beat: { value: 0 },
  }

  const glowGeo = new THREE.IcosahedronGeometry(13, 32)
  const glowMat = new THREE.ShaderMaterial({
    uniforms: glowUniforms,
    vertexShader: GLOW_VERTEX,
    fragmentShader: GLOW_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  })
  const glowMesh = new THREE.Mesh(glowGeo, glowMat)
  group.add(glowMesh)

  scene.add(group)
  render()
}

function render() {
  // Beat decay
  beatIntensity += (targetBeatIntensity - beatIntensity) * 0.12
  if (targetBeatIntensity > 0) {
    targetBeatIntensity *= 0.93
    if (targetBeatIntensity < 0.01) targetBeatIntensity = 0
  }

  const freq = getFrequencyData()
  const bassFr = Math.max(freq.lowerMaxFr, beatIntensity * 0.8)
  const treFr = Math.max(freq.upperAvgFr, beatIntensity * 0.3)

  // Smoothly interpolate colors toward targets
  const lerpSpeed = 0.04;
  (sphereUniforms['u_colorA']!.value as THREE.Color).lerp(targetColorA, lerpSpeed);
  (sphereUniforms['u_colorB']!.value as THREE.Color).lerp(targetColorB, lerpSpeed);
  (sphereUniforms['u_colorC']!.value as THREE.Color).lerp(targetColorC, lerpSpeed);
  (glowUniforms['u_glowColor']!.value as THREE.Color).lerp(targetGlow, lerpSpeed)

  // Update shader uniforms
  sphereUniforms['u_time']!.value = performance.now() * 0.001
  sphereUniforms['u_bass']!.value = modulate(Math.pow(bassFr, 0.8), 0, 1, 0, 1)
  sphereUniforms['u_treble']!.value = modulate(treFr, 0, 1, 0, 1)
  sphereUniforms['u_beat']!.value = beatIntensity
  glowUniforms['u_beat']!.value = beatIntensity

  // Camera orbit
  cameraAngle += CAM_SPEED / 60
  camera.position.x = Math.sin(cameraAngle) * CAM_RADIUS
  camera.position.z = Math.cos(cameraAngle) * CAM_RADIUS
  camera.position.y = CAM_HEIGHT + Math.sin(cameraAngle * 0.4) * 5
  camera.lookAt(scene.position)

  group.rotation.y += 0.003
  composer.render()
  animationId = requestAnimationFrame(render)
}

export function triggerBeat() {
  targetBeatIntensity = 1.0
}

/** Derive a 3-color gradient from a single hex color string (e.g. "#FF6B6B") */
export function setColor(hex: string) {
  if (!sphereUniforms) return
  const base = new THREE.Color(hex)
  // colorA: dark version (void)
  targetColorA = base.clone().multiplyScalar(0.08)
  // colorB: the chord color itself
  targetColorB = base.clone().multiplyScalar(0.7)
  // colorC: bright/saturated peaks
  targetColorC = base.clone().lerp(new THREE.Color(0xffffff), 0.35)
  // Glow: slightly desaturated version
  targetGlow = base.clone().multiplyScalar(0.9)
}

export function onResize(width: number, height: number) {
  if (!camera || !renderer) return
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
  composer?.setSize(width, height)
}

export function dispose() {
  cancelAnimationFrame(animationId)
  group?.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose())
      else child.material.dispose()
    }
  })
  composer?.dispose()
  renderer?.dispose()
  renderer?.domElement.remove()
}
