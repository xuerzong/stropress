import net from 'node:net'

export const resolveRequestedPort = (value: string | undefined) => {
  if (!value) {
    return undefined
  }

  const port = parseInt(value, 10)
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(
      `Invalid dev server port: ${value}. Expected an integer between 1 and 65535.`
    )
  }

  return port
}

const canListenOnPort = async (port: number) => {
  const host = '127.0.0.1'

  return new Promise<boolean>((resolve) => {
    const server = net.createServer()

    server.once('error', () => {
      resolve(false)
    })

    server.once('listening', () => {
      server.close(() => resolve(true))
    })

    server.listen(port, host)
  })
}

export const resolveAvailablePort = async (port: number) => {
  let nextPort = port

  while (nextPort <= 65535) {
    if (await canListenOnPort(nextPort)) {
      return nextPort
    }

    nextPort += 1
  }

  throw new Error(`No available dev server port found starting from ${port}.`)
}