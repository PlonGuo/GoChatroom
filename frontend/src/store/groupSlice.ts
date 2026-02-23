import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as groupApi from '../api/groupApi';
import type { Group, GroupMember } from '../types';

interface GroupState {
  myGroups: Group[];
  searchResults: Group[];
  currentGroupMembers: GroupMember[];
  isLoading: boolean;
  error: string | null;
}

const initialState: GroupState = {
  myGroups: [],
  searchResults: [],
  currentGroupMembers: [],
  isLoading: false,
  error: null,
};

export const fetchMyGroups = createAsyncThunk('group/fetchMyGroups', async (_, { rejectWithValue }) => {
  try {
    return await groupApi.getMyGroups();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch groups');
  }
});

export const searchGroups = createAsyncThunk('group/searchGroups', async (query: string, { rejectWithValue }) => {
  try {
    return await groupApi.searchGroups(query);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to search groups');
  }
});

export const createGroup = createAsyncThunk(
  'group/createGroup',
  async (data: { name: string; notice?: string }, { rejectWithValue }) => {
    try {
      return await groupApi.createGroup(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create group');
    }
  }
);

export const joinGroup = createAsyncThunk('group/joinGroup', async (uuid: string, { rejectWithValue }) => {
  try {
    await groupApi.joinGroup(uuid);
    return uuid;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to join group');
  }
});

export const leaveGroup = createAsyncThunk('group/leaveGroup', async (uuid: string, { rejectWithValue }) => {
  try {
    await groupApi.leaveGroup(uuid);
    return uuid;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to leave group');
  }
});

export const dissolveGroup = createAsyncThunk('group/dissolveGroup', async (uuid: string, { rejectWithValue }) => {
  try {
    await groupApi.dissolveGroup(uuid);
    return uuid;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to dissolve group');
  }
});

export const fetchGroupMembers = createAsyncThunk(
  'group/fetchGroupMembers',
  async (uuid: string, { rejectWithValue }) => {
    try {
      return await groupApi.getGroupMembers(uuid);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch group members');
    }
  }
);

const groupSlice = createSlice({
  name: 'group',
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
      .addCase(fetchMyGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myGroups = action.payload;
      })
      .addCase(fetchMyGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(searchGroups.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.myGroups.unshift(action.payload);
      })
      .addCase(joinGroup.fulfilled, (state) => {
        state.searchResults = [];
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.myGroups = state.myGroups.filter((g) => g.uuid !== action.payload);
      })
      .addCase(dissolveGroup.fulfilled, (state, action) => {
        state.myGroups = state.myGroups.filter((g) => g.uuid !== action.payload);
      })
      .addCase(fetchGroupMembers.fulfilled, (state, action) => {
        state.currentGroupMembers = action.payload;
      });
  },
});

export const { clearSearchResults, clearError } = groupSlice.actions;
export default groupSlice.reducer;
