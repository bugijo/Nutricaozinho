import { useEffect, useState } from 'react';
import { api, type Customer } from '../api';
import { BigButton, Card, ErrorBox, Field, PageShell, SelectField } from '../components/ui';

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState('');

  // Cliente novo
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');

  // Pet novo
  const [petName, setPetName] = useState('');
  const [petWeight, setPetWeight] = useState('');
  const [petFactor, setPetFactor] = useState('1.6');
  const [petCustomerId, setPetCustomerId] = useState('');

  async function load() {
    const data = await api.get<Customer[]>('/customers');
    setCustomers(data);
    if (!petCustomerId && data[0]) setPetCustomerId(data[0].id);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function saveCustomer() {
    setError('');
    try {
      await api.post('/customers', { name: custName, phone: custPhone || undefined });
      setCustName('');
      setCustPhone('');
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function savePet() {
    setError('');
    try {
      await api.post('/pets', {
        name: petName,
        weightKg: Number(petWeight),
        activityFactor: Number(petFactor),
        customerId: petCustomerId,
      });
      setPetName('');
      setPetWeight('');
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <PageShell title="Cliente e Pet" step="Passo 2 de 6" back={{ to: '/', label: 'Voltar ao início' }}>
      {error && <ErrorBox message={error} />}

      <h2 className="text-xl font-bold">Primeiro, cadastre o cliente (dono)</h2>
      <Card>
        <div className="space-y-5">
          <Field label="Nome do cliente" value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="Ex: Maria Silva" />
          <Field label="Telefone (WhatsApp)" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="(11) 90000-0000" />
          <BigButton onClick={saveCustomer} disabled={!custName}>
            Salvar Cliente
          </BigButton>
        </div>
      </Card>

      <h2 className="text-xl font-bold pt-4">Agora, cadastre o pet</h2>
      <Card>
        <div className="space-y-5">
          <SelectField label="De qual cliente é o pet?" value={petCustomerId} onChange={(e) => setPetCustomerId(e.target.value)}>
            {customers.length === 0 && <option value="">Cadastre um cliente primeiro</option>}
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <Field label="Nome do pet" value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="Ex: Chloe" />
          <Field label="Peso do pet (kg)" type="number" value={petWeight} onChange={(e) => setPetWeight(e.target.value)} placeholder="10" />
          <SelectField label="Nível de atividade" value={petFactor} onChange={(e) => setPetFactor(e.target.value)}>
            <option value="1.2">Parado / castrado (1.2)</option>
            <option value="1.4">Pouco ativo (1.4)</option>
            <option value="1.6">Ativo (1.6)</option>
            <option value="2.0">Muito ativo (2.0)</option>
          </SelectField>
          <BigButton onClick={savePet} disabled={!petName || !petWeight || !petCustomerId}>
            Salvar Pet
          </BigButton>
        </div>
      </Card>

      <h2 className="text-xl font-bold pt-4">Clientes e pets cadastrados</h2>
      {customers.map((c) => (
        <Card key={c.id}>
          <p className="text-lg font-bold">{c.name}</p>
          {c.phone && <p className="text-base text-gray-600">{c.phone}</p>}
          <ul className="mt-2 text-base">
            {(c.pets ?? []).map((p) => (
              <li key={p.id}>🐶 {p.name} — {p.weightKg} kg</li>
            ))}
          </ul>
        </Card>
      ))}
    </PageShell>
  );
}
