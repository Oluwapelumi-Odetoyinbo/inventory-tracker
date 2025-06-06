"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { api } from "@/lib/api"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password)

      setToken(response.token)
      setUser(response.user)

      localStorage.setItem("token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))
    } catch (error) {
      throw error
    }
  }
  
  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.register(name, email, password)

      setToken(response.token)
      setUser(response.user)

      localStorage.setItem("token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }

 return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
