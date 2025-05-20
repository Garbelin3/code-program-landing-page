
import { useRef, useState, useEffect } from "react";
import { ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onCodeScanned: (codigo: string) => void;
}

export const QrScanner = ({ onCodeScanned }: QrScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = useRef<string>(`qr-reader-${Math.random().toString(36).substring(2, 9)}`);
  
  const startScanner = async () => {
    if (scannerRef.current) {
      // Scanner already running
      return;
    }
    
    // Create scanner container if it doesn't exist
    const scannerContainer = document.getElementById("scanner-container");
    if (!scannerContainer) {
      console.error("Scanner container not found");
      toast({
        title: "Erro",
        description: "Container para o scanner não encontrado",
        variant: "destructive"
      });
      return;
    }
    
    // Clear existing content
    scannerContainer.innerHTML = "";
    
    // Create a new div for the scanner
    const scannerDiv = document.createElement("div");
    scannerDiv.id = scannerDivId.current;
    scannerContainer.appendChild(scannerDiv);
    
    try {
      // Initialize the scanner with the ID of the div
      const scanner = new Html5Qrcode(scannerDivId.current);
      scannerRef.current = scanner;
      setScanning(true);
      
      console.log("Starting QR scanner");
      
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          console.log("QR Code decoded:", decodedText);
          // Verificar se o texto do QR é um JSON válido
          try {
            const qrData = JSON.parse(decodedText);
            console.log("Parsed QR data:", qrData);
            if (qrData.codigo && qrData.codigo.length === 6) {
              stopScanner();
              onCodeScanned(qrData.codigo);
            } else {
              toast({
                title: "QR Code inválido",
                description: "O QR code não contém um código de retirada válido",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error("Error parsing QR data:", error);
            toast({
              title: "QR Code inválido",
              description: "Não foi possível ler os dados do QR code",
              variant: "destructive"
            });
          }
        },
        (errorMessage) => {
          console.error("QR Scanner error:", errorMessage);
        }
      ).catch(error => {
        console.error("Failed to start scanner:", error);
        toast({
          title: "Erro ao iniciar scanner",
          description: "Verifique se você concedeu permissão para usar a câmera",
          variant: "destructive"
        });
        setScanning(false);
      });
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err);
      setScanning(false);
      toast({
        title: "Erro ao iniciar câmera",
        description: "Verifique se você concedeu permissão para usar a câmera",
        variant: "destructive"
      });
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          setScanning(false);
        })
        .catch((err) => {
          console.error("Erro ao parar scanner:", err);
        });
      scannerRef.current = null;
    }
  };

  // Limpar scanner quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(err => console.error(err));
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {!scanning ? (
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={startScanner}
        >
          <ScanLine className="mr-2 h-4 w-4" />
          Iniciar Scanner
        </Button>
      ) : (
        <div className="space-y-4">
          <div 
            id="scanner-container" 
            className="w-full rounded-md overflow-hidden"
            style={{ maxWidth: "100%", margin: "0 auto", height: "300px" }}
          ></div>
          <Button 
            variant="destructive"
            className="w-full" 
            onClick={stopScanner}
          >
            <X className="mr-2 h-4 w-4" />
            Parar Scanner
          </Button>
        </div>
      )}
    </div>
  );
};
