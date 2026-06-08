import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { Toaster } from "sonner"
import { useTheme } from "@/contexts/ThemeContext"

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme } = useTheme()

  return (
    <div className="flex min-h-screen bg-[var(--surface-gradient)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-[1440px] rounded-[2rem] border border-border/55 bg-background/72 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-5 lg:p-6 dark:bg-background/62">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster
        theme={theme}
        toastOptions={{
          style: {
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          },
        }}
      />
    </div>
  )
}
