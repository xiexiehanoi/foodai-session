import { createClient } from '@/lib/supabase/server'
import AuthButton from '@/components/auth/AuthButton'
import ImageUpload from '@/components/ImageUpload'
import LandingButtons from '@/components/LandingButtons'
import { Sparkles, Brain, Zap } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <header className="w-full p-4 sm:p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">🍽️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">FoodAI</h1>
          </div>
          <AuthButton user={user} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!user ? (
          /* Landing Page for Non-authenticated Users */
          <div className="text-center space-y-16">
            {/* Hero Section */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-5xl sm:text-6xl font-bold text-gray-900">
                  AI로 분석하는
                  <span className="block bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    음식 영양 정보
                  </span>
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  음식 사진 한 장으로 칼로리와 3대 영양소를 즉시 분석하세요.
                  AI 기술로 정확하고 빠른 영양 분석을 경험해보세요.
                </p>
              </div>

              <LandingButtons />
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">AI 기반 분석</h3>
                <p className="text-gray-600">
                  최신 AI 기술로 음식 이미지를 분석하여 정확한 영양 정보를 제공합니다.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">스마트 인식</h3>
                <p className="text-gray-600">
                  다양한 음식을 자동으로 인식하고 칼로리와 3대 영양소를 계산합니다.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">즉시 분석</h3>
                <p className="text-gray-600">
                  사진 업로드 후 몇 초 만에 상세한 영양 정보를 확인할 수 있습니다.
                </p>
              </div>
            </div>

            {/* Demo Image */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">이렇게 사용하세요</h3>
              <div className="grid md:grid-cols-3 gap-6 items-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl text-white">📸</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. 사진 업로드</h4>
                  <p className="text-sm text-gray-600">음식 사진을 업로드하세요</p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl text-white">🤖</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. AI 분석</h4>
                  <p className="text-sm text-gray-600">AI가 음식을 자동 분석합니다</p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl text-white">📊</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. 결과 확인</h4>
                  <p className="text-sm text-gray-600">상세한 영양 정보를 확인하세요</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Image Upload Section for Authenticated Users */
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                안녕하세요, {user.email?.split('@')[0]}님! 👋
              </h2>
              <p className="text-lg text-gray-600">
                음식 사진을 업로드하고 AI 분석을 시작해보세요.
              </p>
            </div>

            <ImageUpload />
          </div>
        )}
      </main>
    </div>
  );
}
