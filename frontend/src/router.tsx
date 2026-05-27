import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { IngredientsPage } from './pages/IngredientsPage';
import { CustomersPage } from './pages/CustomersPage';
import { DietsPage } from './pages/DietsPage';
import { BatchesPage } from './pages/BatchesPage';
import { KitchenSheetPage } from './pages/KitchenSheetPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { PricingPage } from './pages/PricingPage';
import { AlertsPage } from './pages/AlertsPage';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/ingredientes', element: <IngredientsPage /> },
  { path: '/clientes', element: <CustomersPage /> },
  { path: '/dietas', element: <DietsPage /> },
  { path: '/lotes', element: <BatchesPage /> },
  { path: '/lotes/:id/ficha', element: <KitchenSheetPage /> },
  { path: '/lotes/:id/preco', element: <PricingPage /> },
  { path: '/compras', element: <ShoppingListPage /> },
  { path: '/alertas', element: <AlertsPage /> },
]);
