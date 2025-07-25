import * as THREE from 'three';
import React, { useMemo, forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { CubeAdapter, type FaceColor } from '../cube/cube-adapter';

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

// Helper to get cubelet index from (x, y, z) coordinates
// This must be consistent with the one in cube-adapter.ts
function getCubeletIndex(x: number, y: number, z: number): number {
  const mapCoord = (coord: number) => coord + 1; // Map -1, 0, 1 to 0, 1, 2
  return mapCoord(x) + mapCoord(y) * 3 + mapCoord(z) * 9;
}

// Programmatically generate CUBIE_POSITIONS to match getCubeletIndex order
const CUBIE_POSITIONS: [number, number, number][] = [];
for (let z = -1; z <= 1; z++) {
  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) {
      CUBIE_POSITIONS[getCubeletIndex(x, y, z)] = [x, y, z];
    }
  }
}

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
  { p: [1, -1, -1], f: 'B' },
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

interface Cube3DProps {
  faceColors: Record<FaceColor, string[]>;
}

const cubeAdapter = new CubeAdapter(); // 实例化CubeAdapter

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

    // 使用CubeAdapter中的getAnimationDetails替代parseMove
    const animationDetails = cubeAdapter.getAnimationDetails(move);
    if (!animationDetails) {
      console.warn(`No animation details found for move: ${move}`);
      if (onEnd) onEnd(); // 即使没有动画也调用onEnd
      return;
    }

    const rotation: [number, number, number] = [0, 0, 0];
    if (animationDetails.axis === 'x') rotation[0] = animationDetails.angle;
    if (animationDetails.axis === 'y') rotation[1] = animationDetails.angle;
    if (animationDetails.axis === 'z') rotation[2] = animationDetails.angle;

    api.start({ from: { rotation: [0, 0, 0] }, to: { rotation }, reset: true });
  };

  useImperativeHandle(ref, () => ({ triggerLayerRotate }));

  // 创建一个函数来确定哪些方块应该被动画
  const getCubesToAnimate = (move: string | null) => {
    if (!move) return { filter: () => false, animatedCubies: [], staticCubies: cubieList };
    
    const details = cubeAdapter.getAnimationDetails(move);
    if (!details) return { filter: () => false, animatedCubies: [], staticCubies: cubieList };
    
    const filter = (pos: THREE.Vector3) => {
      const index = getCubeletIndex(pos.x, pos.y, pos.z);
      return details.cubeletIndices.includes(index);
    };
    
    const animatedCubies = cubieList.filter(c => filter(new THREE.Vector3(...c.position)));
    const staticCubies = cubieList.filter(c => !filter(new THREE.Vector3(...c.position)));
    
    return { filter, animatedCubies, staticCubies };
  };
  
  const { filter, animatedCubies, staticCubies } = getCubesToAnimate(currentMove);

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
