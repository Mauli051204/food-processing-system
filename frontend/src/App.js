import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="container mt-5"><h1>Food Processing System</h1><p>Frontend scaffold ready.</p></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;