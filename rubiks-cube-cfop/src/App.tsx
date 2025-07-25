import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CubeAdapter } from './cube/cube-adapter';
import Cube3D from './components/Cube3D';
import './App.css';

function App() {
  console.log('App component rendering');
  const cubeRef = useRef(new CubeAdapter());
  const cube3DRef = useRef<{ triggerLayerRotate: (move: string, onEnd: () => void) => void }>(null);

  const [faceColors, setFaceColors] = useState(() => {
    const colors = cubeRef.current.getFaceColors();
    console.log('Initial face colors:', colors);
    return colors;
  });
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 解魔方相关状态
  const [solvingSteps, setSolvingSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isSolving, setIsSolving] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1); // 动画速度倍数
  const [showSolutionSteps, setShowSolutionSteps] = useState(false); // 是否显示解法步骤

  useEffect(() => {
    // 在组件首次加载时重置魔方和所有状态
    // 以确保一个干净和一致的初始环境
    console.log('App component mounted, resetting cube and component state.');
    
    // 重置解魔方相关状态
    setIsSolving(false);
    setCurrentStepIndex(-1);
    setSolvingSteps([]);
    setShowSolutionSteps(false);
    
    // 重置魔方实例并更新UI
    cubeRef.current.reset();
    setFaceColors(cubeRef.current.getFaceColors());
  }, []); // 空依赖数组确保此effect仅在组件挂载时运行一次

  const handleMoves = useCallback((moves: string[] | null, isSolvingSequence = false) => {""
    if (isAnimating || !moves || moves.length === 0) return;

    console.log(`Handling moves: ${moves.join(', ')}`);
    let currentMoveIndex = 0;

    // 如果是解魔方序列，更新解魔方状态
    if (isSolvingSequence) {
      setSolvingSteps(moves);
      setCurrentStepIndex(0);
      setIsSolving(true);
    }

    const processNextMove = () => {
      if (currentMoveIndex >= moves.length) {
        setIsAnimating(false);
        if (isSolvingSequence) {
          setIsSolving(false);
          setCurrentStepIndex(-1);
        }
        console.log('All moves completed');
        return;
      }

      setIsAnimating(true);
      const move = moves[currentMoveIndex];
      console.log(`Processing move ${currentMoveIndex + 1}/${moves.length}: ${move}`);
      
      if (!cube3DRef.current) {
        console.error('cube3DRef is not initialized');
        setIsAnimating(false);
        if (isSolvingSequence) {
          setIsSolving(false);
          setCurrentStepIndex(-1);
        }
        return;
      }
      
      // 如果是解魔方序列，更新当前步骤索引
      if (isSolvingSequence) {
        setCurrentStepIndex(currentMoveIndex);
      }
      
      cube3DRef.current.triggerLayerRotate(move, () => {
        console.log(`Animation completed for move: ${move}`);
        cubeRef.current.move(move);
        setFaceColors(cubeRef.current.getFaceColors());
        currentMoveIndex++;
        processNextMove();
      });
    };

    processNextMove();
  }, [isAnimating]);

  // 解魔方并显示动画
  const solveAndAnimate = (solver: () => string[] | null) => {
    if (isAnimating || isSolving) return;
    const moves = solver();
    if (moves && moves.length > 0) {
      // 设置解魔方标志并执行动画
      handleMoves(moves, true);
    }
  };
  
  // 完整解魔方并显示动画和步骤
  const solveFullWithAnimation = () => {
    if (isAnimating || isSolving) return;
    const moves = cubeRef.current.solve();
    if (moves && moves.length > 0) {
      // 显示解法步骤
      setShowSolutionSteps(true);
      // 设置解魔方标志并执行动画
      handleMoves(moves, true);
    }
  };
  
  // 调整动画速度
  const changeAnimationSpeed = (speed: number) => {
    console.log(`Changing animation speed to ${speed}x`);
    setAnimationSpeed(speed);
    // 动画速度变化会在下一次动画开始时应用
    // 因为我们在Cube3D组件中的triggerLayerRotate函数中动态设置了动画配置
  };
  
  // 重置解魔方状态
  const resetSolveState = () => {
    setIsSolving(false);
    setCurrentStepIndex(-1);
    setSolvingSteps([]);
    setShowSolutionSteps(false);
  };

  const randomize = () => {
    if (isAnimating || isSolving) return;
    // 重置解魔方状态
    resetSolveState();
    cubeRef.current.randomize();
    setFaceColors(cubeRef.current.getFaceColors());
  };

  const reset = () => {
    if (isAnimating || isSolving) return;
    // 重置解魔方状态
    resetSolveState();
    cubeRef.current.reset();
    setFaceColors(cubeRef.current.getFaceColors());
  };

  return (
    <div className="app-container">
      <div className="cube-container">
        <Cube3D ref={cube3DRef} faceColors={faceColors} animationSpeed={animationSpeed} />
        
        {/* 解魔方进度显示 */}
        {isSolving && (
          <div className="solving-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentStepIndex + 1) / solvingSteps.length * 100}%` }}
              ></div>
            </div>
            <div className="progress-text">
              正在解魔方: {currentStepIndex + 1} / {solvingSteps.length} 步
            </div>
          </div>
        )}
      </div>
      
      <div className="controls-container">
        <h1>魔方CFOP教学与解法</h1>
        
        <div className="control-group">
          <h2>基本操作</h2>
          <button onClick={randomize} disabled={isAnimating || isSolving}>打乱魔方</button>
          <button onClick={reset} disabled={isAnimating || isSolving}>重置魔方</button>
        </div>
        
        <div className="control-group">
          <h2>CFOP解法步骤</h2>
          <button onClick={() => solveAndAnimate(() => cubeRef.current.solveCross())} disabled={isAnimating || isSolving}>解底部十字</button>
          <button onClick={() => solveAndAnimate(() => cubeRef.current.solveF2L())} disabled={isAnimating || isSolving}>解F2L</button>
          <button onClick={() => solveAndAnimate(() => cubeRef.current.solveOLL())} disabled={isAnimating || isSolving}>解顶层朝向</button>
          <button onClick={() => solveAndAnimate(() => cubeRef.current.solvePLL())} disabled={isAnimating || isSolving}>解顶层排列</button>
          <button onClick={solveFullWithAnimation} disabled={isAnimating || isSolving} className="solve-full-btn">完整解魔方</button>
        </div>
        
        {/* 动画速度控制 */}
        <div className="control-group">
          <h2>动画速度</h2>
          <div className="speed-controls">
            <button 
              onClick={() => changeAnimationSpeed(0.5)} 
              className={animationSpeed === 0.5 ? 'active' : ''}
              disabled={isAnimating || isSolving}
            >
              慢速
            </button>
            <button 
              onClick={() => changeAnimationSpeed(1)} 
              className={animationSpeed === 1 ? 'active' : ''}
              disabled={isAnimating || isSolving}
            >
              正常
            </button>
            <button 
              onClick={() => changeAnimationSpeed(2)} 
              className={animationSpeed === 2 ? 'active' : ''}
              disabled={isAnimating || isSolving}
            >
              快速
            </button>
          </div>
        </div>
        
        {/* 解法步骤显示 */}
        {showSolutionSteps && solvingSteps.length > 0 && (
          <div className="control-group solution-steps">
            <h2>解法步骤</h2>
            <div className="steps-container">
              {solvingSteps.map((step, index) => (
                <span 
                  key={index} 
                  className={`step ${index === currentStepIndex ? 'current' : ''} ${index < currentStepIndex ? 'completed' : ''}`}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="control-group">
          <h2>手动操作</h2>
          <div className="manual-moves">
            {[..."UuDdLlRrFfBb"].map((char, index) => {
              const move = index % 2 === 0 ? char.toUpperCase() : char.toUpperCase() + "'";
              return (
                <button key={move} onClick={() => handleMoves([move])} disabled={isAnimating || isSolving}>
                  {move}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="control-group">
          <h2>执行公式</h2>
          <div className="algorithm-input">
            <input type="text" id="algorithm-input" placeholder="例如: R U R' U'" />
            <button onClick={() => {
              const input = document.getElementById('algorithm-input') as HTMLInputElement;
              if (input) {
                handleMoves(input.value.split(' ').filter(Boolean));
              }
            }} disabled={isAnimating || isSolving}>执行</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

