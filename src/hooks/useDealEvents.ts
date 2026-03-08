"use client";

import { useEffect, useRef, useCallback } from "react";

export type DealEventType =
  | "connected"
  | "status_changed"
  | "new_message"
  | "party_invited"
  | "document_uploaded"
  | "workflow_updated"
  | "custody_updated";

type DealEventHandler = (event: DealEventType, data: Record<string, unknown>) => void;

export function useDealEvents(dealId: string | null, onEvent: DealEventHandler) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!dealId) return;

    // Close existing connection
    eventSourceRef.current?.close();

    const es = new EventSource(`/api/deals/${dealId}/events`);
    eventSourceRef.current = es;

    const eventTypes: DealEventType[] = [
      "connected",
      "status_changed",
      "new_message",
      "party_invited",
      "document_uploaded",
      "workflow_updated",
      "custody_updated",
    ];

    for (const type of eventTypes) {
      es.addEventListener(type, (e) => {
        try {
          const data = JSON.parse(e.data);
          onEventRef.current(type, data);
        } catch {
          // Ignore malformed events
        }
      });
    }

    es.onerror = () => {
      es.close();
      // Reconnect after 3 seconds
      setTimeout(() => connect(), 3000);
    };
  }, [dealId]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [connect]);
}
