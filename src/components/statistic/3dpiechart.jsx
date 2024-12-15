import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

function PieSlice({ startAngle, endAngle, color, label, percentage }) {
  const shape = new THREE.Shape();
  const radius = 1;
  const segments = 32;

  shape.moveTo(0, 0);
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / segments);
    shape.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
  }
  shape.lineTo(0, 0);

  const extrudeSettings = {
    steps: 1,
    depth: 0.4,
    bevelEnabled: false,
  };

  const meshRef = useRef(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x = -Math.PI / 4; // Or modify the axis for rotation
    }
  });

  const midAngle = (startAngle + endAngle) / 2;
  const labelPosition = [
    1.5 * Math.cos(midAngle),
    1.5 * Math.sin(midAngle),
    0.2
  ];

  return (
    <group>
      <mesh ref={meshRef}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={labelPosition}
        fontSize={0.15}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {`${label}\n${percentage}`}
      </Text>
    </group>
  );
}

export function PieChart3D({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let startAngle = 0;

  return (
    <Canvas style={{ height: '300px', width: '100%' }}>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <OrbitControls enableZoom={false} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <group rotation={[0, 0, Math.PI / 2]}>
        {data.map((item, index) => {
          const angle = (item.value / total) * Math.PI * 2;
          const endAngle = startAngle + angle;
          const percentage = ((item.value / total) * 100).toFixed(1) + '%';
          
          const slice = (
            <PieSlice
              key={index}
              startAngle={startAngle}
              endAngle={endAngle}
              color={item.color}
              label={item.category}
              percentage={percentage}
            />
          );
          
          startAngle = endAngle;
          return slice;
        })}
      </group>
    </Canvas>
  );
}
