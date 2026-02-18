"use client";

import { createContext, useContext } from "react";

interface AdminLayoutContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => Promise<void>;
  admin: any;
}

export const AdminLayoutContext = createContext<AdminLayoutContextType>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
  handleLogout: async () => {},
  admin: null,
});

export const useAdminLayout = () => useContext(AdminLayoutContext);