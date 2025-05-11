import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AccessControl } from './components/AccessControl';
import { Dashboard } from './pages/Dashboard';
import { Cardapio } from './pages/Cardapio';
import { Checkout } from './pages/Checkout';
import { PedidoConfirmado } from './pages/PedidoConfirmado';
import { MeusPedidos } from './pages/MeusPedidos';
import { PedidoDetalhes } from './pages/PedidoDetalhes';
import { PedidoRetirada } from './pages/PedidoRetirada';
import { NotFound } from './pages/NotFound';
import { Toaster } from "@/components/ui/sonner"
import GerenciarPedidos from './pages/GerenciarPedidos';

function App() {
  const { user, loading } = useAuth();

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Protected routes */}
        <Route element={<AccessControl user={user} role={['customer']} loading={loading} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cardapio/:barId" element={<Cardapio />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedido-confirmado/:pedidoId" element={<PedidoConfirmado />} />
          <Route path="/meus-pedidos" element={<MeusPedidos />} />
          <Route path="/pedido/:pedidoId" element={<PedidoDetalhes />} />
          <Route path="/retirada/:pedidoId" element={<PedidoRetirada />} />
        </Route>
        
        {/* Employee routes */}
        <Route element={<AccessControl user={user} role={['employee', 'admin']} loading={loading} />}>
          <Route path="/gerenciar-pedidos" element={<GerenciarPedidos />} />
        </Route>
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
