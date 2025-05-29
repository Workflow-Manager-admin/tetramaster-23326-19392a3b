import React from 'react';
import './App.css';
import TetraMaster from './TetraMaster';

// PUBLIC_INTERFACE
function App() {
  return (
    <div className="app" style={{ background: "#22223b" }}>
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">*</span> TetraMaster
            </div>
            <button className="btn" tabIndex={-1} style={{ pointerEvents: 'none', opacity: 0.5 }}>
              Classic Tetris
            </button>
          </div>
        </div>
      </nav>
      <main>
        <div className="container" style={{ marginTop: 70 }}>
          <TetraMaster />
        </div>
      </main>
    </div>
  );
}

export default App;