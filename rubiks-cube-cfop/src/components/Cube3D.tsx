import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// 3D 单个小方块组件
function Cubie({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.95, 0.95, 0.95]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// 3x3x3 魔方整体组件（初始静态展示）
export default function Cube3D() {
  // 生成 3x3x3 小方块坐标
  const cubies = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        cubies.push({ position: [x, y, z] as [number, number, number], color: '#fff' });
      }
    }
  }

  return (
    <Canvas camera={{ position: [5, 5, 5], fov: 50 }} style={{ width: 400, height: 400 }}>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} />
      {cubies.map((cubie, idx) => (
        <Cubie key={idx} position={cubie.position} color={cubie.color} />
      ))}
      <OrbitControls />
    </Canvas>
  );
}
