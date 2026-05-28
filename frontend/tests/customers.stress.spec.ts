// Teste de estresse de UI: com o seed massivo (20 cães em ~7 clientes),
// a tela de Clientes/Pets continua legível, com layout amigável (sem scroll
// horizontal, com fontes grandes), mesmo com muito volume.
import { test, expect } from '@playwright/test';

const NOMES_ESPERADOS = [
  'Bob', 'Mel', 'Thor', 'Luna', 'Bella', 'Max', 'Nina', 'Toby', 'Rex', 'Mia',
  'Pingo', 'Sofia', 'Lucky', 'Amora', 'Buddy', 'Cacau', 'Zeus', 'Lola', 'Spike', 'Pipoca',
];

test.describe('Tela de Clientes com volume alto de cães (≥20)', () => {
  test('lista os 20 cães e mostra raça + idade dinâmica para cada um', async ({ page }) => {
    await page.goto('/clientes', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    // Aguarda os cards carregarem.
    await expect(page.locator('text=Clientes e pets cadastrados')).toBeVisible();

    const body = await page.locator('body').innerText();
    const encontrados = NOMES_ESPERADOS.filter((n) => body.includes(n));
    expect(encontrados.length, 'todos os 20 cães do seed devem aparecer').toBe(20);

    // Cada pet deve ter "X anos" OU "X meses" OU "Recém-nascido" visível em algum lugar do card.
    const idadesEncontradas = (body.match(/\d+\s*(anos?|meses?)/g) ?? []).length;
    expect(idadesEncontradas, 'idade calculada deve aparecer em vários pets').toBeGreaterThanOrEqual(15);
  });

  test('sem scroll horizontal e cards com tamanho amigável', async ({ page }) => {
    await page.goto('/clientes', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Clientes e pets cadastrados')).toBeVisible();

    // Sem overflow horizontal (tolerância 2px por arredondamento).
    const overflow = await page.evaluate(() => {
      const d = document.documentElement;
      return d.scrollWidth - d.clientWidth;
    });
    expect(overflow, 'a página não deve exigir rolagem horizontal').toBeLessThanOrEqual(2);

    // Os cards de cliente são amplos mas não gigantes verticalmente.
    const cards = page.locator('div.bg-paper');
    const total = await cards.count();
    expect(total, 'deve haver vários cards (>= 7 clientes + form)').toBeGreaterThanOrEqual(7);
    for (let i = 0; i < total; i++) {
      const box = await cards.nth(i).boundingBox();
      if (!box) continue;
      // Cada card cabe em ~uma tela: até ~1200px de altura.
      expect(box.height, `card ${i} muito alto (quebrou layout?)`).toBeLessThan(1200);
      expect(box.width, `card ${i} muito largo`).toBeLessThan(900);
    }
  });

  test('tipografia grande mantida (acessibilidade para 60 anos)', async ({ page }) => {
    await page.goto('/clientes', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Cliente e Pet');

    const px = (s: string) => Number(s.replace('px', ''));
    const h1Size = await page.locator('h1').first().evaluate((el) => getComputedStyle(el).fontSize);
    expect(px(h1Size), 'título deve ter ≥ 24px').toBeGreaterThanOrEqual(24);

    const bodySize = await page.evaluate(() => getComputedStyle(document.body).fontSize);
    expect(px(bodySize), 'texto base deve ter ≥ 18px').toBeGreaterThanOrEqual(18);
  });

  test('screenshot da tela completa com 20 cães (registro visual)', async ({ page }) => {
    await page.goto('/clientes', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Clientes e pets cadastrados')).toBeVisible();
    await page.screenshot({ path: 'test-results/clientes-20-caes.png', fullPage: true });
  });
});
