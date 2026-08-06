import { create } from 'zustand'

export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  globalLoading: false,
  searchOpen: false,
  cartDrawerOpen: false,

  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleMobileMenu: () => set(state => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),
  setGlobalLoading: (v) => set({ globalLoading: v }),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setCartDrawerOpen: (v) => set({ cartDrawerOpen: v }),
}))
