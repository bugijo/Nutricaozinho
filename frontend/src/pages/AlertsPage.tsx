import { useEffect, useState } from 'react';
import { api } from '../api';
import { BigButton, Card, ErrorBox, PageShell } from '../components/ui';

interface Alert {
  id: string;
  reminderDate: string;
  status: string;
  message?: string;
  customer?: { name: string; phone?: string };
  batch?: { pet?: { name: string } };
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState('');

  async function load() {
    setAlerts(await api.get<Alert[]>('/alerts?status=PENDING'));
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function mark(id: string, status: string) {
    try {
      await api.put(`/alerts/${id}`, { status });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <PageShell title="Avisos de Recompra" step="Passo 6 de 6" back={{ to: '/', label: 'Voltar ao início' }}>
      {error && <ErrorBox message={error} />}
      {alerts.length === 0 && (
        <Card>
          <p className="text-lg">Nenhum aviso pendente no momento.</p>
        </Card>
      )}
      {alerts.map((a) => {
        const due = a.reminderDate.slice(0, 10) <= today;
        return (
          <Card key={a.id}>
            <p className="text-xl font-bold">
              {due ? '🔔 ' : ''}
              {a.customer?.name} — pet {a.batch?.pet?.name}
            </p>
            <p className="text-base text-gray-600 mb-1">
              Avisar a partir de {new Date(a.reminderDate).toLocaleDateString('pt-BR')}
              {a.customer?.phone && ` · ${a.customer.phone}`}
            </p>
            {a.message && <p className="text-lg mb-4">{a.message}</p>}
            <div className="grid grid-cols-2 gap-4">
              <BigButton onClick={() => mark(a.id, 'REPURCHASED')}>Cliente Recomprou</BigButton>
              <BigButton variant="secondary" onClick={() => mark(a.id, 'DISMISSED')}>
                Dispensar
              </BigButton>
            </div>
          </Card>
        );
      })}
    </PageShell>
  );
}
