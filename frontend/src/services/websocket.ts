import type { Message } from '../types';
import { soundService } from './soundService';

type MessageHandler = (message: Message) => void;
type EventHandler = (data: unknown) => void;
type ConnectionHandler = () => void;

interface WebSocketMessage {
  type: string;
  data: unknown;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: MessageHandler[] = [];
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private connectHandlers: ConnectionHandler[] = [];
  private disconnectHandlers: ConnectionHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/ws?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.connectHandlers.forEach((handler) => handler());
    };

    this.ws.onmessage = (event) => {
      try {
        console.log('[WebSocket] Raw message received:', event.data);
        const data = JSON.parse(event.data) as WebSocketMessage;
        console.log('[WebSocket] Parsed message:', data);

        if (data.type === 'message') {
          const message = data.data as Message;
          console.log(`[WebSocket] Calling ${this.messageHandlers.length} message handlers`);
          this.messageHandlers.forEach((handler) => handler(message));
        } else {
          // Handle other event types (friend_request, friend_request_accepted, etc.)
          const handlers = this.eventHandlers.get(data.type);
          console.log(`[WebSocket] Event type: ${data.type}, Handlers registered: ${handlers?.length || 0}`);
          if (handlers) {
            handlers.forEach((handler) => handler(data.data));
          } else {
            console.warn(`[WebSocket] No handlers registered for event type: ${data.type}`);
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.disconnectHandlers.forEach((handler) => handler());
      this.attemptReconnect(token);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect(token);
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(sessionId: string, receiveId: string, content: string, messageType: number = 0) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    const message = {
      type: messageType,
      content,
      sessionId,
      receiveId,
    };

    this.ws.send(JSON.stringify(message));

    // Play message send sound
    soundService.playMessageSend();

    return true;
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  onEvent(eventType: string, handler: EventHandler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
    console.log(`[WebSocket] Registered handler for event: ${eventType}. Total handlers: ${this.eventHandlers.get(eventType)!.length}`);

    return () => {
      console.log(`[WebSocket] Unregistering handler for event: ${eventType}`);
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        const filtered = handlers.filter((h) => h !== handler);
        if (filtered.length === 0) {
          this.eventHandlers.delete(eventType);
          console.log(`[WebSocket] No more handlers for event: ${eventType}`);
        } else {
          this.eventHandlers.set(eventType, filtered);
          console.log(`[WebSocket] Remaining handlers for ${eventType}: ${filtered.length}`);
        }
      }
    };
  }

  onConnect(handler: ConnectionHandler) {
    this.connectHandlers.push(handler);
    return () => {
      this.connectHandlers = this.connectHandlers.filter((h) => h !== handler);
    };
  }

  onDisconnect(handler: ConnectionHandler) {
    this.disconnectHandlers.push(handler);
    return () => {
      this.disconnectHandlers = this.disconnectHandlers.filter((h) => h !== handler);
    };
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();
