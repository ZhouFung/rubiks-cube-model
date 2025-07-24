import Cube3D from './components/Cube3D';
import './App.css';

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
      <h1>Rubik's Cube CFOP 教学演示</h1>
      <Cube3D />
    </div>
  );
}

export default App;
