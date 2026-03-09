import React, { useState } from 'react';

/**
 * Generates a fully self-contained single .html file
 * by inlining all JS, CSS, and assets as base64 data URIs.
 */

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed: ${url}`);
  return res.text();
}

async function fetchBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed: ${url}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function resolveUrl(relative: string, base: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

async function collectImportGraph(entryUrl: string, collected: Map<string, string>, onProgress: (msg: string) => void) {
  if (collected.has(entryUrl)) return;
  collected.set(entryUrl, ''); // mark as in-progress

  onProgress(`Procesando módulo ${collected.size}...`);
  let code: string;
  try {
    code = await fetchText(entryUrl);
  } catch {
    collected.delete(entryUrl);
    return;
  }

  // Find static imports: import ... from "..." and dynamic import("...")
  const importRegex = /(?:import\s+[\s\S]*?from\s+["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\))/g;
  const deps: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = importRegex.exec(code)) !== null) {
    const dep = m[1] || m[2];
    if (dep && (dep.startsWith('.') || dep.startsWith('/'))) {
      deps.push(resolveUrl(dep, entryUrl));
    }
  }

  collected.set(entryUrl, code);

  // Recursively collect dependencies
  for (const dep of deps) {
    await collectImportGraph(dep, collected, onProgress);
  }
}

async function inlineAssetsInCode(code: string, baseUrl: string, assetCache: Map<string, string>, onProgress: (msg: string) => void): Promise<string> {
  // Find asset references (images, fonts, audio)
  const assetRegex = /["']([^"']*?\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp3|wav|ogg|mp4|woff2?|ttf|eot|avif)(?:\?[^"']*)?)["']/g;
  const replacements: Array<{ original: string; dataUri: string }> = [];
  const seen = new Set<string>();

  let am: RegExpExecArray | null;
  while ((am = assetRegex.exec(code)) !== null) {
    const ref = am[1];
    if (ref.startsWith('data:') || ref.startsWith('blob:') || seen.has(ref)) continue;
    seen.add(ref);

    const fullUrl = resolveUrl(ref, baseUrl);
    if (assetCache.has(fullUrl)) {
      replacements.push({ original: ref, dataUri: assetCache.get(fullUrl)! });
      continue;
    }

    try {
      onProgress(`Incrustando asset: ${ref.split('/').pop()}`);
      const dataUri = await fetchBase64(fullUrl);
      assetCache.set(fullUrl, dataUri);
      replacements.push({ original: ref, dataUri });
    } catch {
      // skip
    }
  }

  let result = code;
  for (const r of replacements) {
    // Escape special regex chars in the original path
    const escaped = r.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), r.dataUri);
  }
  return result;
}

async function generateSingleHtml(onProgress: (msg: string) => void): Promise<string> {
  const baseUrl = window.location.href.replace(/[#?].*$/, '');
  const baseOrigin = window.location.origin;
  const basePath = baseUrl.replace(/[^/]*$/, '');

  onProgress('Obteniendo HTML principal...');
  let html = await fetchText(baseUrl);

  const assetCache = new Map<string, string>();

  // 1. Inline all <link rel="stylesheet"> as <style>
  onProgress('Procesando hojas de estilo...');
  const cssLinkRegex = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi;
  const cssReplacements: Array<{ tag: string; inlined: string }> = [];
  let cm: RegExpExecArray | null;
  while ((cm = cssLinkRegex.exec(html)) !== null) {
    const href = cm[1];
    const fullUrl = resolveUrl(href, basePath);
    try {
      let cssText = await fetchText(fullUrl);
      // Inline url() references in CSS
      const urlRegex = /url\(["']?([^"')]+?)["']?\)/g;
      const cssAssetReplacements: Array<{ original: string; dataUri: string }> = [];
      let um: RegExpExecArray | null;
      while ((um = urlRegex.exec(cssText)) !== null) {
        const ref = um[1];
        if (ref.startsWith('data:') || ref.startsWith('blob:') || ref.startsWith('#')) continue;
        const assetUrl = resolveUrl(ref, fullUrl);
        try {
          onProgress(`CSS asset: ${ref.split('/').pop()}`);
          const dataUri = await fetchBase64(assetUrl);
          assetCache.set(assetUrl, dataUri);
          cssAssetReplacements.push({ original: ref, dataUri });
        } catch { /* skip */ }
      }
      for (const r of cssAssetReplacements) {
        const escaped = r.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cssText = cssText.replace(new RegExp(escaped, 'g'), r.dataUri);
      }
      cssReplacements.push({ tag: cm[0], inlined: `<style>${cssText}</style>` });
    } catch { /* skip */ }
  }
  for (const r of cssReplacements) {
    html = html.replace(r.tag, r.inlined);
  }

  // 2. Collect entire JS module graph and inline
  onProgress('Recopilando módulos JavaScript...');
  const scriptRegex = /<script[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi;
  const scriptReplacements: Array<{ tag: string; inlined: string }> = [];
  let sm: RegExpExecArray | null;
  while ((sm = scriptRegex.exec(html)) !== null) {
    const src = sm[1];
    const fullUrl = resolveUrl(src, basePath);
    const isModule = sm[0].includes('type="module"') || sm[0].includes("type='module'");

    try {
      if (isModule) {
        // Collect entire import graph
        const modules = new Map<string, string>();
        await collectImportGraph(fullUrl, modules, onProgress);

        // Inline all assets in all modules
        const inlinedModules: string[] = [];
        for (const [modUrl, modCode] of modules) {
          let processed = await inlineAssetsInCode(modCode, modUrl, assetCache, onProgress);

          // Remove import statements (we're bundling everything inline)
          // Replace: import ... from "./..." with nothing (the code is all concatenated)
          // Replace: export default/export const/etc - keep them but they won't matter in a single script
          
          // For relative imports, we just inline them in order
          processed = processed.replace(/import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*/g, '');
          processed = processed.replace(/import\s*\(\s*["'][^"']+["']\s*\)/g, 'Promise.resolve({})');

          inlinedModules.push(`// Module: ${modUrl.split('/').pop()}\n${processed}`);
        }

        const bundled = inlinedModules.join('\n\n');
        scriptReplacements.push({
          tag: sm[0],
          inlined: `<script type="module">\n${bundled}\n</script>`
        });
      } else {
        let code = await fetchText(fullUrl);
        code = await inlineAssetsInCode(code, fullUrl, assetCache, onProgress);
        scriptReplacements.push({
          tag: sm[0],
          inlined: `<script>\n${code}\n</script>`
        });
      }
    } catch { /* skip */ }
  }
  for (const r of scriptReplacements) {
    html = html.replace(r.tag, r.inlined);
  }

  // 3. Inline remaining asset references in HTML (favicon, og:image, etc.)
  onProgress('Incrustando assets del HTML...');
  const htmlAssetRegex = /(?:src|href|content)=["']([^"']*?\.(?:png|jpg|jpeg|gif|svg|webp|ico)(?:\?[^"']*)?)["']/gi;
  const htmlAssetReplacements: Array<{ original: string; dataUri: string }> = [];
  let hm: RegExpExecArray | null;
  while ((hm = htmlAssetRegex.exec(html)) !== null) {
    const ref = hm[1];
    if (ref.startsWith('data:') || ref.startsWith('http')) continue;
    const fullUrl = resolveUrl(ref, basePath);
    if (assetCache.has(fullUrl)) {
      htmlAssetReplacements.push({ original: ref, dataUri: assetCache.get(fullUrl)! });
      continue;
    }
    try {
      const dataUri = await fetchBase64(fullUrl);
      assetCache.set(fullUrl, dataUri);
      htmlAssetReplacements.push({ original: ref, dataUri });
    } catch { /* skip */ }
  }
  for (const r of htmlAssetReplacements) {
    html = html.replace(new RegExp(r.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), r.dataUri);
  }

  // Remove any lovable-tagger or HMR related scripts
  html = html.replace(/<script[^>]*lovable[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script[^>]*@vite[^>]*>[\s\S]*?<\/script>/gi, '');

  onProgress('¡HTML generado!');
  return html;
}

const DownloadGameButton: React.FC = () => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    setProgress('Iniciando...');

    try {
      const html = await generateSingleHtml(setProgress);

      setProgress('Preparando descarga...');
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
      console.error('Error generando HTML:', err);
      setProgress('Error al generar HTML');
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
          maxWidth: 400,
          textAlign: 'center',
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
