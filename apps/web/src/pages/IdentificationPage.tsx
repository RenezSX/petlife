import { Camera, CameraOff, QrCode, Search, Stethoscope, PawPrint, BedDouble, UserRound, Hash } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import type { Animal, Hospitalization } from '../types';

type IdentificationResponse = {
  animal: Animal & { tutor: Animal['tutor']; hospitalizations?: Hospitalization[] };
  activeHospitalization: Hospitalization | null;
};

function message(error: unknown) {
  const item = error as { response?: { data?: { message?: string } } };
  return item.response?.data?.message ?? 'Não foi possível identificar o paciente.';
}

export function IdentificationPage() {
  const [params, setParams] = useSearchParams();
  const [code, setCode] = useState(params.get('code') ?? '');
  const [result, setResult] = useState<IdentificationResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  const identify = useCallback(async (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      setError('Informe o microchip ou código do paciente.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api.get<IdentificationResponse>(
        `/animals/identify/${encodeURIComponent(normalized)}`,
      );
      setResult(response.data);
      setCode(normalized);
      setParams({ code: normalized }, { replace: true });
    } catch (identifyError) {
      setResult(null);
      setError(message(identifyError));
    } finally {
      setLoading(false);
    }
  }, [setParams]);

  useEffect(() => {
    const initial = params.get('code');
    if (initial) void identify(initial);
  }, []); // carrega QR aberto diretamente apenas uma vez

  function stopCamera() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    const Detector = (window as unknown as {
      BarcodeDetector?: new (options: { formats: string[] }) => {
        detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
      };
    }).BarcodeDetector;

    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setCameraSupported(false);
      setError('A leitura pela câmera não é suportada neste navegador. Use o código ou microchip manualmente.');
      return;
    }

    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setScanning(true);

      requestAnimationFrame(async () => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const detector = new Detector({ formats: ['qr_code'] });

        const scan = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = codes[0]?.rawValue?.trim();
            if (raw) {
              let identifier = raw;
              try {
                const url = new URL(raw);
                identifier = url.searchParams.get('code') ?? raw;
              } catch {
                // QR pode conter somente o ID/microchip.
              }
              stopCamera();
              setCode(identifier);
              await identify(identifier);
              return;
            }
          } catch {
            // Mantém a câmera ativa enquanto o detector não encontra QR.
          }
          frameRef.current = requestAnimationFrame(scan);
        };

        frameRef.current = requestAnimationFrame(scan);
      });
    } catch {
      stopCamera();
      setError('Não foi possível acessar a câmera. Verifique a permissão do navegador.');
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void identify(code);
  }

  const animal = result?.animal;
  const hospitalization = result?.activeHospitalization;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">IDENTIFICAÇÃO RÁPIDA</p>
          <h1>QR Code e Microchip</h1>
          <p className="muted">Localize um paciente pelo microchip ou leia o QR Code da ficha de identificação.</p>
        </div>
      </div>

      <section className="panel identification-panel">
        <form className="identification-search" onSubmit={submit}>
          <div className="search-box">
            <Search />
            <input
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Digite o microchip ou código do paciente"
            />
          </div>
          <button className="primary-button button-with-icon" disabled={loading}>
            <Search />
            {loading ? 'Buscando...' : 'Identificar'}
          </button>
          {!scanning ? (
            <button type="button" className="secondary-button button-with-icon" onClick={() => void startCamera()}>
              <Camera />
              Ler QR pela câmera
            </button>
          ) : (
            <button type="button" className="secondary-button button-with-icon" onClick={stopCamera}>
              <CameraOff />
              Fechar câmera
            </button>
          )}
        </form>

        {scanning && (
          <div className="qr-scanner-box">
            <video ref={videoRef} muted playsInline />
            <div className="qr-scanner-guide"><QrCode /></div>
            <p>Aponte a câmera para o QR Code do paciente.</p>
          </div>
        )}

        {!cameraSupported && (
          <div className="notice">Seu navegador não possui leitura nativa de QR Code. A busca por microchip continua disponível.</div>
        )}

        {error && <div className="form-error">{error}</div>}

        {!result && !error && !scanning && (
          <div className="empty-state identification-empty">
            <QrCode size={46} />
            <h3>Identifique o paciente</h3>
            <p>Digite o número do microchip ou use a câmera para ler o QR Code.</p>
          </div>
        )}

        {animal && (
          <div className="identification-result">
            <div className="identification-patient">
              <div className="identification-avatar">
                {animal.photoUrl ? <img src={animal.photoUrl} alt={animal.name} /> : <PawPrint />}
              </div>
              <div>
                <span className={`status ${animal.active ? 'active-status' : 'inactive-status'}`}>
                  {animal.active ? 'Paciente ativo' : 'Paciente inativo'}
                </span>
                <h2>{animal.name}</h2>
                <p>{animal.species}{animal.breed ? ` • ${animal.breed}` : ''}</p>
              </div>
            </div>

            <div className="identification-data">
              <article><UserRound /><div><span>Tutor</span><strong>{animal.tutor.name}</strong><small>{animal.tutor.phone}</small></div></article>
              <article><Hash /><div><span>Microchip</span><strong>{animal.microchip || 'Não informado'}</strong><small>ID: {animal.id}</small></div></article>
              <article><Stethoscope /><div><span>Status clínico</span><strong>{hospitalization ? 'Internado' : 'Sem internação ativa'}</strong><small>{hospitalization?.veterinarian || 'Sem responsável ativo'}</small></div></article>
              <article><BedDouble /><div><span>Leito</span><strong>{hospitalization?.bed?.name || '—'}</strong><small>{hospitalization?.bed?.sector || 'Sem leito ativo'}</small></div></article>
            </div>

            {hospitalization && (
              <div className="identification-hospitalization">
                <div>
                  <strong>Internação ativa</strong>
                  <p>{hospitalization.reason}</p>
                </div>
                <span className={`status ${hospitalization.priority.toLowerCase()}`}>{hospitalization.priority}</span>
                <Link className="primary-button" to={`/internacoes/${hospitalization.id}`}>Abrir prontuário</Link>
              </div>
            )}

            <div className="identification-actions">
              <Link className="secondary-button" to={`/animais?search=${encodeURIComponent(animal.name)}`}>Ir para Animais</Link>
              <button type="button" className="ghost-button" onClick={() => { setResult(null); setError(''); setCode(''); setParams({}, { replace: true }); }}>
                Nova identificação
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
