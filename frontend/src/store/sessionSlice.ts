import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
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
  async (contactUuid: string, { rejectWithValue }) => {
    try {
      return await sessionApi.createSession({ type: 'private', target_uuid: contactUuid });
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create session');
    }
  }
);

export const createGroupSession = createAsyncThunk(
  'session/createGroup',
  async (groupUuid: string, { rejectWithValue }) => {
    try {
      return await sessionApi.createSession({ type: 'group', target_uuid: groupUuid });
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create session');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'session/fetchMessages',
  async ({ sessionId, limit, before }: { sessionId: number; limit?: number; before?: number }, { rejectWithValue }) => {
    try {
      return await sessionApi.getMessages(sessionId, limit, before);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch messages');
    }
  }
);

export const deleteSession = createAsyncThunk(
  'session/delete',
  async (sessionId: number, { rejectWithValue }) => {
    try {
      await sessionApi.deleteSession(sessionId);
      return sessionId;
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
      const session = state.sessions.find((s) => s.id === action.payload.session_id);
      if (session) {
        session.last_message = action.payload.content;
        session.last_message_time = action.payload.created_at;
        // Move session to top
        state.sessions = [session, ...state.sessions.filter((s) => s.id !== session.id)];
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
        const existingIndex = state.sessions.findIndex((s) => s.id === action.payload.id);
        if (existingIndex === -1) {
          state.sessions.unshift(action.payload);
        }
        state.currentSession = action.payload;
      })
      // Create group session
      .addCase(createGroupSession.fulfilled, (state, action) => {
        const existingIndex = state.sessions.findIndex((s) => s.id === action.payload.id);
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
        state.sessions = state.sessions.filter((s) => s.id !== action.payload);
        if (state.currentSession?.id === action.payload) {
          state.currentSession = null;
          state.messages = [];
        }
      });
  },
});

export const { setCurrentSession, addMessage, clearMessages, clearError } = sessionSlice.actions;
export default sessionSlice.reducer;
