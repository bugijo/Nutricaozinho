import { BigLink, PageShell } from '../components/ui';

// Menu inicial linear: um passo por vez, na ordem natural do trabalho.
export function HomePage() {
  return (
    <PageShell title="Nutriçãozinho" step="Bem-vindo! O que você quer fazer hoje?">
      <BigLink to="/ingredientes">1. Cadastrar Ingredientes</BigLink>
      <BigLink to="/clientes">2. Cadastrar Cliente e Pet</BigLink>
      <BigLink to="/dietas">3. Montar a Dieta do Pet</BigLink>
      <BigLink to="/lotes">4. Criar Lote de Produção</BigLink>
      <BigLink to="/compras">5. Lista de Compras da Semana</BigLink>
      <BigLink to="/alertas">6. Avisos de Recompra</BigLink>
    </PageShell>
  );
}
