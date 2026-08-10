import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online) return null;

  return (
    <div className="connection-banner" role="status">
      <WifiOff size={17} />
      <span>Sem conexão. Algumas funções precisam da API para salvar ou atualizar dados.</span>
    </div>
  );
}
