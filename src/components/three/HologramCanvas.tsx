"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function RotatingCore({ intensity = 1 }: { intensity?: number }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.25;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
    if (core.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.04 * intensity;
      core.current.scale.setScalar(s);
    }
    if (shell.current) {
      shell.current.rotation.z -= delta * 0.12;
      shell.current.rotation.y -= delta * 0.08;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={core}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={0.6}
          wireframe
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.9, 1]} />
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#a78bfa"
          emissiveIntensity={0.35}
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[2.4, 0.01, 8, 120]} />
        <meshBasicMaterial color="#2dd4bf" transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 1.6, 0.4, 0]}>
        <torusGeometry args={[2.75, 0.008, 8, 120]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function Particles({ count = 400 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const vertical = count === 1 ? 0 : 1 - (i / (count - 1)) * 2;
      const horizontal = Math.sqrt(1 - vertical * vertical);
      const theta = goldenAngle * i;
      const radius = 4 + ((i * 0.61803398875) % 1) * 6;
      arr[i * 3] = radius * horizontal * Math.cos(theta);
      arr[i * 3 + 1] = radius * horizontal * Math.sin(theta);
      arr[i * 3 + 2] = radius * vertical;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * 0.03;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#67e8f9" size={0.035} sizeAttenuation transparent opacity={0.65} />
    </points>
  );
}

export default function HologramCanvas({
  intensity = 1,
  className,
}: {
  intensity?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#22d3ee" />
        <pointLight position={[-5, -3, -5]} intensity={0.8} color="#a78bfa" />
        <RotatingCore intensity={intensity} />
        <Particles />
      </Canvas>
    </div>
  );
}
