// selfsigned ships no type declarations; this covers the one call in vite.config.ts.
declare module 'selfsigned' {
  interface Pems {
    private: string;
    public: string;
    cert: string;
    fingerprint: string;
  }
  export function generate(attrs?: unknown, options?: unknown): Pems;
  const _default: { generate: typeof generate };
  export default _default;
}
