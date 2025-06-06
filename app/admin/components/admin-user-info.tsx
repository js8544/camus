"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Shield, User } from "lucide-react"
import { signOut, useSession } from "next-auth/react"

export function AdminUserInfo() {
  const { data: session } = useSession()

  if (!session?.user) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <User className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Shield className="h-3 w-3 text-green-600" />
              <User className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-gray-900">
                {session.user.name || "Admin"}
              </div>
              <div className="text-xs text-gray-500">
                {session.user.email}
              </div>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-2">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium">Admin Access</p>
              <p className="text-xs text-gray-500">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 
