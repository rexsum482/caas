const { protocol, hostname, port } = window.location;

// 🌐 Build base origin (handles ports for local dev)
const origin = `${protocol}//${hostname}${port ? `:${port}` : ""}`;

// 🔌 Determine WS protocol
const wsProtocol = protocol === "https:" ? "wss:" : "ws:";

// 🔌 Build websocket URL
const websocket = `${wsProtocol}//${hostname}${port ? `:${port}` : ""}`;

const WEBPAGE = origin;
const WEBSOCKET = websocket;

export { WEBPAGE, WEBSOCKET };
