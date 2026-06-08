import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Menu, User, Moon, Sun } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { NotificationsMenu } from "@/components/layout/NotificationsMenu"

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?"

  const pageTitle =
    location.pathname
      .split("/")
      .filter(Boolean)[0]
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) ?? "Dashboard"

  return (
    <header className="sticky top-0 z-40 border-b border-border/45 bg-transparent px-4 py-3 backdrop-blur-xl lg:px-6">
      <div className="flex h-14 items-center gap-4 rounded-2xl border border-border/60 bg-card/80 px-3 shadow-lg shadow-black/5 backdrop-blur-xl">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        <Link to="/" className="font-brand text-xl tracking-wider text-foreground lg:hidden">
          BRan
        </Link>

        <div className="hidden min-w-0 lg:block">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Workspace</p>
          <h1 className="truncate text-sm font-semibold text-foreground">{pageTitle}</h1>
        </div>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="icon"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={toggleTheme}
          className="rounded-full border border-border/70 bg-card/70 text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <NotificationsMenu />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-2 text-foreground shadow-sm hover:bg-muted"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? ""} />
                <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden items-start gap-1 md:flex md:flex-col">
                <span className="text-sm font-medium leading-none">{user?.name}</span>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {user?.role.name.replace("_", " ")}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { logout(); navigate("/login"); }}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
