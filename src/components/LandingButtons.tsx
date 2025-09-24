'use client'

import { useRouter } from 'next/navigation'

export default function LandingButtons() {
  const router = useRouter()

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <button
        onClick={() => router.push('/signup')}
        className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-2xl text-lg hover:from-orange-700 hover:to-red-700 transition-colors shadow-lg"
      >
        무료로 시작하기
      </button>
      <button
        onClick={() => router.push('/login')}
        className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-2xl text-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-lg"
      >
        로그인하기
      </button>
    </div>
  )
}