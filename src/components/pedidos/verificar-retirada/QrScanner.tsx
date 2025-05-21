import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Camera, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import jsQR from "jsqr";

interface QrScannerProps {
  onCodeScanned: (code: string) => void;
}

export const QrScanner: React.FC<QrScannerProps> = ({ onCodeScanned }) => {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Função para iniciar o scanner
  const startScanner = async () => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);
    
    try {
      // Verificar se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador não suporta acesso à câmera. Tente usar Chrome, Firefox ou Edge.");
      }
      
      // Solicitar acesso à câmera
      const constraints = {
        video: { 
          facingMode: "environment", // Usar câmera traseira quando disponível
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      // Tentar obter acesso à câmera
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Verificar se o elemento de vídeo existe
      if (!videoRef.current) {
        throw new Error("Elemento de vídeo não encontrado");
      }
      
      // Conectar o stream ao elemento de vídeo
      videoRef.current.srcObject = stream;
      
      // Iniciar o vídeo quando estiver pronto
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => {
              setScanning(true);
              setLoading(false);
              startScanningFrames();
            })
            .catch(err => {
              console.error("Erro ao iniciar o vídeo:", err);
              setError("Não foi possível iniciar o vídeo. Verifique as permissões.");
              setLoading(false);
            });
        }
      };
      
    } catch (err: any) {
      console.error("Erro ao iniciar o scanner:", err);
      
      // Verificar se o erro é de permissão negada
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError("Permissão para acessar a câmera foi negada. Verifique as configurações do seu navegador.");
      } else {
        setError(`Erro ao iniciar a câmera: ${err.message || "Erro desconhecido"}`);
      }
      
      setLoading(false);
    }
  };
  
  // Função para processar frames do vídeo e detectar QR codes
  const startScanningFrames = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    
    const scanFrame = () => {
      if (!videoRef.current || !canvasRef.current || !context || !scanning) return;
      
      try {
        // Ajustar o tamanho do canvas para corresponder ao vídeo
        const video = videoRef.current;
        
        // Verificar se o vídeo está pronto e tem dimensões válidas
        if (video.readyState !== video.HAVE_ENOUGH_DATA || video.videoWidth === 0 || video.videoHeight === 0) {
          animationRef.current = requestAnimationFrame(scanFrame);
          return;
        }
        
        // Definir dimensões do canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Desenhar o frame atual no canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Obter os dados da imagem do canvas
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Usar jsQR para detectar QR codes na imagem
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert", // Mais rápido, mas pode perder alguns QR codes
        });
        
        // Se um QR code foi detectado
        if (code) {
          console.log("QR code detectado:", code.data);
          
          // Verificar se o código tem conteúdo
          if (code.data && code.data.trim() !== "") {
            handleCodeDetected(code.data);
            return; // Parar o loop após detectar um código
          }
        }
        
        // Continuar escaneando
        animationRef.current = requestAnimationFrame(scanFrame);
      } catch (err) {
        console.error("Erro ao processar frame:", err);
        // Continuar mesmo com erro
        animationRef.current = requestAnimationFrame(scanFrame);
      }
    };
    
    // Iniciar o loop de escaneamento
    animationRef.current = requestAnimationFrame(scanFrame);
  };
  
  // Função chamada quando um código QR é detectado
  const handleCodeDetected = (code: string) => {
    console.log("Código QR detectado:", code);
    stopScanner();
    onCodeScanned(code);
  };
  
  // Função para parar o scanner
  const stopScanner = () => {
    // Parar o loop de animação
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Parar todas as tracks do stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Limpar o vídeo
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
  };
  
  // Limpar recursos quando o componente for desmontado
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);
  
  return (
    <div className="space-y-4">
      {/* Alerta de permissão negada */}
      {permissionDenied && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Permissão negada</AlertTitle>
          <AlertDescription>
            Você precisa permitir o acesso à câmera para usar o scanner. 
            Verifique as configurações do seu navegador e recarregue a página.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Container para o scanner */}
      <div className="w-full bg-gray-100 rounded-md overflow-hidden relative" style={{ height: '300px' }}>
        {/* Elemento de vídeo para exibir a câmera */}
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          style={{ display: scanning ? 'block' : 'none' }}
        ></video>
        
        {/* Canvas para processamento de frames (invisível) */}
        <canvas 
          ref={canvasRef}
          className="hidden"
        ></canvas>
        
        {/* Overlay quando não está escaneando */}
        {!scanning && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {/* Overlay de carregamento */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="bg-white p-4 rounded-md shadow-md flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm">Inicializando câmera...</p>
            </div>
          </div>
        )}
        
        {/* Guia de escaneamento */}
        {scanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary rounded-lg"></div>
          </div>
        )}
      </div>
      
      {/* Mensagem de erro */}
      {error && !permissionDenied && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {/* Botões de controle */}
      <div className="flex justify-center">
        {!scanning ? (
          <Button 
            onClick={startScanner} 
            disabled={loading}
            className="w-full"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
            Iniciar Scanner
          </Button>
        ) : (
          <Button 
            onClick={stopScanner} 
            variant="destructive"
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Parar Scanner
          </Button>
        )}
      </div>
      
      {/* Instruções */}
      <div className="text-xs text-center text-gray-500 space-y-1">
        <p>
          Posicione o código QR no centro da câmera para escaneá-lo automaticamente.
        </p>
        <p>
          Certifique-se de que o QR code esteja bem iluminado e não esteja muito distante ou muito próximo da câmera.
        </p>
      </div>
    </div>
  );
};
