import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Batch, type Diet } from '../api';
import { BigButton, Card, ErrorBox, Field, PageShell, SelectField } from '../components/ui';

export function BatchesPage() {
  const [diets, setDiets] = useState<Diet[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [error, setError] = useState('');

  const [dietId, setDietId] = useState('');
  const [count, setCount] = useState('30');
  const [weight, setWeight] = useState('350');
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().slice(0, 10));

  async function load() {
    const [d, b] = await Promise.all([api.get<Diet[]>('/diets'), api.get<Batch[]>('/batches')]);
    setDiets(d);
    setBatches(b);
    if (!dietId && d[0]) setDietId(d[0].id);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function save() {
    setError('');
    try {
      await api.post('/batches', {
        dietId,
        packageCount: Number(count),
        packageWeightGrams: Number(weight),
        plannedDate,
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <PageShell title="Criar Lote de Produção" step="Passo 4 de 6" back={{ to: '/', label: 'Voltar ao início' }}>
      {error && <ErrorBox message={error} />}

      <Card>
        <div className="space-y-5">
          <SelectField label="Qual dieta?" value={dietId} onChange={(e) => setDietId(e.target.value)}>
            {diets.length === 0 && <option value="">Crie uma dieta primeiro</option>}
            {diets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.pet?.name}
              </option>
            ))}
          </SelectField>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantos pacotes?" type="number" value={count} onChange={(e) => setCount(e.target.value)} />
            <Field label="Peso de cada pacote (g)" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <Field label="Data de produção" type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
          <BigButton onClick={save} disabled={!dietId}>
            Criar Lote e Calcular
          </BigButton>
        </div>
      </Card>

      <h2 className="text-xl font-bold pt-4">Lotes criados</h2>
      {batches.map((b) => (
        <Card key={b.id}>
          <p className="text-lg font-bold">
            {b.pet?.name} — {b.packageCount} pacotes de {b.packageWeightGrams}g
          </p>
          <p className="text-base text-gray-600 mb-4">
            Produção: {new Date(b.plannedDate).toLocaleDateString('pt-BR')}
            {b.daysOfFood && ` · dura ~${Math.round(Number(b.daysOfFood))} dias`}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Link to={`/lotes/${b.id}/ficha`} className="flex items-center justify-center min-h-[56px] bg-brand text-paper rounded-xl text-lg font-bold">
              Ficha de Cozinha
            </Link>
            <Link to={`/lotes/${b.id}/preco`} className="flex items-center justify-center min-h-[56px] border-4 border-ink rounded-xl text-lg font-bold">
              Preço de Venda
            </Link>
          </div>
        </Card>
      ))}
    </PageShell>
  );
}
