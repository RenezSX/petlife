import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function PwaInstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    function beforeInstall(event: Event) {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    }

    function onInstalled() {
      setInstalled(true);
      setPromptEvent(null);
    }

    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || !promptEvent) return null;

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setPromptEvent(null);
    }
  }

  return (
    <button
      type="button"
      className="pwa-install-button"
      onClick={() => void install()}
      title="Instalar PetLife"
      aria-label="Instalar PetLife como aplicativo"
    >
      <Download size={18} />
      <span>Instalar</span>
    </button>
  );
}
