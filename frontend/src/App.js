import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminRoutes from './routes/AdminRoutes';
import VendorRoutes from './routes/VendorRoutes';
import PurchaseRoutes from './routes/PurchaseRoutes';
import TechRoutes from './routes/TechRoutes';
import ProductionRoutes from './routes/ProductionRoutes';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import RedirectIfAuthenticated from './components/admin/RedirectIfAuthenticated';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
        <Route path="/register" element={<RedirectIfAuthenticated><Register /></RedirectIfAuthenticated>} />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/vendor/*" element={<VendorRoutes />} />
        <Route path="/purchase/*" element={<PurchaseRoutes />} />
        <Route path="/tech/*" element={<TechRoutes />} />
        <Route path="/production/*" element={<ProductionRoutes />} />
        <Route path="/unauthorized" element={<div className="container mt-5"><h2>Unauthorized</h2><p>You do not have permission to view this page.</p></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;