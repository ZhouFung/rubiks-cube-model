import React, { useState, useRef, useCallback } from 'react';
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

  const handleMoves = useCallback((moves: string[] | null) => {
    if (isAnimating || !moves || moves.length === 0) return;

    console.log(`Handling moves: ${moves.join(', ')}`);
    let currentMoveIndex = 0;

    const processNextMove = () => {
      if (currentMoveIndex >= moves.length) {
        setIsAnimating(false);
        console.log('All moves completed');
        return;
      }

      setIsAnimating(true);
      const move = moves[currentMoveIndex];
      console.log(`Processing move ${currentMoveIndex + 1}/${moves.length}: ${move}`);
      
      if (!cube3DRef.current) {
        console.error('cube3DRef is not initialized');
        setIsAnimating(false);
        return;
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

  const solveAndAnimate = (solver: () => string[] | null) => {
    if (isAnimating) return;
    const moves = solver();
    if (moves && moves.length > 0) {
      handleMoves(moves);
    }
  };

  const randomize = () => {
    if (isAnimating) return;
    cubeRef.current.randomize();
    setFaceColors(cubeRef.current.getFaceColors());
  };

  const reset = () => {
    if (isAnimating) return;
    cubeRef.current.reset();
    setFaceColors(cubeRef.current.getFaceColors());
  };

  return (
    <div className="app-container">
      <div className="cube-container">
        <Cube3D ref={cube3DRef} faceColors={faceColors} />
      </div>
      <div className="controls-container">
        <h1>Rubik's Cube CFOP Trainer</h1>
        <div className="control-group">
          <h2>General</h2>
          <button onClick={randomize} disabled={isAnimating}>Scramble</button>
          <button onClick={reset} disabled={isAnimating}>Reset</button>
        </div>
        <div className="control-group">
          <h2>CFOP Stages</h2>
          <button onClick={() => solveAndAnimate(() => cubeRef.current.solveCross())} disabled={isAnimating}>Solve Cross</button>
          <button onClick={() => solveAndAnimate(() => cubeRef.current.solveF2L())} disabled={isAnimating}>Solve F2L</button>
          <button onClick={() => solveAndAnimate(() => cubeRef.current.solveOLL())} disabled={isAnimating}>Solve OLL</button>
          <button onClick={() => solveAndAnimate(() => cubeRef.current.solvePLL())} disabled={isAnimating}>Solve PLL</button>
          <button onClick={() => solveAndAnimate(() => cubeRef.current.solve())} disabled={isAnimating}>Solve Full</button>
        </div>
        <div className="control-group">
          <h2>Manual Moves</h2>
          <div className="manual-moves">
            {[..."UuDdLlRrFfBb"].map((char, index) => {
              const move = index % 2 === 0 ? char.toUpperCase() : char.toUpperCase() + "'";
              return (
                <button key={move} onClick={() => handleMoves([move])} disabled={isAnimating}>
                  {move}
                </button>
              );
            })}
          </div>
        </div>
        <div className="control-group">
          <h2>Execute Algorithm</h2>
          <div className="algorithm-input">
            <input type="text" id="algorithm-input" placeholder="e.g., R U R' U'" />
            <button onClick={() => {
              const input = document.getElementById('algorithm-input') as HTMLInputElement;
              if (input) {
                handleMoves(input.value.split(' ').filter(Boolean));
              }
            }} disabled={isAnimating}>Execute</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

