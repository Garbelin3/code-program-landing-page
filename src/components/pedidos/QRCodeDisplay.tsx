
import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  code: string;
  size?: number;
}

export const QRCodeDisplay = ({ code, size = 200 }: QRCodeDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current && code) {
      QRCode.toCanvas(
        canvasRef.current,
        code,
        {
          width: size,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [code, size]);

  if (!code) return null;

  return (
    <div className="flex flex-col items-center justify-center">
      <canvas ref={canvasRef} />
      <p className="mt-2 font-mono text-lg">{code}</p>
    </div>
  );
};
