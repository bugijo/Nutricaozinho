import { useEffect, useState } from 'react';
import { api, type Setting } from '../api';
import { BigButton, Card, ErrorBox, Field, PageShell } from '../components/ui';

export function SettingsPage() {
  const [laborCostPerHour, setLaborCostPerHour] = useState('');
  const [packagingUnitCost, setPackagingUnitCost] = useState('');
  const [defaultMarginPercent, setDefaultMarginPercent] = useState('');
  const [reminderBufferDays, setReminderBufferDays] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get<Setting>('/settings')
      .then((s) => {
        setLaborCostPerHour(s.laborCostPerHour);
        setPackagingUnitCost(s.packagingUnitCost);
        setDefaultMarginPercent(s.defaultMarginPercent);
        setReminderBufferDays(String(s.reminderBufferDays));
      })
      .catch((e) => setError(e.message));
  }, []);

  async function save() {
    setError('');
    setSaved(false);
    try {
      await api.put('/settings', {
        laborCostPerHour: Number(laborCostPerHour),
        packagingUnitCost: Number(packagingUnitCost),
        defaultMarginPercent: Number(defaultMarginPercent),
        reminderBufferDays: Number(reminderBufferDays),
      });
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <PageShell title="Configurações" back={{ to: '/', label: 'Voltar ao início' }}>
      {error && <ErrorBox message={error} />}
      {saved && (
        <div className="bg-amber/20 border-4 border-amberDark text-ink rounded-xl p-4 text-lg font-bold">
          Configurações salvas!
        </div>
      )}
      <Card>
        <div className="space-y-5">
          <Field
            label="Custo do seu trabalho por hora (R$)"
            hint="Quanto vale 1 hora do seu trabalho na cozinha."
            numeric
            value={laborCostPerHour}
            onChange={(e) => setLaborCostPerHour(e.target.value)}
          />
          <Field
            label="Custo da embalagem por pacote (R$)"
            numeric
            value={packagingUnitCost}
            onChange={(e) => setPackagingUnitCost(e.target.value)}
          />
          <Field
            label="Margem de lucro padrão (%)"
            hint="Já vem preenchida ao calcular o preço de um lote."
            numeric
            value={defaultMarginPercent}
            onChange={(e) => setDefaultMarginPercent(e.target.value)}
          />
          <Field
            label="Avisar quantos dias antes de acabar?"
            hint="Ex: 5 = avisa 5 dias antes da comida do cliente terminar."
            numeric
            value={reminderBufferDays}
            onChange={(e) => setReminderBufferDays(e.target.value)}
          />
          <BigButton onClick={save}>Salvar Configurações</BigButton>
        </div>
      </Card>
    </PageShell>
  );
}
