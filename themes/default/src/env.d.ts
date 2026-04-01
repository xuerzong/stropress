declare module "@lucide/astro" {
  export type LucideIconComponent = (props: Record<string, unknown>) => any;
  export const icons: Record<string, LucideIconComponent>;
}
