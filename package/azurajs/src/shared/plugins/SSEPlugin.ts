import type { ResponseServer } from "../../types/http/response.type";

type ConnectionId = string;
type ChannelName = string;
type EventName = string;
type EventData = unknown;

export interface SSEConnection {
  readonly id: ConnectionId;
  readonly res: ResponseServer;
  readonly lastEventId?: string;
}

class ConnectionIdGenerator {
  public generate(): ConnectionId {
    const random = Math.random().toString(36).substring(2);
    const timestamp = Date.now().toString(36);
    return `${random}${timestamp}`;
  }
}

class SSEMessage {
  constructor(
    private readonly event: EventName,
    private readonly data: EventData,
    private readonly id?: string
  ) {}

  public format(): string {
    let message = "";
    
    if (this.id) {
      message += `id: ${this.id}\n`;
    }
    
    message += `event: ${this.event}\n`;
    message += `data: ${JSON.stringify(this.data)}\n\n`;
    
    return message;
  }
}

class ConnectionRegistry {
  private readonly connections: Map<ConnectionId, SSEConnection>;

  constructor() {
    this.connections = new Map();
  }

  public add(connection: SSEConnection): void {
    this.connections.set(connection.id, connection);
  }

  public remove(id: ConnectionId): void {
    this.connections.delete(id);
  }

  public get(id: ConnectionId): SSEConnection | undefined {
    return this.connections.get(id);
  }

  public getAll(): ReadonlyArray<SSEConnection> {
    return Array.from(this.connections.values());
  }

  public has(id: ConnectionId): boolean {
    return this.connections.has(id);
  }
}

class ChannelRegistry {
  private readonly channels: Map<ChannelName, Set<ConnectionId>>;

  constructor() {
    this.channels = new Map();
  }

  public subscribe(channel: ChannelName, connectionId: ConnectionId): void {
    this.ensureChannelExists(channel);
    this.channels.get(channel)!.add(connectionId);
  }

  public unsubscribe(channel: ChannelName, connectionId: ConnectionId): void {
    const connections = this.channels.get(channel);
    if (!connections) {
      return;
    }

    connections.delete(connectionId);
    this.removeEmptyChannel(channel, connections);
  }

  public getConnections(channel: ChannelName): ReadonlySet<ConnectionId> | undefined {
    return this.channels.get(channel);
  }

  public getAllChannelsForConnection(connectionId: ConnectionId): ReadonlyArray<ChannelName> {
    const channels: ChannelName[] = [];
    
    for (const [channel, connections] of this.channels) {
      if (connections.has(connectionId)) {
        channels.push(channel);
      }
    }
    
    return channels;
  }

  private ensureChannelExists(channel: ChannelName): void {
    if (this.channels.has(channel)) {
      return;
    }
    this.channels.set(channel, new Set());
  }

  private removeEmptyChannel(channel: ChannelName, connections: Set<ConnectionId>): void {
    if (connections.size === 0) {
      this.channels.delete(channel);
    }
  }
}

class SSEHeaders {
  private static readonly HEADERS = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  } as const;

  public static write(res: ResponseServer): void {
    res.writeHead(200, this.HEADERS);
  }
}

export class SSEManager {
  private readonly connectionRegistry: ConnectionRegistry;
  private readonly channelRegistry: ChannelRegistry;
  private readonly idGenerator: ConnectionIdGenerator;

  constructor() {
    this.connectionRegistry = new ConnectionRegistry();
    this.channelRegistry = new ChannelRegistry();
    this.idGenerator = new ConnectionIdGenerator();
  }

  public connect(res: ResponseServer, lastEventId?: string): ConnectionId {
    const id = this.idGenerator.generate();
    SSEHeaders.write(res);

    const connection: SSEConnection = { id, res, lastEventId };
    this.connectionRegistry.add(connection);

    this.setupConnectionClose(res, id);
    this.sendWelcomeMessage(res, id);

    return id;
  }

  private setupConnectionClose(res: ResponseServer, id: ConnectionId): void {
    res.on("close", () => {
      this.disconnect(id);
    });
  }

  private sendWelcomeMessage(res: ResponseServer, id: ConnectionId): void {
    res.write(`id: ${id}\n\n`);
  }

  public send(connectionId: ConnectionId, event: EventName, data: EventData, id?: string): void {
    const connection = this.connectionRegistry.get(connectionId);
    if (!connection) {
      return;
    }

    const message = new SSEMessage(event, data, id);
    connection.res.write(message.format());
  }

  public sendToAll(event: EventName, data: EventData, id?: string): void {
    const connections = this.connectionRegistry.getAll();
    
    for (const connection of connections) {
      this.send(connection.id, event, data, id);
    }
  }

  public sendToChannel(channel: ChannelName, event: EventName, data: EventData, id?: string): void {
    const connectionIds = this.channelRegistry.getConnections(channel);
    if (!connectionIds) {
      return;
    }

    for (const connectionId of connectionIds) {
      this.send(connectionId, event, data, id);
    }
  }

  public subscribe(connectionId: ConnectionId, channel: ChannelName): void {
    this.channelRegistry.subscribe(channel, connectionId);
  }

  public unsubscribe(connectionId: ConnectionId, channel: ChannelName): void {
    this.channelRegistry.unsubscribe(channel, connectionId);
  }

  public disconnect(connectionId: ConnectionId): void {
    const connection = this.connectionRegistry.get(connectionId);
    if (!connection) {
      return;
    }

    this.unsubscribeFromAllChannels(connectionId);
    connection.res.end();
    this.connectionRegistry.remove(connectionId);
  }

  private unsubscribeFromAllChannels(connectionId: ConnectionId): void {
    const channels = this.channelRegistry.getAllChannelsForConnection(connectionId);
    
    for (const channel of channels) {
      this.unsubscribe(connectionId, channel);
    }
  }

  public getConnection(connectionId: ConnectionId): SSEConnection | undefined {
    return this.connectionRegistry.get(connectionId);
  }

  public getConnections(): ReadonlyArray<SSEConnection> {
    return this.connectionRegistry.getAll();
  }
}

export function createSSEHandler(): SSEManager {
  return new SSEManager();
}
