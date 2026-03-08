/**
 * Server-Sent Events (SSE) utilities for real-time deal room updates.
 *
 * Architecture: Each deal room has a set of connected clients.
 * When an event occurs (message, status change, document upload, etc.),
 * the event is broadcast to all connected clients in that deal room.
 *
 * Scaling: When Redis is configured (REDIS_URL), events are published via
 * Redis pub/sub so all server instances receive broadcasts. Falls back to
 * in-memory only when Redis is not available.
 */

import { logger } from "@/lib/logger";

type SSEClient = {
  id: string;
  userId: string;
  controller: ReadableStreamDefaultController;
};

// Map of dealId -> connected clients (local to this process)
const dealClients = new Map<string, Set<SSEClient>>();

// Redis pub/sub for multi-process scaling
let redisPub: import("ioredis").default | null = null;
let redisSub: import("ioredis").default | null = null;
let redisReady = false;

const CHANNEL_PREFIX = "dealvault:sse:";

async function initRedis() {
  if (redisPub || !process.env.REDIS_URL) return;

  try {
    const Redis = (await import("ioredis")).default;
    redisPub = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 3 });
    redisSub = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 3 });

    redisSub.on("message", (channel: string, message: string) => {
      const dealId = channel.replace(CHANNEL_PREFIX, "");
      try {
        const { event, data, excludeUserId, sourceProcessId } = JSON.parse(message);
        // Only broadcast locally if the message came from a different process
        if (sourceProcessId !== processId) {
          broadcastLocal(dealId, event, data, excludeUserId);
        }
      } catch {
        logger.error("[SSE] Failed to parse Redis message", { channel });
      }
    });

    // Subscribe to pattern for all deal channels
    redisSub.psubscribe(`${CHANNEL_PREFIX}*`);
    redisReady = true;
    logger.info("[SSE] Redis pub/sub initialized for SSE scaling");
  } catch (err) {
    logger.warn("[SSE] Redis not available, using in-memory only", { error: String(err) });
    redisPub = null;
    redisSub = null;
  }
}

// Unique process ID to prevent double-broadcasting
const processId = `${process.pid}-${Date.now()}`;

// Initialize Redis on first import (non-blocking)
initRedis();

export function addClient(dealId: string, client: SSEClient) {
  if (!dealClients.has(dealId)) {
    dealClients.set(dealId, new Set());
  }
  dealClients.get(dealId)!.add(client);
}

export function removeClient(dealId: string, clientId: string) {
  const clients = dealClients.get(dealId);
  if (!clients) return;
  for (const client of clients) {
    if (client.id === clientId) {
      clients.delete(client);
      break;
    }
  }
  if (clients.size === 0) {
    dealClients.delete(dealId);
  }
}

function broadcastLocal(
  dealId: string,
  event: string,
  data: Record<string, unknown>,
  excludeUserId?: string
) {
  const clients = dealClients.get(dealId);
  if (!clients) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();

  for (const client of clients) {
    if (excludeUserId && client.userId === excludeUserId) continue;
    try {
      client.controller.enqueue(encoder.encode(payload));
    } catch {
      clients.delete(client);
    }
  }
}

export function broadcastToDeal(
  dealId: string,
  event: string,
  data: Record<string, unknown>,
  excludeUserId?: string
) {
  // Always broadcast locally
  broadcastLocal(dealId, event, data, excludeUserId);

  // Publish to Redis for other processes
  if (redisReady && redisPub) {
    const channel = `${CHANNEL_PREFIX}${dealId}`;
    redisPub.publish(
      channel,
      JSON.stringify({ event, data, excludeUserId, sourceProcessId: processId })
    ).catch((err) => {
      logger.error("[SSE] Redis publish failed", { error: String(err) });
    });
  }
}

export function getClientCount(dealId: string): number {
  return dealClients.get(dealId)?.size ?? 0;
}

export function isRedisEnabled(): boolean {
  return redisReady;
}
