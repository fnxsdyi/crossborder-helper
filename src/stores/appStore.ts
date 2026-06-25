import { create } from 'zustand'

interface AppState {
  currentView: 'dashboard' | 'invoices' | 'clients' | 'tax' | 'currency' | 'settings'
  setCurrentView: (view: AppState['currentView']) => void
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
