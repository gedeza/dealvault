import { describe, it, expect, beforeEach } from "vitest";
import { addClient, removeClient, broadcastToDeal, getClientCount } from "@/lib/sse";

// Mock ReadableStreamDefaultController
function createMockController() {
  const chunks: Uint8Array[] = [];
  return {
    enqueue: (chunk: Uint8Array) => chunks.push(chunk),
    close: () => {},
    error: () => {},
    desiredSize: 1,
    chunks,
  } as unknown as ReadableStreamDefaultController & { chunks: Uint8Array[] };
}

describe("SSE utilities", () => {
  beforeEach(() => {
    // Clean up by removing any existing clients
    // We'll test with fresh deal IDs each time
  });

  it("adds and counts clients", () => {
    const dealId = "test-deal-1";
    const controller = createMockController();

    addClient(dealId, { id: "c1", userId: "u1", controller });
    expect(getClientCount(dealId)).toBe(1);

    addClient(dealId, { id: "c2", userId: "u2", controller });
    expect(getClientCount(dealId)).toBe(2);
  });

  it("removes clients correctly", () => {
    const dealId = "test-deal-2";
    const controller = createMockController();

    addClient(dealId, { id: "c1", userId: "u1", controller });
    addClient(dealId, { id: "c2", userId: "u2", controller });

    removeClient(dealId, "c1");
    expect(getClientCount(dealId)).toBe(1);

    removeClient(dealId, "c2");
    expect(getClientCount(dealId)).toBe(0);
  });

  it("broadcasts to all clients in a deal", () => {
    const dealId = "test-deal-3";
    const ctrl1 = createMockController();
    const ctrl2 = createMockController();

    addClient(dealId, { id: "c1", userId: "u1", controller: ctrl1 });
    addClient(dealId, { id: "c2", userId: "u2", controller: ctrl2 });

    broadcastToDeal(dealId, "test_event", { foo: "bar" });

    expect(ctrl1.chunks.length).toBe(1);
    expect(ctrl2.chunks.length).toBe(1);

    const decoder = new TextDecoder();
    const payload = decoder.decode(ctrl1.chunks[0]);
    expect(payload).toContain("event: test_event");
    expect(payload).toContain('"foo":"bar"');
  });

  it("excludes specified user from broadcast", () => {
    const dealId = "test-deal-4";
    const ctrl1 = createMockController();
    const ctrl2 = createMockController();

    addClient(dealId, { id: "c1", userId: "u1", controller: ctrl1 });
    addClient(dealId, { id: "c2", userId: "u2", controller: ctrl2 });

    broadcastToDeal(dealId, "test_event", { msg: "hello" }, "u1");

    // u1 should be excluded
    expect(ctrl1.chunks.length).toBe(0);
    // u2 should receive
    expect(ctrl2.chunks.length).toBe(1);
  });

  it("handles broadcast to non-existent deal gracefully", () => {
    // Should not throw
    broadcastToDeal("non-existent", "test_event", {});
    expect(getClientCount("non-existent")).toBe(0);
  });

  it("returns 0 for unknown deal client count", () => {
    expect(getClientCount("unknown-deal")).toBe(0);
  });
});
