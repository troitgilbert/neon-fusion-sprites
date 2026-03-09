import React, { useState } from 'react';
import JSZip from 'jszip';

const DownloadGameButton: React.FC = () => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    setProgress('Recopilando recursos...');

    try {
      const zip = new JSZip();

      // Fetch the main HTML
      const htmlRes = await fetch(window.location.href);
      let html = await htmlRes.text();

      // Find all linked assets (scripts, styles, images)
      const assetUrls = new Set<string>();
      const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');

      // Extract src and href from HTML
      const srcMatches = html.matchAll(/(?:src|href)=["']([^"']+)["']/g);
      for (const m of srcMatches) {
        const url = m[1];
        if (url && !url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('#')) {
          assetUrls.add(url);
        }
      }

      // Also scan for assets referenced in loaded stylesheets and scripts
      const scripts = document.querySelectorAll('script[src]');
      scripts.forEach(s => {
        const src = s.getAttribute('src');
        if (src && !src.startsWith('http')) assetUrls.add(src);
      });

      const links = document.querySelectorAll('link[href]');
      links.forEach(l => {
        const href = l.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('data:')) assetUrls.add(href);
      });

      setProgress(`Descargando ${assetUrls.size} archivos...`);

      // Fetch all assets
      let fetched = 0;
      for (const url of assetUrls) {
        try {
          const cleanUrl = url.startsWith('./') ? url : './' + url.replace(/^\//, '');
          const fullUrl = new URL(url, baseUrl).href;
          const res = await fetch(fullUrl);
          if (res.ok) {
            const blob = await res.blob();
            zip.file(cleanUrl.replace(/^\.\//, ''), blob);
            fetched++;
            setProgress(`Descargando ${fetched}/${assetUrls.size}...`);
          }
        } catch {
          // Skip failed assets
        }
      }

      // Now fetch JS modules that might import other assets
      // Scan loaded JS for additional asset references
      const jsFiles = Array.from(assetUrls).filter(u => u.endsWith('.js') || u.endsWith('.mjs'));
      for (const jsUrl of jsFiles) {
        try {
          const fullUrl = new URL(jsUrl, baseUrl).href;
          const jsRes = await fetch(fullUrl);
          const jsText = await jsRes.text();
          
          // Find asset references in JS (common Vite patterns)
          const assetRefs = jsText.matchAll(/["']([^"']*?\.(?:png|jpg|jpeg|gif|svg|webp|mp3|wav|ogg|woff2?|ttf|eot|css)(?:\?[^"']*)?)["']/g);
          for (const ref of assetRefs) {
            const assetPath = ref[1];
            if (assetPath && !assetPath.startsWith('http') && !assetPath.startsWith('data:') && !assetUrls.has(assetPath)) {
              try {
                const cleanPath = assetPath.startsWith('./') ? assetPath : './' + assetPath.replace(/^\//, '');
                const assetFullUrl = new URL(assetPath, baseUrl).href;
                const assetRes = await fetch(assetFullUrl);
                if (assetRes.ok) {
                  const blob = await assetRes.blob();
                  zip.file(cleanPath.replace(/^\.\//, ''), blob);
                }
              } catch {
                // Skip
              }
            }
          }
        } catch {
          // Skip
        }
      }

      // Update HTML to use relative paths
      html = html.replace(/src=["']\/(?!\/)/g, 'src="./');
      html = html.replace(/href=["']\/(?!\/)/g, 'href="./');
      zip.file('index.html', html);

      setProgress('Comprimiendo...');
      const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setProgress(`Comprimiendo... ${Math.round(metadata.percent)}%`);
      });

      // Trigger download
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = 'reliquia-del-vacio.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      setProgress('¡Descarga completa!');
      setTimeout(() => setProgress(''), 3000);
    } catch (err) {
      console.error('Download error:', err);
      setProgress('Error al descargar');
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
        {downloading ? '⏳ DESCARGANDO...' : '⬇ DESCARGAR JUEGO (.ZIP)'}
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

export default DownloadGameButton;
