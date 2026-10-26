import { createSlice } from '@reduxjs/toolkit'

// Read persisted session from localStorage if available
const initialUser = (() => {
  try {
    return JSON.parse(localStorage.getItem('plateSyncUser')) || null
  } catch {
    return null
  }
})()

const initialState = {
  user: initialUser,
  isAuthenticated: !!initialUser,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
      try {
        localStorage.setItem('plateSyncUser', JSON.stringify(action.payload))
      } catch {
        // ignore storage errors
      }
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      try {
        localStorage.removeItem('plateSyncUser')
      } catch {
        // ignore storage errors
      }
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        try {
          localStorage.setItem('plateSyncUser', JSON.stringify(state.user))
        } catch {
          // ignore storage errors
        }
      }
    },
  },
})

export const { login, logout, updateUser } = authSlice.actions
export default authSlice.reducer
