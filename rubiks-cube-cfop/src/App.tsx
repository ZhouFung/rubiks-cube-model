import { useRef, useState } from 'react';
import Cube3D from './components/Cube3D';
import { CubeAdapter } from './cube/cube-adapter';
// 自动初始化 cubejs 查表，确保求解器可用
import * as CubeModule from 'cubejs';
if (typeof (CubeModule as any).initSolver === 'function') {
  (CubeModule as any).initSolver();
}
import './App.css';

function App() {
  // CubeAdapter 实例只初始化一次
  const cubeRef = useRef<CubeAdapter>(new CubeAdapter());
  // 魔方状态（六面颜色二维数组）
  const [faceColors, setFaceColors] = useState(cubeRef.current.getFaceColors());
  // 操作：打乱
  const handleRandomize = () => {
    cubeRef.current.randomize();
    setFaceColors(cubeRef.current.getFaceColors());
  };
  // 操作：还原
  const handleReset = () => {
    cubeRef.current.reset();
    setFaceColors(cubeRef.current.getFaceColors());
  };
  // 操作：一键复原（先判断是否已复原，异常时弹窗提示）
  const handleSolve = () => {
    const solvedState = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
    if (cubeRef.current.getState() === solvedState) {
      alert('魔方已是复原状态！');
      return;
    }
    try {
      const solution = cubeRef.current.solve();
      solution.forEach((move) => cubeRef.current.move(move));
      setFaceColors(cubeRef.current.getFaceColors());
      alert('魔方已复原！');
    } catch (e) {
      alert('复原失败，魔方状态异常或 cubejs 不支持此状态！');
    }
  };
  // 操作：单层旋转
  const handleLayerMove = (move: string) => {
    cubeRef.current.move(move);
    setFaceColors(cubeRef.current.getFaceColors());
  };
  // 操作：执行公式（自动格式化公式字符串）
  const handleMove = () => {
    const formula = prompt("请输入魔方公式（如 R U R' U'，可自动格式化）：");
    if (formula) {
      // 自动插入空格：将如 "RUR'U'" 转为 "R U R' U'"
      const formatted = formula
        .replace(/([RUFBLDrufbldxyzMES])('?2?)/g, ' $1')
        .replace(/ +/g, ' ')
        .trim();
      try {
        cubeRef.current.move(formatted);
        setFaceColors(cubeRef.current.getFaceColors());
      } catch (e) {
        alert('公式无效，请检查输入！');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
      <h1>Rubik's Cube CFOP 教学演示</h1>
      <div style={{ marginBottom: 16 }}>
        <button onClick={handleRandomize} style={{ marginRight: 8 }}>
          打乱
        </button>
        <button onClick={handleReset} style={{ marginRight: 8 }}>
          还原
        </button>
        <button onClick={handleSolve} style={{ marginRight: 8 }}>
          一键复原
        </button>
        <button onClick={handleMove}>执行公式</button>
      </div>
      <div style={{ marginBottom: 16 }}>
        {/* 单层旋转按钮 U D F B L R */}
        {['U', "U'", 'D', "D'", 'F', "F'", 'B', "B'", 'L', "L'", 'R', "R'"].map((move) => (
          <button key={move} onClick={() => handleLayerMove(move)} style={{ marginRight: 4 }}>
            {move}
          </button>
        ))}
      </div>
      <Cube3D faceColors={faceColors} />
    </div>
  );
}

export default App;
