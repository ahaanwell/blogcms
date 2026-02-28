import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchBlogs = createAsyncThunk('blogs/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/blogs', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchBlogById = createAsyncThunk('blogs/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/blogs/${id}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createBlog = createAsyncThunk('blogs/create', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/blogs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateBlog = createAsyncThunk('blogs/update', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/blogs/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const deleteBlog = createAsyncThunk('blogs/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/blogs/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const blogsSlice = createSlice({
  name: 'blogs',
  initialState: {
    list: [],
    currentBlog: null,
    loading: false,
    saving: false,
    error: null,
    total: 0,
    totalPages: 1,
    currentPage: 1,
  },
  reducers: {
    clearCurrentBlog: (state) => { state.currentBlog = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogs.pending, (state) => { state.loading = true; })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.blogs;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.page;
      })
      .addCase(fetchBlogs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchBlogById.pending, (state) => { state.loading = true; state.currentBlog = null; })
      .addCase(fetchBlogById.fulfilled, (state, action) => { state.loading = false; state.currentBlog = action.payload; })
      .addCase(fetchBlogById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createBlog.pending, (state) => { state.saving = true; })
      .addCase(createBlog.fulfilled, (state, action) => {
        state.saving = false;
        state.list.unshift(action.payload);
      })
      .addCase(createBlog.rejected, (state, action) => { state.saving = false; state.error = action.payload; })

      .addCase(updateBlog.pending, (state) => { state.saving = true; })
      .addCase(updateBlog.fulfilled, (state, action) => {
        state.saving = false;
        const idx = state.list.findIndex((b) => b._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.currentBlog = action.payload;
      })
      .addCase(updateBlog.rejected, (state, action) => { state.saving = false; state.error = action.payload; })

      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.list = state.list.filter((b) => b._id !== action.payload);
      });
  },
});

export const { clearCurrentBlog, clearError } = blogsSlice.actions;
export default blogsSlice.reducer;
