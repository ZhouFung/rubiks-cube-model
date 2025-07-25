import * as THREE from 'three';
import React, { useMemo, forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import type { FaceColor } from '../cube/cube-adapter';

// Official WCA color scheme: White on top, Green in front.
const COLOR_MAP: Record<string, string> = {
  U: '#ffffff', // White
  D: '#ffff00', // Yellow
  F: '#00ff00', // Green
  B: '#0000ff', // Blue
  L: '#ff8000', // Orange
  R: '#ff0000', // Red
  default: '#222222', // Inner color of the cubies
};

// Maps a face name ('U', 'R', etc.) to the correct material index for a standard THREE.BoxGeometry.
const FACE_TO_MATERIAL_INDEX: Record<string, number> = {
  R: 0,
  L: 1,
  U: 2,
  D: 3,
  F: 4,
  B: 5,
};

// Defines the 26 cubies with their initial positions.
const CUBIE_POSITIONS = [
  [-1, 1, 1],
  [0, 1, 1],
  [1, 1, 1],
  [-1, 1, 0],
  [0, 1, 0],
  [1, 1, 0],
  [-1, 1, -1],
  [0, 1, -1],
  [1, 1, -1],
  [-1, 0, 1],
  [1, 0, 1],
  [-1, 0, 0],
  [0, 0, 1], // Added missing center cubie
  [0, 0, -1], // Added missing center cubie
  [1, 0, 0],
  [-1, 0, -1],
  [1, 0, -1],
  [-1, -1, 1],
  [0, -1, 1],
  [1, -1, 1],
  [-1, -1, 0],
  [0, -1, 0],
  [1, -1, 0],
  [-1, -1, -1],
  [0, -1, -1],
  [1, -1, -1],
];

// This is the ground truth mapping from the 54-sticker cubejs string to the 3D model.
const STICKER_MAP = [
  // U face (0-8)
  { p: [-1, 1, -1], f: 'U' },
  { p: [0, 1, -1], f: 'U' },
  { p: [1, 1, -1], f: 'U' },
  { p: [-1, 1, 0], f: 'U' },
  { p: [0, 1, 0], f: 'U' },
  { p: [1, 1, 0], f: 'U' },
  { p: [-1, 1, 1], f: 'U' },
  { p: [0, 1, 1], f: 'U' },
  { p: [1, 1, 1], f: 'U' },
  // R face (9-17)
  { p: [1, 1, 1], f: 'R' },
  { p: [1, 1, 0], f: 'R' },
  { p: [1, 1, -1], f: 'R' },
  { p: [1, 0, 1], f: 'R' },
  { p: [1, 0, 0], f: 'R' },
  { p: [1, 0, -1], f: 'R' },
  { p: [1, -1, 1], f: 'R' },
  { p: [1, -1, 0], f: 'R' },
  { p: [1, -1, -1], f: 'R' },
  // F face (18-26)
  { p: [-1, 1, 1], f: 'F' },
  { p: [0, 1, 1], f: 'F' },
  { p: [1, 1, 1], f: 'F' },
  { p: [-1, 0, 1], f: 'F' },
  { p: [0, 0, 1], f: 'F' },
  { p: [1, 0, 1], f: 'F' },
  { p: [-1, -1, 1], f: 'F' },
  { p: [0, -1, 1], f: 'F' },
  { p: [1, -1, 1], f: 'F' },
  // D face (27-35)
  { p: [-1, -1, 1], f: 'D' },
  { p: [0, -1, 1], f: 'D' },
  { p: [1, -1, 1], f: 'D' },
  { p: [-1, -1, 0], f: 'D' },
  { p: [0, -1, 0], f: 'D' },
  { p: [1, -1, 0], f: 'D' },
  { p: [-1, -1, -1], f: 'D' },
  { p: [0, -1, -1], f: 'D' },
  { p: [1, -1, -1], f: 'D' },
  // L face (36-44)
  { p: [-1, 1, -1], f: 'L' },
  { p: [-1, 1, 0], f: 'L' },
  { p: [-1, 1, 1], f: 'L' },
  { p: [-1, 0, -1], f: 'L' },
  { p: [-1, 0, 0], f: 'L' },
  { p: [-1, 0, 1], f: 'L' },
  { p: [-1, -1, -1], f: 'L' },
  { p: [-1, -1, 0], f: 'L' },
  { p: [-1, -1, 1], f: 'L' },
  // B face (45-53)
  { p: [1, 1, -1], f: 'B' },
  { p: [0, 1, -1], f: 'B' },
  { p: [-1, 1, -1], f: 'B' },
  { p: [1, 0, -1], f: 'B' },
  { p: [0, 0, -1], f: 'B' },
  { p: [-1, 0, -1], f: 'B' },
  { p: [1, -1, -1], f: 'B' },
  { p: [0, -1, -1], f: 'B' },
  { p: [-1, -1, -1], f: 'B' },
];

const Cubie = React.memo(
  ({
    position,
    materials,
  }: {
    position: [number, number, number];
    materials: THREE.Material[];
  }) => (
    <mesh position={position} material={materials}>
      <boxGeometry args={[0.95, 0.95, 0.95]} />
    </mesh>
  ),
);

function parseMove(move: string) {
  const base = move[0];
  const prime = move.includes("'");
  const double = move.includes('2');
  let axis: 'x' | 'y' | 'z';
  let value = Math.PI / 2;
  let filter: (p: THREE.Vector3) => boolean;

  switch (base) {
    case 'U':
      axis = 'y';
      filter = (p) => p.y > 0.5;
      value = -value;
      break;
    case 'D':
      axis = 'y';
      filter = (p) => p.y < -0.5;
      break;
    case 'F':
      axis = 'z';
      filter = (p) => p.z > 0.5;
      value = -value;
      break;
    case 'B':
      axis = 'z';
      filter = (p) => p.z < -0.5;
      break;
    case 'L':
      axis = 'x';
      filter = (p) => p.x < -0.5;
      break;
    case 'R':
      axis = 'x';
      filter = (p) => p.x > 0.5;
      value = -value;
      break;
    default:
      axis = 'y';
      filter = () => false;
      break;
  }

  if (prime) value = -value;
  if (double) value *= 2;
  return { axis, value, filter };
}

interface Cube3DProps {
  faceColors: Record<FaceColor, string[]>;
}

const Cube3D = forwardRef(function Cube3D({ faceColors }: Cube3DProps, ref) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMove, setCurrentMove] = useState<string | null>(null);
  const onAnimationEndCallbackRef = useRef<(() => void) | null>(null);

  const colorMaterials = useMemo(() => {
    const materials: Record<string, THREE.MeshBasicMaterial> = {};
    for (const key in COLOR_MAP) {
      materials[key] = new THREE.MeshBasicMaterial({ color: COLOR_MAP[key], side: THREE.DoubleSide });
    }
    return materials;
  }, []);

  const cubieList = useMemo(() => {
    if (!faceColors.U || faceColors.U.length !== 9) return [];

    const fullStateString =
      faceColors.U.join('') +
      faceColors.R.join('') +
      faceColors.F.join('') +
      faceColors.D.join('') +
      faceColors.L.join('') +
      faceColors.B.join('');

    console.log('faceColors:', faceColors);
    console.log('fullStateString:', fullStateString);

    if (fullStateString.length !== 54) {
      console.warn('Invalid fullStateString length:', fullStateString.length, fullStateString);
      return [];
    }

    const cubieMaterials = new Map<string, THREE.Material[]>();
    for (const pos of CUBIE_POSITIONS) {
      cubieMaterials.set(
        JSON.stringify(pos),
        Array(6)
          .fill(null)
          .map(() => colorMaterials.default),
      );
    }

    for (let i = 0; i < 54; i++) {
      const sticker = STICKER_MAP[i];
      const posString = JSON.stringify(sticker.p);
      const materialIndex = FACE_TO_MATERIAL_INDEX[sticker.f as FaceColor];
      const materials = cubieMaterials.get(posString);
      if (materials) {
        materials[materialIndex] = colorMaterials[fullStateString[i]] || colorMaterials.default;
      }
    }

    return CUBIE_POSITIONS.map((p, i) => ({
      id: `cubie-${i}`,
      position: p as [number, number, number],
      materials: cubieMaterials.get(JSON.stringify(p))!,
    }));
  }, [faceColors]);

  const [springs, api] = useSpring(() => ({
    rotation: [0, 0, 0] as [number, number, number],
    config: { tension: 270, friction: 30 },
    onRest: () => {
      setIsAnimating(false);
      setCurrentMove(null);
      if (onAnimationEndCallbackRef.current) onAnimationEndCallbackRef.current();
    },
  }));

  const triggerLayerRotate = (move: string, onEnd?: () => void) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentMove(move);
    onAnimationEndCallbackRef.current = onEnd || null;

    const { axis, value } = parseMove(move);
    const rotation: [number, number, number] = [0, 0, 0];
    if (axis === 'x') rotation[0] = value;
    if (axis === 'y') rotation[1] = value;
    if (axis === 'z') rotation[2] = value;

    api.start({ from: { rotation: [0, 0, 0] }, to: { rotation }, reset: true });
  };

  useImperativeHandle(ref, () => ({ triggerLayerRotate }));

  const { filter } = currentMove ? parseMove(currentMove) : { filter: () => false };
  const animatedCubies = cubieList.filter((c) => filter(new THREE.Vector3(...c.position)));
  const staticCubies = cubieList.filter((c) => !filter(new THREE.Vector3(...c.position)));

  return (
    <div style={{ width: '100%', height: '100%', touchAction: 'none' }}>
      <Canvas camera={{ position: [3.5, 3.5, 3.5], fov: 50 }}>
        {/* Removed ambientLight and pointLight as we are using MeshBasicMaterial */}

        <animated.group
          rotation-x={springs.rotation.to((r) => (Array.isArray(r) ? r[0] : 0))}
          rotation-y={springs.rotation.to((r) => (Array.isArray(r) ? r[1] : 0))}
          rotation-z={springs.rotation.to((r) => (Array.isArray(r) ? r[2] : 0))}
        >
          {animatedCubies.map((cubie) => (
            <Cubie key={cubie.id} {...cubie} />
          ))}
        </animated.group>

        {staticCubies.map((cubie) => (
          <Cubie key={cubie.id} {...cubie} />
          ))}

        <OrbitControls enablePan={false} minDistance={3} maxDistance={10} />
      </Canvas>
    </div>
  );
});

export default Cube3D;
