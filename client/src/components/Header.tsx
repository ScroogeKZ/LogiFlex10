import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TruckIcon, UserIcon, SettingsIcon, LogOutIcon, BellIcon, PlusIcon, CheckIcon, MenuIcon, MoonIcon, SunIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, Notification } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export default function Header() {
  const { user } = useAuth() as { user?: User };
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };
  
  const getRoleDisplay = (role?: string) => {
    switch (role) {
      case "carrier":
        return "Перевозчик";
      case "shipper":
        return "Грузоотправитель";
      case "admin":
        return "Администратор";
      default:
        return "Пользователь";
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    return "U";
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2 hover-elevate rounded-lg px-3 py-2 -ml-3" data-testid="link-logo">
            <TruckIcon className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl">LogiFlex.kz</span>
          </a>
        </Link>
        
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost" data-testid="link-home" asChild>
              <a>Главная</a>
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="ghost" data-testid="link-marketplace" asChild>
              <a>Маркетплейс</a>
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" data-testid="link-dashboard" asChild>
              <a>Панель</a>
            </Button>
          </Link>
          {(user?.role === "shipper" || user?.role === "admin") && (
            <Link href="/cargo/create">
              <Button data-testid="button-create-cargo" asChild>
                <a>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Создать груз
                </a>
              </Button>
            </Link>
          )}
        </nav>
        
        <div className="flex items-center gap-2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <MenuIcon className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-home" asChild>
                    <a>Главная</a>
                  </Button>
                </Link>
                <Link href="/marketplace" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-marketplace" asChild>
                    <a>Маркетплейс</a>
                  </Button>
                </Link>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-dashboard" asChild>
                    <a>Панель</a>
                  </Button>
                </Link>
                {(user?.role === "shipper" || user?.role === "admin") && (
                  <Link href="/cargo/create" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full justify-start" data-testid="mobile-button-create-cargo" asChild>
                      <a>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Создать груз
                      </a>
                    </Button>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
            title={theme === "light" ? "Переключить на темную тему" : "Переключить на светлую тему"}
          >
            {theme === "light" ? (
              <MoonIcon className="w-5 h-5" />
            ) : (
              <SunIcon className="w-5 h-5" />
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost" 
                className="relative"
                data-testid="button-notifications"
              >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    data-testid="badge-notification-count"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-2">
                <DropdownMenuLabel className="p-0">Уведомления</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-xs"
                    onClick={() => markAllAsReadMutation.mutate()}
                    data-testid="button-mark-all-read"
                  >
                    <CheckIcon className="w-3 h-3 mr-1" />
                    Прочитать все
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <ScrollArea className="max-h-96">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground" data-testid="text-no-notifications">
                    Нет уведомлений
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start p-3 cursor-pointer ${
                        !notification.isRead ? "bg-accent/50" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                      data-testid={`notification-${notification.id}`}
                    >
                      <div className="flex items-start justify-between w-full gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: ru,
                            })}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-1" data-testid="indicator-unread" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2"
                data-testid="button-user-menu"
              >
                <Avatar className="w-8 h-8">
                  {user?.profileImageUrl && (
                    <AvatarImage src={user.profileImageUrl} alt={user.firstName || "User"} />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline">{getRoleDisplay(user?.role)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem data-testid="menu-profile" asChild>
                  <a>
                    <UserIcon className="w-4 h-4 mr-2" />
                    Профиль
                  </a>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem data-testid="menu-settings">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Настройки
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                data-testid="menu-logout"
                onClick={() => window.location.href = "/api/logout"}
              >
                <LogOutIcon className="w-4 h-4 mr-2" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}