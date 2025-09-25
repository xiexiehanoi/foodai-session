'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { LogOut, User as UserIcon } from 'lucide-react'
import TossPaymentButton from '../payments/TossPaymentButton'

interface AuthButtonProps {
  user: User | null
}

export default function AuthButton({ user }: AuthButtonProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return user ? (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm">
        <UserIcon className="w-4 h-4" />
        <span>{user.email}</span>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        로그아웃
      </button>
      <TossPaymentButton />
    </div>
  ) : (
    <div className="flex items-center gap-4">
      <button
        onClick={() => router.push('/login')}
        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        로그인
      </button>
      <TossPaymentButton />
    </div>
  )
}