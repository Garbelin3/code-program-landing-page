
declare module 'qrcode' {
  interface QRCodeOptions {
    version?: number;
    errorCorrectionLevel?: string;
    maskPattern?: number;
    toSJISFunc?: (codePoint: string) => number;
    margin?: number;
    scale?: number;
    small?: boolean;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: QRCodeOptions,
    callback?: (error: Error | null) => void
  ): Promise<HTMLCanvasElement>;

  function toDataURL(
    text: string,
    options?: QRCodeOptions,
    callback?: (error: Error | null, url: string) => void
  ): Promise<string>;

  function toString(
    text: string,
    options?: QRCodeOptions,
    callback?: (error: Error | null, string: string) => void
  ): Promise<string>;

  export default {
    toCanvas,
    toDataURL,
    toString,
  };
}
