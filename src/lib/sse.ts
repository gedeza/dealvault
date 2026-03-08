/**
 * Server-Sent Events (SSE) utilities for real-time deal room updates.
 *
 * Architecture: Each deal room has a set of connected clients.
 * When an event occurs (message, status change, document upload, etc.),
 * the event is broadcast to all connected clients in that deal room.
 */

type SSEClient = {
  id: string;
  userId: string;
  controller: ReadableStreamDefaultController;
};

// Map of dealId -> connected clients
const dealClients = new Map<string, Set<SSEClient>>();

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

export function broadcastToDeal(
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
      // Client disconnected, clean up
      clients.delete(client);
    }
  }
}

export function getClientCount(dealId: string): number {
  return dealClients.get(dealId)?.size ?? 0;
}
