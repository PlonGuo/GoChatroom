import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as sessionApi from '../api/sessionApi';
import type { Session, Message } from '../types';

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  messages: Message[];
  isLoading: boolean;
  isLoadingMessages: boolean;
  error: string | null;
}

const initialState: SessionState = {
  sessions: [],
  currentSession: null,
  messages: [],
  isLoading: false,
  isLoadingMessages: false,
  error: null,
};

export const fetchSessions = createAsyncThunk('session/fetchSessions', async (_, { rejectWithValue }) => {
  try {
    return await sessionApi.getSessions();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch sessions');
  }
});

export const createPrivateSession = createAsyncThunk(
  'session/createPrivate',
  async (contact: { uuid: string; nickname: string; avatar?: string }, { rejectWithValue }) => {
    try {
      return await sessionApi.createSession({
        receiveId: contact.uuid,
        receiveName: contact.nickname,
        avatar: contact.avatar,
      });
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create session');
    }
  }
);

export const createGroupSession = createAsyncThunk(
  'session/createGroup',
  async (group: { uuid: string; name: string; avatar?: string }, { rejectWithValue }) => {
    try {
      return await sessionApi.createSession({
        receiveId: group.uuid,
        receiveName: group.name,
        avatar: group.avatar,
      });
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create session');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'session/fetchMessages',
  async ({ sessionId, limit, offset }: { sessionId: string; limit?: number; offset?: number }, { rejectWithValue }) => {
    try {
      return await sessionApi.getMessages(sessionId, limit, offset);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch messages');
    }
  }
);

export const deleteSession = createAsyncThunk(
  'session/delete',
  async (sessionUuid: string, { rejectWithValue }) => {
    try {
      await sessionApi.deleteSession(sessionUuid);
      return sessionUuid;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete session');
    }
  }
);

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setCurrentSession: (state, action: PayloadAction<Session | null>) => {
      state.currentSession = action.payload;
      state.messages = [];
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
      // Update last message in session list
      const session = state.sessions.find((s) => s.uuid === action.payload.sessionId);
      if (session) {
        session.lastMessage = action.payload.content;
        session.lastMessageAt = action.payload.createdAt;
        // Move session to top
        state.sessions = [session, ...state.sessions.filter((s) => s.uuid !== session.uuid)];
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sessions
      .addCase(fetchSessions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create private session
      .addCase(createPrivateSession.fulfilled, (state, action) => {
        const existingIndex = state.sessions.findIndex((s) => s.uuid === action.payload.uuid);
        if (existingIndex === -1) {
          state.sessions.unshift(action.payload);
        }
        state.currentSession = action.payload;
      })
      // Create group session
      .addCase(createGroupSession.fulfilled, (state, action) => {
        const existingIndex = state.sessions.findIndex((s) => s.uuid === action.payload.uuid);
        if (existingIndex === -1) {
          state.sessions.unshift(action.payload);
        }
        state.currentSession = action.payload;
      })
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoadingMessages = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      })
      // Delete session
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.filter((s) => s.uuid !== action.payload);
        if (state.currentSession?.uuid === action.payload) {
          state.currentSession = null;
          state.messages = [];
        }
      });
  },
});

export const { setCurrentSession, addMessage, clearMessages, clearError } = sessionSlice.actions;
export default sessionSlice.reducer;
