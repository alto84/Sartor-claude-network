"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Archive,
  MessageCircle,
  Settings,
  Menu,
  X,
  Brain,
  Wrench,
  Sparkles,
  Sun,
  Server,
  Shield,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { brand } from "@/lib/brand";
import { SidebarPip } from "@/components/brand/pip-mood";
import { StreakDisplay } from "@/components/gamification/streak";
import {
  staggerContainerVariants,
  staggerItemVariants,
  defaultTransition,
  overlayVariants,
  drawerVariants,
} from "@/lib/animations";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "My Profile", href: "/profile", icon: Brain },
  { name: "Family", href: "/family", icon: Users },
  { name: "Vault", href: "/vault", icon: Archive },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Claude Tasks", href: "/tasks", icon: Sparkles },
  { name: "Setup", href: "/setup", icon: Wrench },
  { name: "Settings", href: "/settings", icon: Settings },
];

// Drug Development / Safety Research section
const safetyResearchNav = [
  { name: "Safety Research", href: "/safety", icon: Shield, iconSecondary: FlaskConical },
];

// Solar Inference section - GPU Server Management
const solarInferenceNav = [
  { name: "Solar Inference", href: "/servers", icon: Sun, iconSecondary: Server },
];

const navItemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  hover: { x: 4, transition: { duration: 0.2 } },
};

export function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="bg-background shadow-md"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-sidebar"
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop (always visible) */}
      <aside
        className="hidden lg:block fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border"
        role="navigation"
        aria-label="Main navigation"
      >
        <SidebarContent pathname={pathname} onNavClick={() => {}} />
      </aside>

      {/* Sidebar - Mobile (animated) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside
            id="mobile-sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border"
            role="navigation"
            aria-label="Main navigation"
          >
            <SidebarContent
              pathname={pathname}
              onNavClick={() => setMobileMenuOpen(false)}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  pathname,
  onNavClick,
}: {
  pathname: string;
  onNavClick: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo and Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex h-16 items-center gap-2 px-4 border-b border-sidebar-border"
      >
        <Logo variant="full" size="sm" animated />
        <div className="flex flex-col ml-1">
          <span className="text-xs text-muted-foreground">
            {brand.tagline}
          </span>
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Primary navigation">
        <motion.ul
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
          className="space-y-1"
          role="list"
        >
          {navigation.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <motion.li
                key={item.name}
                variants={staggerItemVariants}
                whileHover="hover"
                custom={index}
              >
                <Link
                  href={item.href}
                  onClick={onNavClick}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: isActive ? 0 : 5 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-colors",
                      isActive && "text-primary"
                    )} />
                  </motion.div>
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>

        {/* Safety Research Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-6 pt-4 border-t border-sidebar-border"
        >
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Drug Development
          </p>
          <motion.ul className="space-y-1" role="list">
            {safetyResearchNav.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <motion.li
                  key={item.name}
                  whileHover="hover"
                  variants={navItemVariants}
                >
                  <Link
                    href={item.href}
                    onClick={onNavClick}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-500/30"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: isActive ? 0 : 10 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="relative"
                    >
                      <item.icon className={cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-emerald-500" : "text-emerald-600"
                      )} />
                      {item.iconSecondary && (
                        <item.iconSecondary className="h-3 w-3 absolute -bottom-0.5 -right-0.5 text-teal-500" />
                      )}
                    </motion.div>
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="safetyIndicator"
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        </motion.div>

        {/* Solar Inference Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 pt-4 border-t border-sidebar-border"
        >
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            GPU Servers
          </p>
          <motion.ul className="space-y-1" role="list">
            {solarInferenceNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <motion.li
                  key={item.name}
                  whileHover="hover"
                  variants={navItemVariants}
                >
                  <Link
                    href={item.href}
                    onClick={onNavClick}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-400 shadow-sm border border-amber-500/30"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: isActive ? 0 : 10 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="relative"
                    >
                      <item.icon className={cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-amber-500" : "text-amber-600"
                      )} />
                      {item.iconSecondary && (
                        <item.iconSecondary className="h-3 w-3 absolute -bottom-0.5 -right-0.5 text-green-500" />
                      )}
                    </motion.div>
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="solarIndicator"
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        </motion.div>
      </nav>

      {/* Pip Mood & Streak */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="border-t border-sidebar-border px-3 py-2"
      >
        <div className="flex items-center justify-between">
          <SidebarPip />
          <StreakDisplay variant="compact" />
        </div>
      </motion.div>

      {/* User Profile */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="border-t border-sidebar-border p-3"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/20 transition-all">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    AS
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Alton Sartor</span>
                <span className="text-xs text-muted-foreground">Admin</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer transition-colors hover:bg-accent">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer transition-colors hover:bg-accent">
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive hover:bg-destructive/10">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </div>
  );
}
