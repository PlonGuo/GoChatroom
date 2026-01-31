import { useEffect, useState, useCallback, useRef } from 'react';
import { Layout, Badge } from 'antd';
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { GlobalVideoCall } from './GlobalVideoCall';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchFriendRequests, fetchContacts } from '../store/contactSlice';
import { fetchSessions, addMessage } from '../store/sessionSlice';
import { websocketService } from '../services/websocket';
import type { Message } from '../types';

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);
  const { sessions } = useAppSelector((state) => state.session);
  const [isConnected, setIsConnected] = useState(false);

  // Track sessions for checking if new sessions need to be fetched
  const sessionsRef = useRef(sessions);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // Handle incoming WebSocket messages (works on all pages)
  const handleIncomingMessage = useCallback(
    (message: Message) => {
      console.log('[AppLayout] Received message:', message);
      dispatch(addMessage(message));

      // Check if we have this session in our list
      const hasSession =
        sessionsRef.current.some((s) => s.uuid === message.sessionId) ||
        sessionsRef.current.some((s) => s.receiveId === message.sendId);

      // If message is for a session we don't have, refresh sessions
      if (!hasSession && message.sendId !== user?.uuid) {
        console.log('[AppLayout] New session detected, fetching sessions');
        dispatch(fetchSessions());
      }
    },
    [dispatch, user?.uuid]
  );

  // WebSocket connection - stays active across all pages
  useEffect(() => {
    if (!token) return;

    console.log('[AppLayout] Initializing WebSocket connection');

    // Only connect if not already connected
    if (!websocketService.isConnected()) {
      websocketService.connect(token);
    }

    // Listen for incoming messages (works on all pages)
    const unsubMessage = websocketService.onMessage(handleIncomingMessage);

    // Listen for friend request events (works on all pages)
    const unsubFriendRequest = websocketService.onEvent('friend_request', (data) => {
      console.log('[WebSocket] Received friend_request event:', data);
      // Refresh friend requests when a new request is received
      dispatch(fetchFriendRequests());
    });

    const unsubFriendRequestAccepted = websocketService.onEvent('friend_request_accepted', (data) => {
      console.log('[WebSocket] Received friend_request_accepted event:', data);
      // Refresh contacts when a friend request is accepted
      dispatch(fetchContacts());
    });

    const unsubConnect = websocketService.onConnect(() => {
      console.log('[WebSocket] Connected - fetching latest data');
      setIsConnected(true);
      // Fetch updates when reconnecting to catch any missed messages/requests
      dispatch(fetchFriendRequests());
      dispatch(fetchContacts());
      dispatch(fetchSessions());
    });

    const unsubDisconnect = websocketService.onDisconnect(() => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
    });

    // Set initial connection status
    setIsConnected(websocketService.isConnected());

    return () => {
      console.log('[AppLayout] Cleaning up event listeners (keeping WebSocket connected)');
      unsubMessage();
      unsubFriendRequest();
      unsubFriendRequestAccepted();
      unsubConnect();
      unsubDisconnect();
      // Don't disconnect WebSocket - it should stay connected for the entire session
    };
  }, [token, handleIncomingMessage, dispatch]);

  // Disconnect WebSocket when user logs out
  useEffect(() => {
    // When token becomes null (user logged out), disconnect WebSocket
    if (!token) {
      console.log('[AppLayout] User logged out, disconnecting WebSocket');
      websocketService.disconnect();
      setIsConnected(false);
    }
  }, [token]);

  // Periodic polling when WebSocket is disconnected (fallback mechanism)
  useEffect(() => {
    if (!isConnected && token) {
      console.log('[AppLayout] WebSocket disconnected, starting polling');
      // Poll every 10 seconds when disconnected
      const pollInterval = setInterval(() => {
        dispatch(fetchFriendRequests());
        dispatch(fetchContacts());
        dispatch(fetchSessions());
      }, 10000);

      return () => {
        console.log('[AppLayout] Stopping polling');
        clearInterval(pollInterval);
      };
    }
  }, [isConnected, token, dispatch]);

  // Refresh data when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && token) {
        console.log('[AppLayout] Tab became visible, refreshing data');
        // Tab became visible, refresh data to catch any missed updates
        dispatch(fetchFriendRequests());
        dispatch(fetchContacts());
        dispatch(fetchSessions());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [token, dispatch]);

  return (
    <>
      <Layout style={{ minHeight: '100vh' }}>
        <AppHeader />
        <Layout>
          <AppSidebar />
          <Content style={{ minHeight: 'calc(100vh - 64px)', position: 'relative' }}>
            {children}
            {/* WebSocket status indicator */}
            <div
              style={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 1000,
              }}
            >
              <Badge
                status={isConnected ? 'success' : 'error'}
                text={
                  <span style={{ fontSize: 12, opacity: 0.6 }}>
                    {isConnected ? <WifiOutlined /> : <DisconnectOutlined />}
                    {' '}
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                }
              />
            </div>
          </Content>
        </Layout>
      </Layout>

      {/* Global Video Call UI - renders on all pages */}
      <GlobalVideoCall />
    </>
  );
};
