import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Keyboard, ScanLine, ShieldAlert } from 'lucide-react';
import { Button, Field } from './ui';

/**
 * Leitor de QR Code pela câmera traseira.
 *
 * Requisitos do navegador:
 * - A câmera (getUserMedia) só existe em CONTEXTO SEGURO: HTTPS ou localhost.
 *   Acessando pelo IP da rede (http://192.168...), ela simplesmente não está disponível.
 * - Decodificação: usa o BarcodeDetector nativo quando existe (Chrome/Edge Android)
 *   e, nos demais (Safari/iOS, Firefox), a biblioteca jsQR — carregada sob demanda.
 * Sem câmera, o estudante digita o código impresso abaixo do QR.
 */
const seguro = typeof window !== 'undefined' && window.isSecureContext;
const temCamera = seguro && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

const MENSAGENS = {
  NotAllowedError: 'Permissão da câmera negada. Libere o acesso nas configurações do navegador para este site.',
  SecurityError: 'Permissão da câmera negada. Libere o acesso nas configurações do navegador para este site.',
  NotFoundError: 'Nenhuma câmera foi encontrada neste aparelho.',
  OverconstrainedError: 'Nenhuma câmera foi encontrada neste aparelho.',
  NotReadableError: 'A câmera está sendo usada por outro aplicativo. Feche-o e tente de novo.',
};

/** Cria a função de leitura: nativa se houver suporte a QR, senão jsQR. */
async function criarLeitor() {
  if ('BarcodeDetector' in window) {
    try {
      const formatos = await window.BarcodeDetector.getSupportedFormats();
      if (formatos.includes('qr_code')) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        return async (video) => (await detector.detect(video))[0]?.rawValue || null;
      }
    } catch {
      /* cai para o jsQR */
    }
  }

  const { default: jsQR } = await import('jsqr');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return async (video) => {
    const { videoWidth: w, videoHeight: h } = video;
    if (!w || !h) return null;
    // Reduz o quadro (máx. 640px) para decodificar rápido mesmo em celulares simples
    const escala = Math.min(1, 640 / Math.max(w, h));
    canvas.width = Math.round(w * escala);
    canvas.height = Math.round(h * escala);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data || null;
  };
}

export default function QrScanner({ onCode, enviando }) {
  const [modo, setModo] = useState(temCamera ? 'camera' : 'manual');
  const [estado, setEstado] = useState('iniciando'); // iniciando | lendo
  const [erroCamera, setErroCamera] = useState('');
  const [codigo, setCodigo] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    if (modo !== 'camera') return undefined;
    let stream;
    let timer;
    let cancelado = false;
    setEstado('iniciando');

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelado) return;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        const ler = await criarLeitor();
        if (cancelado) return;
        setEstado('lendo');

        const loop = async () => {
          if (cancelado) return;
          try {
            const valor = await ler(video);
            if (valor) {
              navigator.vibrate?.(60);
              onCode(valor);
              return;
            }
          } catch {
            /* quadro ainda indisponível */
          }
          timer = setTimeout(loop, 200);
        };
        loop();
      } catch (e) {
        if (cancelado) return;
        setErroCamera(MENSAGENS[e?.name] || 'Não foi possível abrir a câmera. Digite o código manualmente.');
        setModo('manual');
      }
    })();

    return () => {
      cancelado = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [modo, onCode]);

  const enviar = (e) => {
    e.preventDefault();
    if (codigo.trim()) onCode(codigo.trim());
  };

  if (modo === 'camera') {
    return (
      <div className="scanner">
        <div className="scanner__view">
          <video ref={videoRef} playsInline muted autoPlay />
          <div className="scanner__frame" aria-hidden="true">
            <i /><i /><i /><i />
            {estado === 'lendo' && <span className="scanner__line" />}
          </div>
          {estado === 'iniciando' && (
            <div className="scanner__status">
              <span className="spinner" aria-hidden="true" /> Ativando câmera…
            </div>
          )}
        </div>
        <p className="scanner__hint" role="status">
          <ScanLine size={16} aria-hidden="true" /> Aponte a câmera para o QR Code da missão
        </p>
        <Button variant="text" onClick={() => setModo('manual')}>
          <Keyboard size={16} /> Digitar código
        </Button>
      </div>
    );
  }

  return (
    <form className="form scanner" onSubmit={enviar}>
      {!seguro ? (
        <div className="form-alert" role="alert">
          <ShieldAlert size={18} aria-hidden="true" />
          <span>
            A câmera só funciona em conexão segura (<b>HTTPS</b>). Abra o app pelo endereço <b>https://</b> ou digite
            o código abaixo.
          </span>
        </div>
      ) : erroCamera ? (
        <div className="form-alert" role="alert">
          <CameraOff size={18} aria-hidden="true" />
          <span>{erroCamera}</span>
        </div>
      ) : null}

      <Field label="Código da missão" hint="Está impresso logo abaixo do QR Code.">
        {(p) => (
          <input
            {...p}
            className="input scanner__input"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="FATEC-XXXX-000"
            autoCapitalize="characters"
            autoComplete="off"
            autoFocus={!temCamera}
          />
        )}
      </Field>
      <Button type="submit" block size="lg" loading={enviando} disabled={!codigo.trim()}>
        Validar código
      </Button>
      {temCamera && (
        <Button
          type="button"
          variant="text"
          onClick={() => {
            setErroCamera('');
            setModo('camera');
          }}
        >
          <Camera size={16} /> {erroCamera ? 'Tentar a câmera de novo' : 'Usar a câmera'}
        </Button>
      )}
    </form>
  );
}
