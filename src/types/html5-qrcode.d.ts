
declare module "html5-qrcode" {
  export class Html5QrcodeScanner {
    constructor(
      elementId: string,
      config: {
        fps: number;
        qrbox: number | { width: number; height: number };
      },
      verbose: boolean
    );
    render(
      onScanSuccess: (decodedText: string, decodedResult?: any) => void,
      onScanFailure?: (error: any) => void
    ): void;
    clear(): void;
  }

  export class Html5Qrcode {
    constructor(elementId: string);
    start(
      cameraId: string,
      config: {
        fps: number;
        qrbox: number | { width: number; height: number };
      },
      onScanSuccess: (decodedText: string, decodedResult?: any) => void,
      onScanFailure?: (error: any) => void
    ): Promise<void>;
    stop(): Promise<void>;
  }
}
