import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/projects');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createProject = createAsyncThunk('projects/create', async (projectData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/projects', projectData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateProject = createAsyncThunk('projects/update', async ({ id, ...rest }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/projects/${id}`, rest);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const deleteProject = createAsyncThunk('projects/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/projects/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

// Regenerate the API key for a project (in case it's compromised)
export const regenerateKey = createAsyncThunk('projects/regenerateKey', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${id}/regenerate-key`);
    return { id, apiKey: data.apiKey };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const projectsSlice = createSlice({
  name: 'projects',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchProjects.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createProject.fulfilled, (state, action) => { state.list.push(action.payload); })

      .addCase(updateProject.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })

      .addCase(deleteProject.fulfilled, (state, action) => {
        state.list = state.list.filter((p) => p._id !== action.payload);
      })

      // Update just the apiKey field in the existing project object
      .addCase(regenerateKey.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p._id === action.payload.id);
        if (idx !== -1) state.list[idx].apiKey = action.payload.apiKey;
      });
  },
});

export default projectsSlice.reducer;
