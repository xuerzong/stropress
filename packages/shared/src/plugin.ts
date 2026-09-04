export type JsonPrimitive = string | number | boolean | null

export type JsonValue =
  JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export interface StropressPlugin<N extends string = string, O = unknown> {
  name: N
  options?: O
}

export const definePlugin = <N extends string, O>(
  name: N,
  options?: O
): StropressPlugin<N, O> => {
  return { name, options }
}

export const getPlugin = <P extends { name: string }>(
  plugins: readonly P[] | undefined,
  name: string
): P | undefined => plugins?.find((plugin) => plugin.name === name)

export const isPluginEnabled = (
  plugins: readonly { name: string }[] | undefined,
  name: string
): boolean => getPlugin(plugins, name) !== undefined
