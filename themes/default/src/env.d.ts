declare module "@lucide/astro" {
  export type LucideIconComponent = (props: Record<string, unknown>) => any;
  export const icons: Record<string, LucideIconComponent>;
}

declare module "copy-to-clipboard" {
  interface Options {
    debug?: boolean;
    message?: string;
    format?: string;
    onCopy?: (clipboardData: object) => void;
  }
  export default function copy(text: string, options?: Options): boolean;
}
