import { useEffect, useState } from 'react';
import { api, CATEGORY_LABELS, type Diet, type Ingredient, type Pet, type RecipeResult } from '../api';
import { BigButton, Card, ErrorBox, Field, PageShell, SelectField } from '../components/ui';

export function DietsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [diets, setDiets] = useState<Diet[]>([]);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [petId, setPetId] = useState('');
  const [protein, setProtein] = useState('35');
  const [fiber, setFiber] = useState('30');
  const [carb, setCarb] = useState('30');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [preview, setPreview] = useState<RecipeResult | null>(null);

  async function load() {
    const [p, i, d] = await Promise.all([
      api.get<Pet[]>('/pets'),
      api.get<Ingredient[]>('/ingredients'),
      api.get<Diet[]>('/diets'),
    ]);
    setPets(p);
    setIngredients(i);
    setDiets(d);
    if (!petId && p[0]) setPetId(p[0].id);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function save() {
    setError('');
    try {
      const items = ingredients
        .filter((i) => selected.has(i.id))
        .map((i) => ({ ingredientId: i.id, role: i.category, shareWithinGroup: 1 }));
      if (items.length === 0) throw new Error('Selecione ao menos um ingrediente.');
      await api.post('/diets', {
        name,
        petId,
        proteinPercent: Number(protein),
        fiberPercent: Number(fiber),
        carbPercent: Number(carb),
        items,
      });
      setName('');
      setSelected(new Set());
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function showPreview(id: string) {
    setError('');
    try {
      setPreview(await api.post<RecipeResult>(`/diets/${id}/preview`, {}));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <PageShell title="Montar a Dieta" step="Passo 3 de 6" back={{ to: '/', label: 'Voltar ao início' }}>
      {error && <ErrorBox message={error} />}

      <Card>
        <div className="space-y-5">
          <Field label="Nome da dieta" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Dieta da Chloe" />
          <SelectField label="Para qual pet?" value={petId} onChange={(e) => setPetId(e.target.value)}>
            {pets.length === 0 && <option value="">Cadastre um pet primeiro</option>}
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.weightKg} kg)
              </option>
            ))}
          </SelectField>

          <p className="text-lg font-bold pt-2">Proporção da dieta (%)</p>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Proteína" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
            <Field label="Fibra" type="number" value={fiber} onChange={(e) => setFiber(e.target.value)} />
            <Field label="Carbo" type="number" value={carb} onChange={(e) => setCarb(e.target.value)} />
          </div>

          <p className="text-lg font-bold pt-2">Escolha os ingredientes</p>
          <div className="space-y-3">
            {ingredients.map((i) => (
              <label key={i.id} className="flex items-center gap-4 p-3 border-4 border-gray-300 rounded-xl cursor-pointer">
                <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)} className="w-7 h-7" />
                <span className="text-lg">
                  {i.name} <span className="text-gray-600 text-base">({CATEGORY_LABELS[i.category]})</span>
                </span>
              </label>
            ))}
          </div>

          <BigButton onClick={save} disabled={!name || !petId}>
            Salvar Dieta
          </BigButton>
        </div>
      </Card>

      <h2 className="text-xl font-bold pt-4">Dietas criadas</h2>
      {diets.map((d) => (
        <Card key={d.id}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold">{d.name}</p>
              <p className="text-base text-gray-600">
                {d.pet?.name} · {d.proteinPercent}% prot / {d.fiberPercent}% fibra / {d.carbPercent}% carbo
              </p>
            </div>
            <BigButton variant="secondary" onClick={() => showPreview(d.id)}>
              Ver gramas por dia
            </BigButton>
          </div>
        </Card>
      ))}

      {preview && (
        <Card>
          <h3 className="text-xl font-bold mb-3">Receita por dia</h3>
          <p className="text-lg mb-3">
            Necessidade de energia: <strong>{preview.nemKcalPerDay} Kcal/dia</strong> · Total:{' '}
            <strong>{preview.dailyGramsTotal} g/dia</strong>
          </p>
          <ul className="text-lg space-y-1">
            {preview.ingredients.map((i) => (
              <li key={i.ingredientId} className="flex justify-between border-b-2 border-gray-100 py-1">
                <span>{i.name}</span>
                <strong>{i.gramsPerDay} g</strong>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </PageShell>
  );
}
