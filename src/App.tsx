
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AccessControl } from './components/AccessControl';
import Dashboard from './pages/Dashboard';
import Cardapio from './pages/Cardapio';
import Checkout from './pages/Checkout';
import PedidoConfirmado from './pages/PedidoConfirmado';
import MeusPedidos from './pages/MeusPedidos';
import PedidoDetalhes from './pages/PedidoDetalhes';
import PedidoRetirada from './pages/PedidoRetirada';
import NotFound from './pages/NotFound';
import { Toaster } from "sonner";
import GerenciarPedidos from './pages/GerenciarPedidos';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  const { user, loading } = useAuth();

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index user={user} loading={loading} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route element={<AccessControl allowedRoles={['customer', 'user']} redirectTo="/login" />}>
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/cardapio/:barId" element={<Cardapio />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedido-confirmado/:pedidoId" element={<PedidoConfirmado />} />
          <Route path="/meus-pedidos" element={<MeusPedidos />} />
          <Route path="/pedido/:pedidoId" element={<PedidoDetalhes />} />
          <Route path="/retirada/:pedidoId" element={<PedidoRetirada />} />
        </Route>
        
        {/* Employee routes */}
        <Route element={<AccessControl allowedRoles={['employee', 'admin', 'dono', 'funcionario', 'caixa']} redirectTo="/login" />}>
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
