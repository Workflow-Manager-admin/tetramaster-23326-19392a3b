import React from 'react';
import './App.css';
import TetraMaster from './TetraMaster';

// PUBLIC_INTERFACE
function App() {
  return (
    <div className="app" style={{ background: "var(--kavia-dark)" }}>
      <nav className="navbar" style={{ background: "var(--kavia-charcoal)", borderBottom: "2px solid var(--kavia-orange)" }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo" style={{ color: "var(--kavia-orange)" }}>
              <span className="logo-symbol" style={{ color: "var(--kavia-orange)", fontWeight: 900 }}>*</span> TetraMaster
            </div>
            <button className="btn" tabIndex={-1} style={{ pointerEvents: 'none', opacity: 0.5, background: "var(--kavia-orange)", color: "var(--kavia-dark)" }}>
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