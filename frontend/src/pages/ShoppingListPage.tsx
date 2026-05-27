import { useState } from 'react';
import { api } from '../api';
import { BigButton, Card, ErrorBox, Field, PageShell } from '../components/ui';

interface ShoppingList {
  from: string;
  to: string;
  totalEstimatedCost: number;
  items: { name: string; gramsTotal: number; kilos: number; estimatedCost: number }[];
}

function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}
function endOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 6);
  return d.toISOString().slice(0, 10);
}

export function ShoppingListPage() {
  const [from, setFrom] = useState(startOfWeek());
  const [to, setTo] = useState(endOfWeek());
  const [list, setList] = useState<ShoppingList | null>(null);
  const [error, setError] = useState('');

  async function generate() {
    setError('');
    try {
      setList(await api.get<ShoppingList>(`/shopping-list?from=${from}&to=${to}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <PageShell title="Lista de Compras" step="Passo 5 de 6" back={{ to: '/', label: 'Voltar ao início' }}>
      {error && <ErrorBox message={error} />}
      <Card>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="De" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Field label="Até" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <BigButton onClick={generate}>Gerar Lista de Compras</BigButton>
        </div>
      </Card>

      {list && (
        <>
          <h2 className="text-2xl font-extrabold">Comprar:</h2>
          {list.items.length === 0 && <Card><p className="text-lg">Nenhum lote programado neste período.</p></Card>}
          {list.items.map((i) => (
            <Card key={i.name}>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{i.name}</span>
                <span className="text-3xl font-extrabold text-brand">{i.kilos} kg</span>
              </div>
              <p className="text-lg text-gray-600 text-right">~ R$ {i.estimatedCost.toFixed(2)}</p>
            </Card>
          ))}
          {list.items.length > 0 && (
            <Card>
              <p className="text-xl font-bold">Custo total estimado: R$ {list.totalEstimatedCost.toFixed(2)}</p>
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}
