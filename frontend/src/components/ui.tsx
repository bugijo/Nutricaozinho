import type {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  ChangeEvent,
} from 'react';
import { Link } from 'react-router-dom';

// Botão largo e descritivo, mínimo 64px de altura, fácil de tocar/clicar.
export function BigButton({
  children,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const styles = {
    primary: 'bg-graphite text-paper hover:bg-graphiteDark',
    secondary: 'bg-paper text-ink border-4 border-graphite hover:bg-soft',
    danger: 'bg-danger text-paper hover:bg-red-800',
  }[variant];
  return (
    <button
      {...props}
      className={`w-full min-h-[64px] px-6 py-4 rounded-xl text-lg font-bold transition-colors disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}

export function BigLink({ to, children, variant = 'primary' }: { to: string; children: ReactNode; variant?: 'primary' | 'secondary' }) {
  const styles =
    variant === 'primary'
      ? 'bg-graphite text-paper hover:bg-graphiteDark'
      : 'bg-paper text-ink border-4 border-graphite hover:bg-soft';
  return (
    <Link
      to={to}
      className={`flex items-center justify-center w-full min-h-[64px] px-6 py-4 rounded-xl text-lg font-bold transition-colors ${styles}`}
    >
      {children}
    </Link>
  );
}

// Campo de texto/número com rótulo grande.
// `numeric`: aceita vírgula (padrão PT-BR, ex: 1,6) e converte para ponto
// antes de atualizar o estado/enviar para a API.
export function Field({
  label,
  hint,
  numeric,
  onChange,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; numeric?: boolean }) {
  const handleChange = numeric
    ? (e: ChangeEvent<HTMLInputElement>) => {
        e.target.value = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
        onChange?.(e);
      }
    : onChange;
  const numericProps = numeric ? ({ type: 'text', inputMode: 'decimal' } as const) : {};
  return (
    <label className="block">
      <span className="block text-lg font-bold mb-2">{label}</span>
      {hint && <span className="block text-base text-gray-600 mb-2">{hint}</span>}
      <input
        {...props}
        {...numericProps}
        onChange={handleChange}
        className="w-full min-h-[60px] px-4 py-3 text-lg rounded-xl border-4 border-gray-400 focus:border-amberDark bg-paper"
      />
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block">
      <span className="block text-lg font-bold mb-2">{label}</span>
      <select
        {...props}
        className="w-full min-h-[60px] px-4 py-3 text-lg rounded-xl border-4 border-gray-400 focus:border-amberDark bg-paper"
      >
        {children}
      </select>
    </label>
  );
}

// Cabeçalho grafite com a logo, presente em todas as telas.
export function Header() {
  return (
    <header className="bg-graphite">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-center">
        <Link to="/">
          <img src="/logo.png" alt="Nutriçãozinho" className="h-16 w-auto" />
        </Link>
      </div>
    </header>
  );
}

// Estrutura de página: cabeçalho com logo, título grande, passo opcional, conteúdo centralizado.
export function PageShell({
  title,
  step,
  children,
  back,
}: {
  title: string;
  step?: string;
  children: ReactNode;
  back?: { to: string; label: string };
}) {
  return (
    <div className="min-h-screen bg-soft">
      <Header />
      <div className="max-w-2xl mx-auto py-8 px-4">
        {back && (
          <Link to={back.to} className="inline-block mb-6 text-lg font-bold text-amberDark underline">
            ← {back.label}
          </Link>
        )}
        {step && <p className="text-lg text-gray-600 mb-1">{step}</p>}
        <h1 className="text-3xl font-extrabold mb-8">{title}</h1>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <div className="bg-paper rounded-2xl border-4 border-gray-200 p-6 shadow-sm">{children}</div>;
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="bg-red-50 border-4 border-danger text-danger rounded-xl p-4 text-lg font-bold">
      {message}
    </div>
  );
}
