"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Shield, Menu, Sun, Moon, Bell, Check, FileText, Users, MessageSquare, DollarSign, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch {}
    }

    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [session]);

  async function refreshAndUpdate() {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
  }

  async function markAsRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    refreshAndUpdate();
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "party_invited":
      case "party_accepted":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "document_uploaded":
      case "document_verified":
        return <FileText className="h-4 w-4 text-amber-500" />;
      case "message_sent":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "status_changed":
        return <RefreshCw className="h-4 w-4 text-primary" />;
      case "commission_agreed":
      case "deal_settled":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  }

  async function markAllAsRead() {
    await fetch("/api/notifications?action=read-all", { method: "PATCH" });
    refreshAndUpdate();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="md:hidden flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold">DealVault</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium">Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-1"
                  onClick={markAllAsRead}
                >
                  <Check className="h-3 w-3 mr-1" /> Mark all read
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 10).map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className={`flex items-start gap-3 p-3 cursor-pointer ${
                      !n.read ? "bg-primary/5 dark:bg-primary/10" : ""
                    }`}
                    onClick={() => {
                      if (!n.read) markAsRead(n.id);
                      if (n.link) router.push(n.link);
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-sm font-medium">{n.title}</span>
                      <span className="text-xs text-muted-foreground truncate">{n.message}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm">
                {session?.user?.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
