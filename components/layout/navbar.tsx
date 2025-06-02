"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LogOut, Package, ShoppingCart, BarChart3, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/inventory", label: "Add Inventory", icon: Package },
    { href: "/orders", label: "Record Order", icon: ShoppingCart },
  ]

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-lg sm:text-xl font-bold text-foreground">Inventory Tracker</h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1 ml-8">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href}>
                <Button variant={isActive ? "default" : "ghost"} className="flex items-center space-x-2 h-9">
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Desktop User Info & Logout */}
        <div className="hidden md:flex items-center space-x-4 ml-auto">
          <span className="text-sm text-muted-foreground hidden lg:inline">Welcome, {user.name || user.email}</span>
          <Button variant="outline" onClick={logout} className="flex items-center space-x-2 h-9">
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Logout</span>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center space-x-2 ml-auto">
          <span className="text-xs text-muted-foreground max-w-[120px] truncate">{user.name || user.email}</span>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="py-4 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 py-4">
                  <div className="space-y-2">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href

                      return (
                        <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                          <Button
                            variant={isActive ? "default" : "ghost"}
                            className="w-full justify-start h-12 text-left"
                          >
                            <Icon className="h-5 w-5 mr-3" />
                            <span className="text-base">{item.label}</span>
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Logout Button */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      logout()
                      setIsOpen(false)
                    }}
                    className="w-full justify-start h-12"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span className="text-base">Logout</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
