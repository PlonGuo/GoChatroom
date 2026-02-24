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
    webrtcService.disconnect();
    vi.restoreAllMocks();
  });

  async function connectService() {
    await webrtcService.connect('test-token', 'user-a');
    // Trigger onopen to mark as connected
    mockWsInstance.onopen?.();
  }

  function simulateMessage(data: Record<string, unknown>) {
    const event = new MessageEvent('message', {
      data: JSON.stringify(data),
    });
    mockWsInstance.onmessage?.(event);
  }

  it('should handle peer_not_connected error and cleanup call state', async () => {
    await connectService();

    const stateChanges: CallState[] = [];
    webrtcService.onStateChange((state) => stateChanges.push({ ...state }));

    // Simulate initiating a call to set isCalling state
    await webrtcService.initiateCall('user-b');

    // Simulate receiving an error from server
    simulateMessage({
      type: 'error',
      from: 'server',
      to: 'user-a',
      payload: { reason: 'peer_not_connected' },
    });

    // Wait for async handling
    await new Promise((r) => setTimeout(r, 10));

    // After error, the service should have cleaned up
    const finalState = webrtcService.getState();
    expect(finalState.isInCall).toBe(false);
    expect(finalState.isCalling).toBe(false);
    expect(finalState.isReceivingCall).toBe(false);
    expect(finalState.remoteUserId).toBeNull();
  });

  it('should handle peer_unavailable error and cleanup call state', async () => {
    await connectService();

    await webrtcService.initiateCall('user-b');

    simulateMessage({
      type: 'error',
      from: 'server',
      to: 'user-a',
      payload: { reason: 'peer_unavailable' },
    });

    await new Promise((r) => setTimeout(r, 10));

    const finalState = webrtcService.getState();
    expect(finalState.isInCall).toBe(false);
    expect(finalState.isCalling).toBe(false);
    expect(finalState.remoteUserId).toBeNull();
  });

  it('should not cleanup on unknown error reasons', async () => {
    await connectService();

    await webrtcService.initiateCall('user-b');

    simulateMessage({
      type: 'error',
      from: 'server',
      to: 'user-a',
      payload: { reason: 'unknown_reason' },
    });

    await new Promise((r) => setTimeout(r, 10));

    // Should still be in calling state since we don't handle unknown reasons
    const finalState = webrtcService.getState();
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

    await new Promise((r) => setTimeout(r, 10));

    expect(receivedMessages).toHaveLength(1);
    expect(receivedMessages[0].type).toBe('error');
  });
});
