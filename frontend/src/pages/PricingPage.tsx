import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type Setting } from '../api';
import { BigButton, Card, ErrorBox, Field, PageShell } from '../components/ui';

interface Pricing {
  ingredientCost: string;
  packagingCost: string;
  laborCost: string;
  totalCost: string;
  marginPercent: string;
  suggestedPrice: string;
  profit: string;
}

export function PricingPage() {
  const { id } = useParams();
  const [laborHours, setLaborHours] = useState('2');
  const [margin, setMargin] = useState('30');
  const [packaging, setPackaging] = useState('1.5');
  const [laborRate, setLaborRate] = useState('20');
  const [result, setResult] = useState<Pricing | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Pré-preenche com os defaults das Configurações.
    api
      .get<Setting>('/settings')
      .then((s) => {
        setMargin(s.defaultMarginPercent);
        setPackaging(s.packagingUnitCost);
        setLaborRate(s.laborCostPerHour);
      })
      .catch(() => {});
    // Se já houver precificação salva, mostra.
    api.get<Pricing>(`/batches/${id}/pricing`).then(setResult).catch(() => {});
  }, [id]);

  async function calculate() {
    setError('');
    try {
      const r = await api.put<Pricing>(`/batches/${id}/pricing`, {
        laborHours: Number(laborHours),
        marginPercent: Number(margin),
        packagingUnitCost: Number(packaging),
        laborCostPerHour: Number(laborRate),
      });
      setResult(r);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <PageShell title="Preço de Venda" back={{ to: '/lotes', label: 'Voltar aos lotes' }}>
      {error && <ErrorBox message={error} />}
      <Card>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Horas de trabalho" type="number" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} />
            <Field label="Custo por hora (R$)" type="number" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} />
            <Field label="Embalagem por pacote (R$)" type="number" value={packaging} onChange={(e) => setPackaging(e.target.value)} />
            <Field label="Margem de lucro (%)" type="number" value={margin} onChange={(e) => setMargin(e.target.value)} />
          </div>
          <BigButton onClick={calculate}>Calcular Preço</BigButton>
        </div>
      </Card>

      {result && (
        <Card>
          <ul className="text-lg space-y-2">
            <li className="flex justify-between"><span>Ingredientes</span><span>R$ {result.ingredientCost}</span></li>
            <li className="flex justify-between"><span>Embalagem</span><span>R$ {result.packagingCost}</span></li>
            <li className="flex justify-between"><span>Mão de obra</span><span>R$ {result.laborCost}</span></li>
            <li className="flex justify-between font-bold border-t-4 border-gray-200 pt-2"><span>Custo total</span><span>R$ {result.totalCost}</span></li>
            <li className="flex justify-between text-amberDark font-bold"><span>Lucro ({result.marginPercent}%)</span><span>R$ {result.profit}</span></li>
          </ul>
          <div className="mt-5 bg-graphite text-paper rounded-xl p-5 text-center">
            <p className="text-lg">Preço de venda sugerido</p>
            <p className="text-3xl font-extrabold text-amber">R$ {result.suggestedPrice}</p>
          </div>
        </Card>
      )}
    </PageShell>
  );
}
