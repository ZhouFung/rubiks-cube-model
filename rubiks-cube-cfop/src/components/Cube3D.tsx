import * as THREE from 'three';
import React, {
  useMemo,
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useEffect,
} from 'react';
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
  { p: [-1, 1, 1], f: 'L' },   // L1
  { p: [-1, 1, 0], f: 'L' },   // L2
  { p: [-1, 1, -1], f: 'L' },  // L3
  { p: [-1, 0, 1], f: 'L' },   // L4
  { p: [-1, 0, 0], f: 'L' },   // L5
  { p: [-1, 0, -1], f: 'L' },  // L6
  { p: [-1, -1, 1], f: 'L' },  // L7
  { p: [-1, -1, 0], f: 'L' },  // L8
  { p: [-1, -1, -1], f: 'L' }, // L9
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
  }) => {
    // 使用useRef来跟踪mesh引用
    const meshRef = useRef<THREE.Mesh>(null);

    // 在组件挂载和更新时记录位置
    useEffect(() => {
      console.log(`Cubie at position: ${position} rendered/updated`);
    }, [position]);

    return (
      <mesh ref={meshRef} position={position} material={materials}>
        <boxGeometry args={[0.95, 0.95, 0.95]} />
      </mesh>
    );
  },
);

interface Cube3DProps {
  faceColors: Record<FaceColor, string[]>;
  animationSpeed?: number; // 动画速度倍数，默认为1
}

const cubeAdapter = new CubeAdapter(); // 实例化CubeAdapter

const Cube3D = forwardRef(function Cube3D({ faceColors, animationSpeed = 1 }: Cube3DProps, ref) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMove, setCurrentMove] = useState<string | null>(null);
  const onAnimationEndCallbackRef = useRef<(() => void) | null>(null);

  const colorMaterials = useMemo(() => {
    const materials: Record<string, THREE.MeshBasicMaterial> = {};
    for (const key in COLOR_MAP) {
      materials[key] = new THREE.MeshBasicMaterial({
        color: COLOR_MAP[key],
        side: THREE.DoubleSide,
      });
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
    config: {
      tension: 120,
      friction: 14,
      precision: 0.0001,
    },
    onRest: () => {
      console.log('Animation completed, calling onRest');
      setIsAnimating(false);
      setCurrentMove(null);
      api.set({ rotation: [0, 0, 0] });
      if (onAnimationEndCallbackRef.current) {
        const callback = onAnimationEndCallbackRef.current;
        onAnimationEndCallbackRef.current = null;
        callback();
      }
    },
  }));

  const triggerLayerRotate = (move: string, onEnd?: () => void) => {
    if (isAnimating) {
      console.warn(`Animation already in progress, ignoring move: ${move}`);
      if (onEnd) setTimeout(onEnd, 100);
      return;
    }

    setIsAnimating(true);
    setCurrentMove(move);
    onAnimationEndCallbackRef.current = onEnd || null;

    console.log(`Triggering animation for move: ${move}`);

    const animationDetails = cubeAdapter.getAnimationDetails(move);
    if (!animationDetails) {
      console.warn(`No animation details found for move: ${move}`);
      setIsAnimating(false);
      if (onEnd) onEnd();
      return;
    }

    console.log(`Animation details for ${move}:`, animationDetails);

    const rotation: [number, number, number] = [0, 0, 0];
    if (animationDetails.axis === 'x') rotation[0] = animationDetails.angle;
    if (animationDetails.axis === 'y') rotation[1] = animationDetails.angle;
    if (animationDetails.axis === 'z') rotation[2] = animationDetails.angle;

    console.log(`Setting rotation for ${move} to:`, rotation);
    console.log(`Using animation speed: ${animationSpeed}x`);

    // 使用setTimeout确保状态更新后再开始动画
    setTimeout(() => {
      api.start({
        to: { rotation },
        from: { rotation: [0, 0, 0] },
        config: {
          duration: 300 / animationSpeed,
        }
      });
    }, 10);
  };

  useImperativeHandle(ref, () => ({ triggerLayerRotate }));

  // 创建一个函数来确定哪些方块应该被动画
  const getCubesToAnimate = (move: string | null) => {
    if (!move) return { filter: () => false, animatedCubies: [], staticCubies: cubieList };

    const details = cubeAdapter.getAnimationDetails(move);
    if (!details) return { filter: () => false, animatedCubies: [], staticCubies: cubieList };

    console.log(`Animation details for ${move}:`, details);
    console.log(`Cubelet indices to animate:`, details.cubeletIndices);

    const filter = (pos: [number, number, number]) => {
      const index = getCubeletIndex(pos[0], pos[1], pos[2]);
      const shouldAnimate = details.cubeletIndices.includes(index);
      console.log(
        `Checking cubelet at position [${pos}], index: ${index}, should animate: ${shouldAnimate}`,
      );
      return shouldAnimate;
    };

    const animatedCubies = cubieList.filter((c) => filter(c.position));
    const staticCubies = cubieList.filter((c) => !filter(c.position));

    console.log(
      `Move: ${move}, Animated cubies: ${animatedCubies.length}, Static cubies: ${staticCubies.length}`,
    );
    if (animatedCubies.length > 0) {
      console.log('First animated cubie position:', animatedCubies[0].position);
    }
    return { filter, animatedCubies, staticCubies };
  };

  const { filter, animatedCubies, staticCubies } = getCubesToAnimate(currentMove);

  return (
    <div style={{ width: '100%', height: '100%', touchAction: 'none' }}>
      <Canvas camera={{ position: [3.5, 3.5, 3.5], fov: 50 }}>
        {/* 添加环境光和点光源，提高视觉效果 */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />

        {/* 动画组 - 使用animated.group包装需要动画的方块 */}
        <animated.group rotation={springs.rotation as any}>
          {animatedCubies.map((cubie) => (
            <Cubie
              key={`animated-${cubie.id}`}
              position={cubie.position}
              materials={cubie.materials}
            />
          ))}
        </animated.group>

        {/* 静态组 - 不需要动画的方块 */}
        <group>
          {staticCubies.map((cubie) => (
            <Cubie
              key={`static-${cubie.id}`}
              position={cubie.position}
              materials={cubie.materials}
            />
          ))}
        </group>

        {/* 控制器 */}
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={10}
          enableDamping={true}
          dampingFactor={0.1}
        />
      </Canvas>
    </div>
  );
});

export default Cube3D;
