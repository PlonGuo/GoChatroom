import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as contactApi from '../api/contactApi';
import * as userApi from '../api/userApi';
import type { Contact, ContactApply, User } from '../types';

interface ContactState {
  contacts: Contact[];
  friendRequests: ContactApply[];
  searchResults: User[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ContactState = {
  contacts: [],
  friendRequests: [],
  searchResults: [],
  isLoading: false,
  error: null,
};

export const fetchContacts = createAsyncThunk('contact/fetchContacts', async (_, { rejectWithValue }) => {
  try {
    return await contactApi.getContacts();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch contacts');
  }
});

export const fetchFriendRequests = createAsyncThunk(
  'contact/fetchFriendRequests',
  async (_, { rejectWithValue }) => {
    try {
      return await contactApi.getPendingRequests();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch friend requests');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'contact/searchUsers',
  async (query: string, { rejectWithValue }) => {
    try {
      return await userApi.searchUsers(query);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to search users');
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  'contact/sendFriendRequest',
  async ({ uuid, message }: { uuid: string; message?: string }, { rejectWithValue }) => {
    try {
      await contactApi.sendFriendRequest(uuid, message);
      return uuid;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to send friend request');
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  'contact/acceptFriendRequest',
  async (applyId: number, { rejectWithValue }) => {
    try {
      await contactApi.acceptRequest(applyId);
      return applyId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to accept friend request');
    }
  }
);

export const rejectFriendRequest = createAsyncThunk(
  'contact/rejectFriendRequest',
  async (applyId: number, { rejectWithValue }) => {
    try {
      await contactApi.rejectRequest(applyId);
      return applyId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to reject friend request');
    }
  }
);

export const deleteContact = createAsyncThunk(
  'contact/deleteContact',
  async (contactUuid: string, { rejectWithValue }) => {
    try {
      await contactApi.deleteContact(contactUuid);
      return contactUuid;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete contact');
    }
  }
);

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch contacts
      .addCase(fetchContacts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contacts = action.payload;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch friend requests
      .addCase(fetchFriendRequests.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFriendRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.friendRequests = action.payload;
      })
      .addCase(fetchFriendRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Search users
      .addCase(searchUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Send friend request
      .addCase(sendFriendRequest.fulfilled, (state) => {
        state.searchResults = [];
      })
      // Accept friend request
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        state.friendRequests = state.friendRequests.filter((r) => r.id !== action.payload);
      })
      // Reject friend request
      .addCase(rejectFriendRequest.fulfilled, (state, action) => {
        state.friendRequests = state.friendRequests.filter((r) => r.id !== action.payload);
      })
      // Delete contact
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.contacts = state.contacts.filter((c) => c.contact_uuid !== action.payload);
      });
  },
});

export const { clearSearchResults, clearError } = contactSlice.actions;
export default contactSlice.reducer;
