import { FormEvent, useState } from 'react';
import { signIn } from '../utils/auth';
import { loadConfig, resetStorage } from '../utils/storage';

interface LoginScreenProps {
  onAuthenticated: () => void;
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const remainingLockMs = lockedUntil ? lockedUntil.getTime() - Date.now() : 0;
  const isLocked = remainingLockMs > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLocked || pin.length < 4) return;

    setLoading(true);
    try {
      setInfo(null);
      const success = await signIn(pin);
      if (success) {
        setError(null);
        onAuthenticated();
      } else {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        setError('PIN incorrecto. Revisa el código e inténtalo de nuevo.');
        if (nextAttempts % 3 === 0) {
          const nextLock = new Date(Date.now() + 30_000);
          setLockedUntil(nextLock);
          setTimeout(() => setLockedUntil(null), 30_000);
        }
      }
    } finally {
      setLoading(false);
      setPin('');
    }
  };

  const handleShowHint = async () => {
    const config = await loadConfig();
    if (config.pinHint) {
      setError(`Pista PIN: ${config.pinHint}`);
    }
  };

  const handleResetData = async () => {
    setLoading(true);
    try {
      await resetStorage();
      setInfo('Datos locales reiniciados. Vuelve a probar con el PIN por defecto.');
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%)',
        padding: '2rem'
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#ffffff',
          padding: '2rem',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
          display: 'grid',
          gap: '1.5rem',
          width: '100%',
          maxWidth: '360px'
        }}
      >
        <header style={{ display: 'grid', gap: '0.35rem', textAlign: 'center' }}>
          <h1 style={{ margin: 0 }}>PIN de acceso</h1>
          <p style={{ margin: 0, color: '#475569' }}>Introduce el PIN numérico para acceder al generador de presupuestos.</p>
        </header>

        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pin}
          minLength={4}
          maxLength={6}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
          disabled={loading || isLocked}
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            border: '1px solid #cbd5f5',
            fontSize: '1.25rem',
            letterSpacing: '0.4rem',
            textAlign: 'center'
          }}
          placeholder="••••"
        />

        <button
          type="submit"
          disabled={loading || isLocked || pin.length < 4}
          style={{
            padding: '0.85rem',
            borderRadius: '12px',
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: loading || isLocked ? 'not-allowed' : 'pointer',
            boxShadow: '0 18px 35px rgba(37, 99, 235, 0.3)'
          }}
        >
          {isLocked ? `Bloqueado (${Math.ceil(remainingLockMs / 1000)}s)` : loading ? 'Validando...' : 'Entrar'}
        </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleShowHint}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#1d4ed8',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          ¿Necesitas una pista?
        </button>
        <button
          type="button"
          onClick={handleResetData}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#0f172a',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Reiniciar datos locales
        </button>
      </div>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#b91c1c',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}
        >
          {error}
        </div>
      )}
      {info && (
        <div
          style={{
            background: '#dcfce7',
            color: '#166534',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}
        >
          {info}
        </div>
      )}
      </form>
    </div>
  );
}
