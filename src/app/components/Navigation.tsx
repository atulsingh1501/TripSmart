import { Link, useNavigate } from 'react-router-dom';
import { Compass, Menu, User, X, LogIn, UserPlus, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Moon, Sun } from 'lucide-react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Plan Trip', href: '/plan-trip' },
    { label: 'My Trips', href: '/my-trips' },
    { label: 'About', href: '/about' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="w-full border-b border-black/8 dark:border-white/8 bg-white/80 dark:bg-black/30 backdrop-blur-xl z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                <Compass className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">TripSmart</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 text-slate-600 hover:text-slate-900 hover:bg-black/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-lg">
                      <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-cyan-500 text-white font-semibold">
                        {user?.name?.split(' ').map(n => n[0]).join('') || <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" asChild className="text-slate-600 hover:text-slate-900 hover:bg-black/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10 text-sm h-9">
                  <Link to="/login">
                    <LogIn className="mr-1.5 h-3.5 w-3.5" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white text-sm h-9 border-0">
                  <Link to="/signup">
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center rounded-md"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-black/8 dark:border-white/10">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 dark:text-white/80 transition-colors hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 dark:text-white/80 transition-colors hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="block rounded-md px-3 py-2 text-base font-medium text-blue-600 dark:text-blue-400 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
