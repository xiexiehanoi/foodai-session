'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Image as ImageIcon, X, Loader2, Zap, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { convertImageToBase64, getImageMimeType, formatFileSize } from '@/lib/utils/imageUtils'
import { createClient } from '@/lib/supabase/client'

interface NutritionAnalysis {
  calories: number
  protein: number
  carbs: number
  fat: number
  foodName: string
  description: string
  rawResponse?: any // 원본 응답 데이터 저장
}

export default function ImageUpload() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null)
  const [analysisStep, setAnalysisStep] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [userUID, setUserUID] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // 컴포넌트 마운트 시 사용자 UID 가져오기
  useEffect(() => {
    const getUserUID = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('사용자 정보 가져오기 실패:', error)
          toast.error('사용자 인증 정보를 가져올 수 없습니다.')
          return
        }

        if (user) {
          setUserUID(user.id)
          console.log('🔐 사용자 UID:', user.id)
        } else {
          console.warn('⚠️ 인증된 사용자가 없습니다.')
          toast.error('로그인이 필요합니다.')
        }
      } catch (error) {
        console.error('사용자 정보 확인 중 오류:', error)
        toast.error('사용자 정보 확인에 실패했습니다.')
      }
    }

    getUserUID()
  }, [])

  const handleImageSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setAnalysis(null)
    } else {
      toast.error('이미지 파일만 업로드 가능합니다.')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setAnalysis(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage) {
      toast.error('이미지를 먼저 선택해주세요.')
      return
    }

    if (!userUID) {
      toast.error('사용자 인증이 필요합니다. 로그인을 확인해주세요.')
      return
    }

    setIsAnalyzing(true)
    setUploadProgress(0)
    setAnalysisStep('이미지 처리 중...')

    try {
      // Step 1: 웹훅 URL 확인
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL

      console.log('🔗 웹훅 URL:', webhookUrl)
      console.log('🔐 사용자 UID:', userUID)

      if (!webhookUrl) {
        throw new Error('웹훅 URL이 설정되지 않았습니다. 환경변수를 확인해주세요.')
      }

      // Step 2: FormData로 이미지 파일 전송 (user_id 포함)
      setAnalysisStep('이미지 파일을 준비하는 중...')
      setUploadProgress(30)

      const formData = new FormData()
      formData.append('image', selectedImage, selectedImage.name)
      formData.append('fileName', selectedImage.name)
      formData.append('mimeType', selectedImage.type)
      formData.append('fileSize', selectedImage.size.toString())
      formData.append('timestamp', new Date().toISOString())
      formData.append('user_id', userUID) // DB용 user_id 필드로 추가

      console.log('📤 이미지 파일로 전송:', {
        fileName: selectedImage.name,
        mimeType: selectedImage.type,
        fileSize: selectedImage.size,
        timestamp: new Date().toISOString(),
        user_id: userUID
      })

      // Step 3: N8N 웹훅으로 이미지 파일 POST 요청
      setAnalysisStep('AI 서버에 이미지 파일 전송 중...')
      setUploadProgress(60)

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      })

      console.log('📡 응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`웹훅 요청 실패: ${response.status} ${response.statusText}`)
      }

      // Step 4: 응답 처리
      setAnalysisStep('AI 분석 결과를 처리하는 중...')
      setUploadProgress(80)

      const responseText = await response.text()
      console.log('📥 원본 응답:', responseText)

      let result
      try {
        result = JSON.parse(responseText)
        console.log('📦 파싱된 응답:', result)
      } catch (parseError) {
        console.error('❌ JSON 파싱 실패:', parseError)
        throw new Error('서버 응답을 파싱할 수 없습니다: ' + responseText.substring(0, 100))
      }

      // N8N으로부터 받은 응답을 NutritionAnalysis 형태로 변환
      const extractNumber = (str: string | number): number => {
        if (typeof str === 'number') return str
        if (typeof str === 'string') {
          const match = str.match(/(\d+(?:\.\d+)?)/);
          return match ? parseFloat(match[1]) : 0
        }
        return 0
      }

      const analysisResult: NutritionAnalysis = {
        calories: extractNumber(result.totalCalories || result.calories || 0),
        protein: extractNumber(result.protein || 0),
        carbs: extractNumber(result.carbohydrates || result.carbs || 0),
        fat: extractNumber(result.fat || result.fats || 0),
        foodName: result.food || result.foodName || result.name || '알 수 없는 음식',
        description: `분석된 음식: ${result.food || '알 수 없는 음식'}`,
        rawResponse: result // 원본 응답 저장
      }

      console.log('✅ 최종 분석 결과:', analysisResult)

      setUploadProgress(100)
      setAnalysisStep('분석 완료!')
      setAnalysis(analysisResult)
      toast.success('🎉 AI 분석이 완료되었습니다!')

    } catch (error) {
      console.error('Analysis error:', error)
      setAnalysisStep('분석 실패')

      if (error instanceof Error && error.message.includes('웹훅 URL')) {
        toast.error('⚠️ ' + error.message)
      } else {
        toast.error('❌ 분석 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
      }

      // 에러 발생 시 폴백으로 모의 데이터 사용 (개발용)
      const fallbackAnalysis: NutritionAnalysis = {
        calories: Math.floor(Math.random() * 500) + 200,
        protein: Math.floor(Math.random() * 30) + 10,
        carbs: Math.floor(Math.random() * 60) + 20,
        fat: Math.floor(Math.random() * 25) + 5,
        foodName: '🔧 개발용 샘플 데이터',
        description: '실제 분석에 실패했습니다. N8N 웹훅 URL과 설정을 확인해주세요. 현재 샘플 데이터를 표시중입니다.'
      }
      setAnalysis(fallbackAnalysis)

    } finally {
      setIsAnalyzing(false)
      setUploadProgress(0)
      setAnalysisStep('')
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Upload Area */}
      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          🍽️ 음식 이미지 분석
        </h2>

        {!selectedImage ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-2">
              음식 이미지를 업로드하세요
            </p>
            <p className="text-sm text-gray-500 mb-4">
              드래그 앤 드롭 또는 클릭하여 선택
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Preview */}
            <div className="relative">
              <div className="relative w-full h-64 bg-gray-100 rounded-2xl overflow-hidden">
                <Image
                  src={previewUrl!}
                  alt="Selected food"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-4 right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Image Info Badge */}
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
                  {selectedImage?.name} • {formatFileSize(selectedImage?.size || 0)}
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={analyzeImage}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl font-medium text-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <div className="flex flex-col items-center">
                    <span>{analysisStep}</span>
                    {uploadProgress > 0 && (
                      <div className="w-32 bg-white/20 rounded-full h-1 mt-2">
                        <div
                          className="bg-white h-1 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  AI로 영양 분석하기
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">🎉 AI 분석 결과</h3>
            <p className="text-gray-600">인공지능이 분석한 음식의 영양 정보입니다</p>
          </div>

          {/* Food Info Card */}
          <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 rounded-2xl p-6 border border-orange-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🍽️</span>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-900">{analysis.foodName}</h4>
                <p className="text-sm text-gray-600">AI가 인식한 음식</p>
              </div>
            </div>

            {/* 원본 상세 정보 표시 */}
            {analysis.rawResponse && analysis.rawResponse.food && (
              <div className="bg-white/80 rounded-xl p-4 mt-4">
                <p className="text-gray-700 font-medium">
                  📋 상세 분석: <span className="font-normal">{analysis.rawResponse.food}</span>
                </p>
              </div>
            )}
          </div>

          {/* Nutrition Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl text-center border border-red-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-1">
                {analysis.calories}
              </div>
              <div className="text-sm font-medium text-gray-600 mb-2">칼로리</div>
              <div className="text-xs text-gray-500">kcal</div>
              {analysis.rawResponse?.totalCalories && (
                <div className="text-xs text-gray-400 mt-1">
                  원본: {analysis.rawResponse.totalCalories}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl text-center border border-blue-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">💪</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {analysis.protein}
              </div>
              <div className="text-sm font-medium text-gray-600 mb-2">단백질</div>
              <div className="text-xs text-gray-500">g</div>
              {analysis.rawResponse?.protein && (
                <div className="text-xs text-gray-400 mt-1">
                  원본: {analysis.rawResponse.protein}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl text-center border border-green-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🌾</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {analysis.carbs}
              </div>
              <div className="text-sm font-medium text-gray-600 mb-2">탄수화물</div>
              <div className="text-xs text-gray-500">g</div>
              {analysis.rawResponse?.carbohydrates && (
                <div className="text-xs text-gray-400 mt-1">
                  원본: {analysis.rawResponse.carbohydrates}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl text-center border border-yellow-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🥑</span>
              </div>
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {analysis.fat}
              </div>
              <div className="text-sm font-medium text-gray-600 mb-2">지방</div>
              <div className="text-xs text-gray-500">g</div>
              {analysis.rawResponse?.fat && (
                <div className="text-xs text-gray-400 mt-1">
                  원본: {analysis.rawResponse.fat}
                </div>
              )}
            </div>
          </div>

          {/* Nutrition Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
            <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span> 영양소 비율
            </h5>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((analysis.protein * 4 / analysis.calories) * 100)}%
                </div>
                <div className="text-sm text-gray-600">단백질 비율</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((analysis.carbs * 4 / analysis.calories) * 100)}%
                </div>
                <div className="text-sm text-gray-600">탄수화물 비율</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.round((analysis.fat * 9 / analysis.calories) * 100)}%
                </div>
                <div className="text-sm text-gray-600">지방 비율</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setAnalysis(null)}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-medium hover:from-gray-700 hover:to-gray-800 transition-colors"
            >
              새로 분석하기
            </button>
            <button
              onClick={() => {
                const data = JSON.stringify(analysis.rawResponse, null, 2)
                navigator.clipboard.writeText(data)
                toast.success('분석 데이터가 복사되었습니다!')
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
            >
              데이터 복사
            </button>
          </div>
        </div>
      )}
    </div>
  )
}