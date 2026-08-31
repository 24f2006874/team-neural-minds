"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Line } from "@react-three/drei";
import * as THREE from "three";

function Iris({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    // breathing iris
    const scale = 1 + Math.sin(t * 0.5) * 0.04;
    g.scale.setScalar(scale);
    // mouse parallax
    g.position.x += (mouse.current.x * 0.3 - g.position.x) * 0.05;
    g.position.y += (mouse.current.y * 0.3 - g.position.y) * 0.05;
  });

  return (
    <group ref={group} position={[0, 0, -0.6]}>
      {/* Outer sclera */}
      <mesh>
        <sphereGeometry args={[1.35, 48, 48]} />
        <meshStandardMaterial color="#dfe7f2" roughness={0.4} metalness={0} />
      </mesh>
      {/* Cornea highlight */}
      <mesh position={[0.35, 0.32, 1.15]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} />
      </mesh>
      {/* Iris disc */}
      <mesh position={[0, 0, 1.3]}>
        <cylinderGeometry args={[0.62, 0.62, 0.06, 48]} />
        <meshStandardMaterial
          color="#1a3a5c"
          roughness={0.3}
          emissive="#12314f"
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Pupil */}
      <mesh position={[0, 0, 1.33]}>
        <cylinderGeometry args={[0.26, 0.26, 0.05, 32]} />
        <meshStandardMaterial color="#05070d" roughness={0.2} />
      </mesh>
      {/* Retina glow */}
      <mesh position={[0, 0, 0.9]} rotation={[0, 0, 0]}>
        <circleGeometry args={[1.3, 48]} />
        <meshBasicMaterial color="#0d3b4f" side={THREE.DoubleSide} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function curvePoints(seed: number, count = 48) {
  const pts: THREE.Vector3[] = [];
  const r = 0.9 + seed * 0.25;
  let angle = seed * Math.PI * 2;
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const radius = 0.18 + (r - 0.18) * t;
    angle += 0.12 * (1 - t * 0.5) + t * 0.22;
    const wob = Math.sin(t * 6 + seed * 9) * 0.04;
    pts.push(
      new THREE.Vector3(
        Math.cos(angle) * radius + wob,
        Math.sin(angle) * radius + wob,
        1.2 + t * 0.06
      )
    );
  }
  return pts;
}

function Vessels() {
  const curves = useMemo(() => {
    const paths = Array.from({ length: 14 }, (_, i) => curvePoints(i / 14)).map(
      (pts) => new THREE.CatmullRomCurve3(pts)
    );
    return paths;
  }, []);

  return (
    <group>
      {curves.map((path, i) => (
        <VesselLine
          key={i}
          path={path}
          color={i % 3 === 0 ? "#2ad4ff" : i % 3 === 1 ? "#37f0c8" : "#1fa8d9"}
          opacity={0.55}
        />
      ))}
    </group>
  );
}

function VesselLine({
  path,
  color,
  opacity,
}: {
  path: THREE.CatmullRomCurve3;
  color: string;
  opacity: number;
}) {
  const points = useMemo(() => path.getPoints(60), [path]);
  return (
    <Line
      points={points}
      color={color}
      lineWidth={1.5}
      transparent
      opacity={opacity}
    />
  );
}

function Particles({ count = 220 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.02;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#22d3ee"
        size={0.02}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

function Rig({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  useFrame((state) => {
    state.camera.position.x += (mouse.current.x * 0.4 - state.camera.position.x) * 0.05;
    state.camera.position.y += (-mouse.current.y * 0.4 - state.camera.position.y) * 0.05;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function EyeScene() {
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div
      className="absolute inset-0"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mouse.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        mouse.current.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      }}
    >
      <Canvas camera={{ position: [0, 0, 3.4], fov: 45 }} dpr={[1, 1.6]}>
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 4]} intensity={1.2} color="#22d3ee" />
        <pointLight position={[-3, -2, 2]} intensity={0.5} color="#34d399" />
        <Iris mouse={mouse} />
        <Vessels />
        <Particles />
        <Rig mouse={mouse} />
      </Canvas>
    </div>
  );
}
