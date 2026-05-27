import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type KitchenSheet } from '../api';
import { Card, ErrorBox, PageShell } from '../components/ui';

// Ficha de Cozinha: letras enormes para pesar e cozinhar cada ingrediente.
export function KitchenSheetPage() {
  const { id } = useParams();
  const [sheet, setSheet] = useState<KitchenSheet | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<KitchenSheet>(`/batches/${id}/kitchen-sheet`)
      .then(setSheet)
      .catch((e) => setError(e.message));
  }, [id]);

  return (
    <PageShell title="Ficha de Cozinha" back={{ to: '/lotes', label: 'Voltar aos lotes' }}>
      {error && <ErrorBox message={error} />}
      {sheet && (
        <>
          <Card>
            <p className="text-xl">
              Pet: <strong>{sheet.petName}</strong> ({sheet.customerName})
            </p>
            <p className="text-xl">
              {sheet.packageCount} pacotes de {sheet.packageWeightGrams}g ={' '}
              <strong>{(sheet.totalGrams / 1000).toFixed(2)} kg</strong>
            </p>
            {sheet.daysOfFood && <p className="text-xl">Dura aproximadamente {Math.round(sheet.daysOfFood)} dias</p>}
          </Card>

          <h2 className="text-2xl font-extrabold pt-2">Pese e cozinhe:</h2>
          {sheet.ingredients.map((i) => (
            <Card key={i.name}>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{i.name}</span>
                <span className="text-3xl font-extrabold text-brand">
                  {(i.gramsTotal / 1000).toFixed(2)} kg
                </span>
              </div>
              <p className="text-lg text-gray-600 text-right">({Math.round(i.gramsTotal)} gramas)</p>
            </Card>
          ))}
        </>
      )}
    </PageShell>
  );
}
