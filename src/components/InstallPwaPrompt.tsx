import React, { useEffect, useState } from 'react';

export const InstallPwaPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('pwa-install-dismissed') === '1') return;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window as any).navigator?.standalone;
    if (standalone) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos) {
      setIos(true);
      setShow(true);
    }
    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1');
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  };

  return (
    <div style={{
      position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px',
      padding: '12px 16px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)', maxWidth: '90vw'
    }}>
      <span style={{ color: '#f8fafc', fontSize: '13px' }}>
        {ios ? 'No iOS: toque em Compartilhar e "Adicionar à Tela de Início".' : 'Instalar app para acesso rápido?'}
      </span>
      {!ios && (
        <button onClick={install} style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#0284c7', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
          Instalar
        </button>
      )}
      <button onClick={dismiss} style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px' }}>
        Agora não
      </button>
    </div>
  );
};
