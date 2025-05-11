
declare module 'html5-qrcode' {
  export class Html5Qrcode {
    constructor(elementId: string, config?: any);
    
    start(
      cameraId: string,
      config: any,
      qrCodeSuccessCallback: (decodedText: string, decodedResult: any) => void,
      qrCodeErrorCallback?: (errorMessage: string, error: any) => void
    ): Promise<void>;
    
    stop(): Promise<void>;
    
    clear(): void;
  }
  
  export class Html5QrcodeScanner {
    constructor(
      elementId: string,
      config: {
        fps?: number;
        qrbox?: number | { width: number; height: number };
        aspectRatio?: number;
        disableFlip?: boolean;
        formatsToSupport?: Array<any>;
      },
      verbose?: boolean
    );
    
    render(
      qrCodeSuccessCallback: (decodedText: string, decodedResult: any) => void,
      qrCodeErrorCallback?: (errorMessage: string, error: any) => void
    ): void;
    
    clear(): void;
  }
}
