import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

/**
 * O front chama "/api/..." e o Vite repassa para a API (proxy).
 * Assim funciona também no celular pela rede local, sem problemas de CORS
 * nem de "localhost" apontando para o próprio aparelho.
 *
 * DEV_HTTPS=true (npm run dev:https) serve em HTTPS com certificado autoassinado:
 * os navegadores só liberam a câmera em páginas seguras (HTTPS ou localhost),
 * então é o modo necessário para ler QR Code pelo celular na rede local.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const https = env.DEV_HTTPS === 'true';
  const proxy = {
    '/api': {
      target: env.API_PROXY_TARGET || 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api/, ''),
    },
  };

  return {
    plugins: [react(), ...(https ? [basicSsl({ name: 'fatec-mission-dev' })] : [])],
    server: { host: true, port: 5173, proxy },
    preview: { host: true, port: 4173, proxy },
  };
});
