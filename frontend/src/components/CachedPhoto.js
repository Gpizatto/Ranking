// frontend/src/components/CachedPhoto.js
// Componente para cachear data URIs de fotos via blob URLs
// Elimina re-decodes de base64 → qualidade consistente

import React, { useState, useEffect } from 'react';

/**
 * CachedPhoto - Renderiza fotos data:image URI com cache eficiente
 * 
 * PROBLEMA RESOLVIDO:
 * - Data URIs não são cacheadas pelo browser
 * - Cada render decodifica base64 novamente → variação de qualidade
 * 
 * SOLUÇÃO:
 * - Converte data URI → Blob → Object URL (blob://)
 * - blob:// URLs são cacheadas nativamente
 * - Mesmo ImageBitmap usado em todos os renders → qualidade consistente
 * 
 * @param {string} url - data:image URI ou URL normal
 * @param {object} style - CSS styles para o container
 * @param {React.ReactNode} fallbackInitials - Conteúdo exibido sem foto (iniciais)
 */
export const CachedPhoto = ({ url, style, fallbackInitials }) => {
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Se não for data URI, usa direto
    if (!url || !url.startsWith('data:image')) {
      setObjectUrl(url || null);
      return;
    }
    
    let cancelled = false;
    setLoading(true);
    
    // Converte data URI → Blob → Object URL
    fetch(url)
      .then(r => r.blob())
      .then(blob => {
        if (!cancelled) {
          const blobUrl = URL.createObjectURL(blob);
          setObjectUrl(blobUrl);
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn('Failed to cache photo:', err);
        if (!cancelled) {
          setLoading(false);
        }
      });
    
    // Cleanup: revoke blob URL para evitar memory leak
    return () => {
      cancelled = true;
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url]);
  
  return (
    <div style={{
      ...style,
      backgroundImage: objectUrl ? `url(${objectUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {!objectUrl && !loading && fallbackInitials}
    </div>
  );
};

export default CachedPhoto;
