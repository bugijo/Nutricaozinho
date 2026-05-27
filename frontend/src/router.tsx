import { createBrowserRouter, createHashRouter } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { IngredientsPage } from './pages/IngredientsPage';
import { CustomersPage } from './pages/CustomersPage';
import { DietsPage } from './pages/DietsPage';
import { BatchesPage } from './pages/BatchesPage';
import { KitchenSheetPage } from './pages/KitchenSheetPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { PricingPage } from './pages/PricingPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';

const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/ingredientes', element: <IngredientsPage /> },
  { path: '/clientes', element: <CustomersPage /> },
  { path: '/dietas', element: <DietsPage /> },
  { path: '/lotes', element: <BatchesPage /> },
  { path: '/lotes/:id/ficha', element: <KitchenSheetPage /> },
  { path: '/lotes/:id/preco', element: <PricingPage /> },
  { path: '/compras', element: <ShoppingListPage /> },
  { path: '/alertas', element: <AlertsPage /> },
  { path: '/configuracoes', element: <SettingsPage /> },
];

// Quando o app é aberto direto de um arquivo (file://, demo offline baixada),
// usa rotas por hash (#) para funcionar sem servidor. Em produção (http/https),
// usa rotas normais.
const openedFromFile = typeof window !== 'undefined' && window.location.protocol === 'file:';
const forceHash = import.meta.env.VITE_USE_HASH === 'true';
export const router = openedFromFile || forceHash ? createHashRouter(routes) : createBrowserRouter(routes);
