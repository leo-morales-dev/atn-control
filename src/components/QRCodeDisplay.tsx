// components/QRCodeDisplay.tsx
"use client"

import { useQRCode } from 'next-qrcode';

export function QRCodeDisplay({ text }: { text: string }) {
  const { Canvas } = useQRCode();

  return (
    <Canvas
      text={text}
      options={{
        errorCorrectionLevel: 'M',
        margin: 2,
        scale: 4,
        width: 140,
      }}
    />
  );
}