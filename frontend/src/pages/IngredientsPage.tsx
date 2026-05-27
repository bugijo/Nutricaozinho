import { useEffect, useState } from 'react';
import { api, CATEGORY_LABELS, type Category, type Ingredient } from '../api';
import { BigButton, Card, ErrorBox, Field, PageShell, SelectField } from '../components/ui';

const EMPTY = {
  name: '',
  category: 'PROTEIN' as Category,
  purchasePrice: '',
  purchaseWeightGrams: '',
  kcalPer100g: '',
  proteinPer100g: '',
  fiberPer100g: '',
  carbPer100g: '',
  fatPer100g: '',
};

export function IngredientsPage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setItems(await api.get<Ingredient[]>('/ingredients'));
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save() {
    setError('');
    setSaving(true);
    try {
      await api.post('/ingredients', {
        name: form.name,
        category: form.category,
        purchasePrice: Number(form.purchasePrice),
        purchaseWeightGrams: Number(form.purchaseWeightGrams),
        kcalPer100g: Number(form.kcalPer100g),
        proteinPer100g: Number(form.proteinPer100g),
        fiberPer100g: Number(form.fiberPer100g),
        carbPer100g: Number(form.carbPer100g),
        fatPer100g: form.fatPer100g ? Number(form.fatPer100g) : 0,
      });
      setForm({ ...EMPTY });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await api.del(`/ingredients/${id}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <PageShell
      title="Cadastrar Ingredientes"
      step="Passo 1 de 6"
      back={{ to: '/', label: 'Voltar ao início' }}
    >
      {error && <ErrorBox message={error} />}

      <Card>
        <div className="space-y-5">
          <Field label="Nome do ingrediente" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Peito de frango" />
          <SelectField label="Tipo do ingrediente" value={form.category} onChange={(e) => set('category', e.target.value)}>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </SelectField>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Preço pago (R$)" type="number" value={form.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} placeholder="20" />
            <Field label="Para quantos gramas?" type="number" value={form.purchaseWeightGrams} onChange={(e) => set('purchaseWeightGrams', e.target.value)} placeholder="1000" />
          </div>

          <p className="text-lg font-bold pt-2">Tabela nutricional (por 100g)</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Calorias (Kcal)" type="number" value={form.kcalPer100g} onChange={(e) => set('kcalPer100g', e.target.value)} />
            <Field label="Proteína (g)" type="number" value={form.proteinPer100g} onChange={(e) => set('proteinPer100g', e.target.value)} />
            <Field label="Fibra (g)" type="number" value={form.fiberPer100g} onChange={(e) => set('fiberPer100g', e.target.value)} />
            <Field label="Carboidrato (g)" type="number" value={form.carbPer100g} onChange={(e) => set('carbPer100g', e.target.value)} />
          </div>

          <BigButton onClick={save} disabled={saving || !form.name}>
            {saving ? 'Salvando...' : 'Salvar Ingrediente'}
          </BigButton>
        </div>
      </Card>

      <h2 className="text-xl font-bold pt-4">Ingredientes já cadastrados ({items.length})</h2>
      {items.map((it) => (
        <Card key={it.id}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold">{it.name}</p>
              <p className="text-base text-gray-600">
                {CATEGORY_LABELS[it.category]} · R$ {it.purchasePrice} / {it.purchaseWeightGrams}g · {it.kcalPer100g} Kcal/100g
              </p>
            </div>
            <button onClick={() => remove(it.id)} className="text-danger font-bold text-base underline shrink-0">
              Excluir
            </button>
          </div>
        </Card>
      ))}
    </PageShell>
  );
}
