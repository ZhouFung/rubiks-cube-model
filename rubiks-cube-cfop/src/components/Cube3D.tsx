import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { FaceColor } from '../cube/cube-adapter';

// 魔方面字符到颜色映射
const COLOR_MAP: Record<string, string> = {
  U: '#fff', // 白
  D: '#0f0', // 绿
  F: '#ff8000', // 橙
  B: '#00f', // 蓝
  L: '#ff0', // 黄
  R: '#f00', // 红
};

// 3D 单个小方块组件，支持六面贴色
function Cubie({
  position,
  faceColors,
}: {
  position: [number, number, number];
  faceColors: Partial<Record<FaceColor, string>>;
}) {
  // 只渲染有颜色的面
  return (
    <mesh position={position}>
      <boxGeometry args={[0.95, 0.95, 0.95]} />
      {/* 六面贴色 */}
      {Object.entries(faceColors).map(([face, color]) => (
        <meshStandardMaterial
          key={face}
          attach={`material-${faceIndex(face as FaceColor)}`}
          color={color}
        />
      ))}
    </mesh>
  );
}

// 魔方面索引映射（Three.js boxGeometry: 0右,1左,2上,3下,4前,5后）
function faceIndex(face: FaceColor) {
  switch (face) {
    case 'R':
      return 0;
    case 'L':
      return 1;
    case 'U':
      return 2;
    case 'D':
      return 3;
    case 'F':
      return 4;
    case 'B':
      return 5;
    default:
      return 0;
  }
}

// 3x3x3 魔方整体组件（根据 cubejs 状态动态贴色）
export default function Cube3D({ faceColors }: { faceColors: Record<FaceColor, string[]> }) {
  // 生成 3x3x3 小方块坐标及每个 cubie 的六面贴色
  const cubies = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // 计算每个 cubie 的六面贴色（根据 cubejs 状态）
        const cubieFaceColors: Partial<Record<FaceColor, string>> = {};
        // U面（y=1）
        if (y === 1 && faceColors.U)
          cubieFaceColors.U = COLOR_MAP[faceColors.U[3 * (x + 1) + (z + 1)]];
        // D面（y=-1）
        if (y === -1 && faceColors.D)
          cubieFaceColors.D = COLOR_MAP[faceColors.D[3 * (x + 1) + (z + 1)]];
        // F面（z=1）
        if (z === 1 && faceColors.F)
          cubieFaceColors.F = COLOR_MAP[faceColors.F[3 * (x + 1) + (y + 1)]];
        // B面（z=-1）
        if (z === -1 && faceColors.B)
          cubieFaceColors.B = COLOR_MAP[faceColors.B[3 * (x + 1) + (y + 1)]];
        // L面（x=-1）
        if (x === -1 && faceColors.L)
          cubieFaceColors.L = COLOR_MAP[faceColors.L[3 * (z + 1) + (y + 1)]];
        // R面（x=1）
        if (x === 1 && faceColors.R)
          cubieFaceColors.R = COLOR_MAP[faceColors.R[3 * (z + 1) + (y + 1)]];
        cubies.push({
          position: [x, y, z] as [number, number, number],
          faceColors: cubieFaceColors,
        });
      }
    }
  }

  return (
    <Canvas camera={{ position: [5, 5, 5], fov: 50 }} style={{ width: 400, height: 400 }}>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} />
      {cubies.map((cubie, idx) => (
        <Cubie key={idx} position={cubie.position} faceColors={cubie.faceColors} />
      ))}
      <OrbitControls />
    </Canvas>
  );
}
