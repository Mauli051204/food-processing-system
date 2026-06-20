import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminRoutes from './routes/AdminRoutes';
import VendorRoutes from './routes/VendorRoutes';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="container mt-5"><h1>Food Processing System</h1><p>Frontend scaffold ready.</p></div>} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/vendor/*" element={<VendorRoutes />} />
        <Route path="/unauthorized" element={<div className="container mt-5"><h2>Unauthorized</h2><p>You do not have permission to view this page.</p></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;