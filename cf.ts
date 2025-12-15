import { connect } from 'cloudflare:sockets'
import { encodeBase64 as e } from './macros.ts' with { type: "macro" };
const decoder = new TextDecoder('utf-8')
function d(b: string) {
  return decoder.decode(Uint8Array.fromBase64(b))
}
// {"epd":"no","epi":"yes","egi":"no","ipv4":"yes","ipv6":"yes","ispMobile":"no","ispUnicom":"yes","ispTelecom":"no","dkby":"yes","rm":"no","ev":"yes","et":"no","ex":"no","wk":"US"}

let reverseProxyIPs = [
  { domain: '2602:fc59:b0:64::', desc: d(e('net64 兜底')), id: 'net64' },
  { domain: d(e('proxyip.us.cmliussss.net')), desc: d(e('🇺🇸 美国中转')), id: 'US' },
  { domain: d(e('proxyip.sg.cmliussss.net')), desc: d(e('🇸🇬 新加坡中转')), id: 'SG' },
  { domain: d(e('proxyip.jp.cmliussss.net')), desc: d(e('🇯🇵 日本中转')), id: 'JP' },
  { domain: d(e('proxyip.kr.cmliussss.net')), desc: d(e('🇰🇷 韩国中转')), id: 'KR' },
  { domain: d(e('proxyip.de.cmliussss.net')), desc: d(e('🇩🇪 德国中转')), id: 'DE' },
  { domain: d(e('proxyip.se.cmliussss.net')), desc: d(e('🇸🇪 瑞典中转')), id: 'SE' },
  { domain: d(e('proxyip.nl.cmliussss.net')), desc: d(e('🇳🇱 荷兰中转')), id: 'NL' },
  { domain: d(e('proxyip.fi.cmliussss.net')), desc: d(e('🇫🇮 芬兰中转')), id: 'FI' },
  { domain: d(e('proxyip.gb.cmliussss.net')), desc: d(e('🇬🇧 英国中转')), id: 'GB' },
  { domain: d(e('proxyip.oracle.cmliussss.net')), desc: d(e('Oracle中转')), id: 'Oracle' },
  { domain: d(e('proxyip.digitalocean.cmliussss.net')), desc: d(e('DigitalOcean中转')), id: 'DigitalOcean' },
  { domain: d(e('proxyip.vultr.cmliussss.net')), desc: d(e('Vultr中转')), id: 'Vultr' },
  { domain: d(e('proxyip.multacom.cmliussss.net')), desc: d(e('Multacom中转')), id: 'Multacom' },
]

export default {
  async fetch(request: Request, env: Record<string, string>) {
    const uuid = env.u
    if (!uuid) {
      return new Response('UnInit', { status: 500 })
    }
    const url = new URL(request.url)
    if (url.pathname === `/${uuid}/sub`) {
      return handleSubscriptionRequest(uuid, url.hostname, url.searchParams.get('ip') || url.hostname)
    }
    if (request.headers.get('Upgrade') === atob('d2Vic29ja2V0')) {
      return await handleWsRequest(request, uuid, url.searchParams.get('rp'))
    }
    return new Response('hello', { status: 200 })
  },
}

async function handleSubscriptionRequest(user: string, sni: string, ip: string) {
  const wsPath = d(e('/?ed=2048'))
  const proto = d(e('vless'))

  const links = reverseProxyIPs.map(
    (c) =>
      `${proto}://${user}@${ip}:${443}?${new URLSearchParams({
        encryption: 'none',
        security: 'tls',
        sni: sni,
        fp: 'chrome',
        type: 'ws',
        host: sni,
        path: wsPath + (c.id ? `&rp=${c.id}` : ''),
      }).toString()}#${encodeURIComponent(c.desc)}`
  )

  return new Response(btoa(links.join('\n')), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  })
}

const E_INVALID_DATA = atob('aW52YWxpZCBkYXRh')
const E_INVALID_USER = atob('aW52YWxpZCB1c2Vy')
const E_UNSUPPORTED_CMD = atob('Y29tbWFuZCBpcyBub3Qgc3VwcG9ydGVk')
const E_UDP_DNS_ONLY = atob('VURQIHByb3h5IG9ubHkgZW5hYmxlIGZvciBETlMgd2hpY2ggaXMgcG9ydCA1Mw==')
const E_INVALID_ADDR_TYPE = atob('aW52YWxpZCBhZGRyZXNzVHlwZQ==')
const E_EMPTY_ADDR = atob('YWRkcmVzc1ZhbHVlIGlzIGVtcHR5')
const E_WS_NOT_OPEN = atob('d2ViU29ja2V0LmVhZHlTdGF0ZSBpcyBub3Qgb3Blbg==')
const E_INVALID_ID_STR = atob('U3RyaW5naWZpZWQgaWRlbnRpZmllciBpcyBpbnZhbGlk')

let isSocksEnabled = false

const ADDRESS_TYPE_IPV4 = 1
const ADDRESS_TYPE_URL = 2
const ADDRESS_TYPE_IPV6 = 3

function isValidFormat(str: any) {
  const userRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return userRegex.test(str)
}

async function handleWsRequest(request: any, user: string, _p: any) {
  const wsPair = new WebSocketPair()
  const [clientSock, serverSock] = Object.values(wsPair)
  serverSock!.accept()

  let remoteConnWrapper: any = { socket: null }
  let isDnsQuery = false
  let protocolType: any = null

  const earlyData = request.headers.get(atob('c2VjLXdlYnNvY2tldC1wcm90b2NvbA==')) || ''
  const readable = makeReadableStream(serverSock, earlyData)

  readable
    .pipeTo(
      new WritableStream({
        async write(chunk) {
          if (isDnsQuery) return await forwardUDP(chunk, serverSock, null)
          if (remoteConnWrapper.socket) {
            const writer = remoteConnWrapper.socket.writable.getWriter()
            await writer.write(chunk)
            writer.releaseLock()
            return
          }

          if (!protocolType) {
            if (chunk.byteLength >= 24) {
              const vlessResult = parseWsPacketHeader(chunk, user)
              if (!vlessResult.hasError) {
                protocolType = d(e('vless'))
                const { addressType, port, hostname, rawIndex, version, isUDP } = vlessResult
                if (isUDP) {
                  if (port === 53) isDnsQuery = true
                  else throw new Error(E_UDP_DNS_ONLY)
                }
                const respHeader = new Uint8Array([version![0]!, 0])
                const rawData = chunk.slice(rawIndex)
                if (isDnsQuery) return forwardUDP(rawData, serverSock, respHeader)
                await forwardTCP(addressType, hostname, port, rawData, serverSock, respHeader, remoteConnWrapper)
                return
              }
            }

            throw new Error('Invalid protocol or authentication failed')
          }
        },
      })
    )
    .catch((err) => {})

  return new Response(null, { status: 101, webSocket: clientSock })
}

async function forwardTCP(addrType: any, host: any, portNum: any, rawData: any, ws: any, respHeader: any, remoteConnWrapper: any) {
  async function connectAndSend(address: any, port: any) {
    const remoteSock = connect({ hostname: address, port: port })
    const writer = remoteSock.writable.getWriter()
    await writer.write(rawData)
    writer.releaseLock()
    return remoteSock
  }

  let retryConnection: any = undefined
  // async function retryConnection() {
  //     let backupHost, backupPort
  //     if (fallbackAddress && fallbackAddress.trim() && fallbackPort) {
  //       backupHost = fallbackAddress
  //       backupPort = parseInt(fallbackPort, 10) || portNum
  //     } else {
  //       const bestBackupIP = await getBestBackupIP(currentWorkerRegion)
  //       backupHost = bestBackupIP ? bestBackupIP.domain : host
  //       backupPort = bestBackupIP ? bestBackupIP.port : portNum
  //     }

  //     try {
  //       const fallbackSocket = await connectAndSend(backupHost, backupPort, isSocksEnabled)
  //       remoteConnWrapper.socket = fallbackSocket
  //       fallbackSocket.closed.catch(() => {}).finally(() => closeSocketQuietly(ws))
  //       connectStreams(fallbackSocket, ws, respHeader, null)
  //     } catch (fallbackErr) {
  //       closeSocketQuietly(ws)
  //     }
  // }

  try {
    const initialSocket = await connectAndSend(host, portNum)
    remoteConnWrapper.socket = initialSocket
    connectStreams(initialSocket, ws, respHeader, retryConnection)
  } catch (err) {
    retryConnection()
  }
}

function parseWsPacketHeader(chunk: any, token: any) {
  if (chunk.byteLength < 24) return { hasError: true, message: E_INVALID_DATA }
  const version = new Uint8Array(chunk.slice(0, 1))
  if (formatIdentifier(new Uint8Array(chunk.slice(1, 17))) !== token) return { hasError: true, message: E_INVALID_USER }
  const optLen: any = new Uint8Array(chunk.slice(17, 18))[0]
  const cmd = new Uint8Array(chunk.slice(18 + optLen, 19 + optLen))[0]
  let isUDP = false
  if (cmd === 1) {
  } else if (cmd === 2) {
    isUDP = true
  } else {
    return { hasError: true, message: E_UNSUPPORTED_CMD }
  }
  const portIdx = 19 + optLen
  const port = new DataView(chunk.slice(portIdx, portIdx + 2)).getUint16(0)
  let addrIdx = portIdx + 2,
    addrLen: any = 0,
    addrValIdx = addrIdx + 1,
    hostname = ''
  const addressType = new Uint8Array(chunk.slice(addrIdx, addrValIdx))[0]
  switch (addressType) {
    case ADDRESS_TYPE_IPV4:
      addrLen = 4
      hostname = new Uint8Array(chunk.slice(addrValIdx, addrValIdx + addrLen)).join('.')
      break
    case ADDRESS_TYPE_URL:
      addrLen = new Uint8Array(chunk.slice(addrValIdx, addrValIdx + 1))[0]
      addrValIdx += 1
      hostname = new TextDecoder().decode(chunk.slice(addrValIdx, addrValIdx + addrLen))
      break
    case ADDRESS_TYPE_IPV6:
      addrLen = 16
      const ipv6 = []
      const ipv6View = new DataView(chunk.slice(addrValIdx, addrValIdx + addrLen))
      for (let i = 0; i < 8; i++) ipv6.push(ipv6View.getUint16(i * 2).toString(16))
      hostname = ipv6.join(':')
      break
    default:
      return { hasError: true, message: `${E_INVALID_ADDR_TYPE}: ${addressType}` }
  }
  if (!hostname) return { hasError: true, message: `${E_EMPTY_ADDR}: ${addressType}` }
  return { hasError: false, addressType, port, hostname, isUDP, rawIndex: addrValIdx + addrLen, version }
}

function makeReadableStream(socket: any, earlyDataHeader: any) {
  let cancelled = false
  return new ReadableStream({
    start(controller) {
      socket.addEventListener('message', (event: any) => {
        if (!cancelled) controller.enqueue(event.data)
      })
      socket.addEventListener('close', () => {
        if (!cancelled) {
          closeSocketQuietly(socket)
          controller.close()
        }
      })
      socket.addEventListener('error', (err: any) => controller.error(err))
      const { earlyData, error } = base64ToArray(earlyDataHeader)
      if (error) controller.error(error)
      else if (earlyData) controller.enqueue(earlyData)
    },
    cancel() {
      cancelled = true
      closeSocketQuietly(socket)
    },
  })
}

async function connectStreams(remoteSocket: any, webSocket: any, headerData: any, retryFunc: any) {
  let header = headerData,
    hasData = false
  await remoteSocket.readable
    .pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          hasData = true
          if (webSocket.readyState !== 1) controller.error(E_WS_NOT_OPEN)
          if (header) {
            webSocket.send(await new Blob([header, chunk]).arrayBuffer())
            header = null
          } else {
            webSocket.send(chunk)
          }
        },
        abort(reason) {},
      })
    )
    .catch((error: any) => {
      closeSocketQuietly(webSocket)
    })
  if (!hasData && retryFunc) retryFunc()
}

async function forwardUDP(udpChunk: any, webSocket: any, respHeader: any) {
  try {
    const tcpSocket = connect({ hostname: '8.8.4.4', port: 53 })
    let header = respHeader
    const writer = tcpSocket.writable.getWriter()
    await writer.write(udpChunk)
    writer.releaseLock()
    await tcpSocket.readable.pipeTo(
      new WritableStream({
        async write(chunk) {
          if (webSocket.readyState === 1) {
            if (header) {
              webSocket.send(await new Blob([header, chunk]).arrayBuffer())
              header = null
            } else {
              webSocket.send(chunk)
            }
          }
        },
      })
    )
  } catch (error) {}
}

function base64ToArray(b64Str: string) {
  if (!b64Str) return { error: null }
  try {
    b64Str = b64Str.replace(/-/g, '+').replace(/_/g, '/')
    return { earlyData: Uint8Array.from(atob(b64Str), (c) => c.charCodeAt(0)).buffer, error: null }
  } catch (error) {
    return { error }
  }
}

function closeSocketQuietly(socket: any) {
  try {
    if (socket.readyState === 1 || socket.readyState === 2) socket.close()
  } catch (error) {}
}

const hexTable: any[] = Array.from({ length: 256 }, (v, i) => (i + 256).toString(16).slice(1))
function formatIdentifier(arr: any, offset = 0) {
  const id = (
    hexTable[arr[offset]] +
    hexTable[arr[offset + 1]] +
    hexTable[arr[offset + 2]] +
    hexTable[arr[offset + 3]] +
    '-' +
    hexTable[arr[offset + 4]] +
    hexTable[arr[offset + 5]] +
    '-' +
    hexTable[arr[offset + 6]] +
    hexTable[arr[offset + 7]] +
    '-' +
    hexTable[arr[offset + 8]] +
    hexTable[arr[offset + 9]] +
    '-' +
    hexTable[arr[offset + 10]] +
    hexTable[arr[offset + 11]] +
    hexTable[arr[offset + 12]] +
    hexTable[arr[offset + 13]] +
    hexTable[arr[offset + 14]] +
    hexTable[arr[offset + 15]]
  ).toLowerCase()
  if (!isValidFormat(id)) throw new TypeError(E_INVALID_ID_STR)
  return id
}
