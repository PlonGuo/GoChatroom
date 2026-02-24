import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webrtcService } from './webrtc';
import type { CallState } from './webrtc';

// Mock the webrtcApi module so connect() doesn't make real HTTP calls
vi.mock('../api/webrtcApi', () => ({
  getICEServers: vi.fn().mockResolvedValue([]),
}));

// Store the latest mock WebSocket instance for test access
let mockWsInstance: MockWebSocket;

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onopen: (() => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  send = vi.fn();
  close = vi.fn();

  constructor(_url: string) {
    mockWsInstance = this;
  }
}

describe('WebRTCService error handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', MockWebSocket);

    // Mock getUserMedia
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [],
          getVideoTracks: () => [],
          getAudioTracks: () => [],
        }),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    webrtcService.disconnect();
    vi.restoreAllMocks();
  });

  // Helper to flush pending microtasks without advancing timers
  async function flushMicrotasks() {
    await vi.advanceTimersByTimeAsync(0);
  }

  async function connectService() {
    const connectPromise = webrtcService.connect('test-token', 'user-a');
    await flushMicrotasks();
    await connectPromise;
    // Trigger onopen to mark as connected
    mockWsInstance.onopen?.();
  }

  function simulateMessage(data: Record<string, unknown>) {
    const event = new MessageEvent('message', {
      data: JSON.stringify(data),
    });
    mockWsInstance.onmessage?.(event);
  }

  it('should set errorReason immediately on peer_not_connected, then cleanup after 2s', async () => {
    await connectService();

    await webrtcService.initiateCall('user-b');
    await flushMicrotasks();

    simulateMessage({
      type: 'error',
      from: 'server',
      to: 'user-a',
      payload: { reason: 'peer_not_connected' },
    });

    // Immediately after error: errorReason is set, still in calling state
    const immediateState = webrtcService.getState();
    expect(immediateState.errorReason).toBe('peer_not_connected');
    expect(immediateState.isCalling).toBe(true);

    // After 2 seconds: fully cleaned up
    await vi.advanceTimersByTimeAsync(2000);
    const finalState = webrtcService.getState();
    expect(finalState.errorReason).toBeNull();
    expect(finalState.isInCall).toBe(false);
    expect(finalState.isCalling).toBe(false);
    expect(finalState.remoteUserId).toBeNull();
  });

  it('should set errorReason immediately on peer_unavailable, then cleanup after 2s', async () => {
    await connectService();

    await webrtcService.initiateCall('user-b');
    await flushMicrotasks();

    simulateMessage({
      type: 'error',
      from: 'server',
      to: 'user-a',
      payload: { reason: 'peer_unavailable' },
    });

    const immediateState = webrtcService.getState();
    expect(immediateState.errorReason).toBe('peer_unavailable');

    await vi.advanceTimersByTimeAsync(2000);
    const finalState = webrtcService.getState();
    expect(finalState.errorReason).toBeNull();
    expect(finalState.isCalling).toBe(false);
    expect(finalState.remoteUserId).toBeNull();
  });

  it('should not set errorReason on unknown error reasons', async () => {
    await connectService();

    await webrtcService.initiateCall('user-b');
    await flushMicrotasks();

    simulateMessage({
      type: 'error',
      from: 'server',
      to: 'user-a',
      payload: { reason: 'unknown_reason' },
    });

    // Should still be in calling state since we don't handle unknown reasons
    const finalState = webrtcService.getState();
    expect(finalState.errorReason).toBeNull();
    expect(finalState.isCalling).toBe(true);
    expect(finalState.remoteUserId).toBe('user-b');
  });

  it('should notify signaling handlers when error is received', async () => {
    await connectService();

    const receivedMessages: Record<string, unknown>[] = [];
    webrtcService.onSignaling((data) => receivedMessages.push({ ...data }));

    simulateMessage({
      type: 'error',
      from: 'server',
      to: 'user-a',
      payload: { reason: 'peer_not_connected' },
    });

    expect(receivedMessages).toHaveLength(1);
    expect(receivedMessages[0].type).toBe('error');

    // Clean up the pending timeout
    await vi.advanceTimersByTimeAsync(2000);
  });

  it('should clear errorReason on disconnect before timeout fires', async () => {
    await connectService();

    await webrtcService.initiateCall('user-b');
    await flushMicrotasks();

    simulateMessage({
      type: 'error',
      from: 'server',
      to: 'user-a',
      payload: { reason: 'peer_not_connected' },
    });

    expect(webrtcService.getState().errorReason).toBe('peer_not_connected');

    // Disconnect before 2s timeout fires
    webrtcService.disconnect();

    const state = webrtcService.getState();
    expect(state.errorReason).toBeNull();
    expect(state.isCalling).toBe(false);
  });
});
