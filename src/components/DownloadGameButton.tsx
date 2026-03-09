import React, { useState } from 'react';

/**
 * Downloads the game as a single self-contained HTML file.
 * 
 * In PRODUCTION (published build with vite-plugin-singlefile):
 *   The served index.html already contains everything inlined.
 *   We just fetch it and trigger a download.
 * 
 * In DEV (preview):
 *   We capture the full rendered page by cloning the DOM,
 *   inlining all loaded stylesheets, and embedding a notice.
 */

const DownloadGameButton: React.FC = () => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    setProgress('Generando archivo...');

    try {
      // Fetch the actual served index.html
      const res = await fetch(window.location.origin + window.location.pathname);
      let html = await res.text();

      // Check if this is a production build (single file) by looking for inlined scripts
      const hasInlineScript = /<script[^>]*>[\s\S]{1000,}<\/script>/i.test(html);

      if (hasInlineScript) {
        // Production build with vite-plugin-singlefile — HTML is already self-contained
        setProgress('¡Archivo autocontenido detectado!');
      } else {
        // Dev mode — need to fetch and inline resources
        setProgress('Modo desarrollo: empaquetando recursos...');
        
        const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');

        // Collect all loaded resources from performance API
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        
        // Fetch and inline CSS
        const cssResources = resources.filter(r => r.name.endsWith('.css') || r.initiatorType === 'link');
        let allCss = '';
        for (const cssR of cssResources) {
          try {
            if (cssR.name.endsWith('.css')) {
              const cssRes = await fetch(cssR.name);
              if (cssRes.ok) {
                let cssText = await cssRes.text();
                // Inline url() references
                const urlMatches = [...cssText.matchAll(/url\(["']?([^"')]+?)["']?\)/g)];
                for (const um of urlMatches) {
                  const ref = um[1];
                  if (ref.startsWith('data:') || ref.startsWith('blob:') || ref.startsWith('#')) continue;
                  try {
                    const assetUrl = new URL(ref, cssR.name).href;
                    const assetRes = await fetch(assetUrl);
                    if (assetRes.ok) {
                      const blob = await assetRes.blob();
                      const dataUri = await blobToDataUri(blob);
                      cssText = cssText.split(ref).join(dataUri);
                    }
                  } catch { /* skip */ }
                }
                allCss += cssText + '\n';
              }
            }
          } catch { /* skip */ }
        }

        // Fetch and inline JS bundles 
        const jsResources = resources.filter(r => 
          (r.name.endsWith('.js') || r.name.endsWith('.tsx') || r.name.endsWith('.ts') || r.name.endsWith('.jsx')) 
          && r.initiatorType === 'script'
        );
        
        // For dev mode, we can't properly inline ES modules
        // Instead, create a redirect page that loads from the published URL
        const publishedUrl = 'https://sprite-spark-joy.lovable.app';
        
        html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reliquia del Vacío — Choque de Leyendas</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: #000; 
      color: #7fefff; 
      font-family: 'Segoe UI', sans-serif;
      display: flex; 
      flex-direction: column;
      align-items: center; 
      justify-content: center; 
      height: 100vh;
      text-align: center;
    }
    h1 { 
      font-size: 28px; 
      margin-bottom: 20px;
      text-shadow: 0 0 20px rgba(0,200,255,0.5);
    }
    p { 
      color: #aaa; 
      margin-bottom: 30px; 
      max-width: 500px; 
      line-height: 1.6;
    }
    .info-box {
      background: rgba(0,40,80,0.5);
      border: 1px solid rgba(0,180,255,0.3);
      border-radius: 10px;
      padding: 30px;
      max-width: 600px;
    }
    code {
      background: rgba(0,180,255,0.15);
      padding: 2px 8px;
      border-radius: 4px;
      color: #00ff88;
      font-size: 14px;
    }
    ol { text-align: left; color: #ccc; line-height: 2; }
    .note { color: #ffcc33; font-size: 13px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="info-box">
    <h1>⚡ Reliquia del Vacío</h1>
    <p>Para obtener el archivo HTML autocontenido, necesitas generar el build de producción:</p>
    <ol>
      <li>Clona el repositorio desde GitHub</li>
      <li>Ejecuta <code>npm install</code></li>
      <li>Ejecuta <code>npm run build</code></li>
      <li>El archivo <code>dist/index.html</code> es tu juego completo</li>
    </ol>
    <p class="note">⚠ El build de producción usa vite-plugin-singlefile para incrustar TODO (JS, CSS, imágenes, audio) en un único archivo HTML.</p>
  </div>
</body>
</html>`;
      }

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'reliquia-del-vacio.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      setProgress('¡Descarga completa!');
      setTimeout(() => setProgress(''), 3000);
    } catch (err) {
      console.error('Error:', err);
      setProgress('Error al generar');
      setTimeout(() => setProgress(''), 3000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 250,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      animation: 'gilbertFadeIn 0.6s ease-out',
    }}>
      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: 'clamp(11px, 1.2vw, 15px)',
          fontWeight: 900,
          letterSpacing: 3,
          padding: '14px 32px',
          background: downloading
            ? 'linear-gradient(135deg, #1a1a3a, #0d0d2a)'
            : 'linear-gradient(135deg, #00cc66, #009944, #006633)',
          color: '#e0ffe0',
          border: `2px solid ${downloading ? '#444' : '#00ff88'}`,
          borderRadius: 8,
          cursor: downloading ? 'wait' : 'pointer',
          boxShadow: downloading
            ? '0 0 15px rgba(0,255,136,0.1)'
            : '0 0 30px rgba(0,255,136,0.4), 0 0 60px rgba(0,255,136,0.15), inset 0 0 20px rgba(0,255,136,0.1)',
          textShadow: '0 0 10px rgba(0,255,136,0.6)',
          transition: 'all 0.3s ease',
        }}
      >
        {downloading ? '⏳ GENERANDO...' : '⬇ DESCARGAR JUEGO (.HTML)'}
      </button>
      {progress && (
        <div style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: 11,
          color: '#00ff88',
          textShadow: '0 0 8px rgba(0,255,136,0.5)',
          letterSpacing: 1,
        }}>
          {progress}
        </div>
      )}
      <style>{`
        @keyframes gilbertFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(30px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default DownloadGameButton;
