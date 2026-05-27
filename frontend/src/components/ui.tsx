import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';

// Botão largo e descritivo, mínimo 64px de altura, fácil de tocar/clicar.
export function BigButton({
  children,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const styles = {
    primary: 'bg-brand text-paper hover:bg-brandDark',
    secondary: 'bg-paper text-ink border-4 border-ink hover:bg-soft',
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
      ? 'bg-brand text-paper hover:bg-brandDark'
      : 'bg-paper text-ink border-4 border-ink hover:bg-soft';
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
export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-lg font-bold mb-2">{label}</span>
      {hint && <span className="block text-base text-gray-600 mb-2">{hint}</span>}
      <input
        {...props}
        className="w-full min-h-[60px] px-4 py-3 text-lg rounded-xl border-4 border-gray-400 focus:border-brand bg-paper"
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
        className="w-full min-h-[60px] px-4 py-3 text-lg rounded-xl border-4 border-gray-400 focus:border-brand bg-paper"
      >
        {children}
      </select>
    </label>
  );
}

// Estrutura de página: título grande, passo opcional, conteúdo centralizado.
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
    <div className="min-h-screen bg-soft py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {back && (
          <Link to={back.to} className="inline-block mb-6 text-lg font-bold text-brand underline">
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
