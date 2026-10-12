import { useState } from 'react';

function ImageSlot({ src, alt = '', label, sub = '자료 삽입 영역', className }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) {
    return (
      <div className={className ? `${className} slot` : 'slot'}>
        <span className="lbl">{label}</span>
        <span className="sub">{sub}</span>
      </div>
    );
  }

  return <img className={className} src={src} alt={alt} onError={() => setFailedSrc(src)} />;
}

export default ImageSlot;
