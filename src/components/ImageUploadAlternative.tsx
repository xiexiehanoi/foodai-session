'use client'

import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, X, Loader2, Zap, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { convertImageToBase64, getImageMimeType, formatFileSize } from '@/lib/utils/imageUtils'

interface NutritionAnalysis {
  calories: number
  protein: number
  carbs: number
  fat: number
  foodName: string
  description: string
}

export default function ImageUploadAlternative() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null)
  const [analysisStep, setAnalysisStep] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [sendMethod, setSendMethod] = useState<'formdata' | 'base64'>('formdata')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // FormData 방식으로 전송
  const sendViaFormData = async (webhookUrl: string) => {
    const formData = new FormData()
    formData.append('image', selectedImage!)
    formData.append('fileName', selectedImage!.name)
    formData.append('mimeType', selectedImage!.type)
    formData.append('fileSize', selectedImage!.size.toString())
    formData.append('timestamp', new Date().toISOString())

    console.log('📤 FormData 전송')

    return await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
    })
  }

  // Base64 JSON 방식으로 전송
  const sendViaBase64 = async (webhookUrl: string) => {
    const base64Image = await convertImageToBase64(selectedImage!)

    const requestData = {
      image: `data:${selectedImage!.type};base64,${base64Image}`,
      fileName: selectedImage!.name,
      mimeType: selectedImage!.type,
      fileSize: selectedImage!.size,
      timestamp: new Date().toISOString(),
    }

    console.log('📤 Base64 JSON 전송:', {
      fileName: requestData.fileName,
      mimeType: requestData.mimeType,
      fileSize: requestData.fileSize,
      imageLength: base64Image.length
    })

    return await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestData),
    })
  }

  const analyzeImage = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)
    setUploadProgress(0)
    setAnalysisStep('이미지 처리 중...')

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL

      console.log('🔗 웹훅 URL:', webhookUrl)
      console.log('📋 전송 방식:', sendMethod)

      if (!webhookUrl) {
        throw new Error('웹훅 URL이 설정되지 않았습니다.')
      }

      setAnalysisStep(`${sendMethod === 'formdata' ? 'FormData' : 'Base64'} 방식으로 전송 중...`)
      setUploadProgress(50)

      let response: Response

      if (sendMethod === 'formdata') {
        response = await sendViaFormData(webhookUrl)
      } else {
        response = await sendViaBase64(webhookUrl)
      }

      console.log('📡 응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`웹훅 요청 실패: ${response.status} ${response.statusText}`)
      }

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

      const analysisResult: NutritionAnalysis = {
        calories: result.calories || result.kcal || 0,
        protein: result.protein || result.proteins || 0,
        carbs: result.carbs || result.carbohydrates || result.carbohydrate || 0,
        fat: result.fat || result.fats || result.lipid || 0,
        foodName: result.foodName || result.name || result.food || '알 수 없는 음식',
        description: result.description || result.summary || '음식에 대한 설명이 없습니다.'
      }

      console.log('✅ 최종 분석 결과:', analysisResult)

      setUploadProgress(100)
      setAnalysisStep('분석 완료!')
      setAnalysis(analysisResult)
      toast.success('🎉 AI 분석이 완료되었습니다!')

    } catch (error) {
      console.error('Analysis error:', error)
      setAnalysisStep('분석 실패')
      toast.error('❌ 분석 중 오류: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))

      // 폴백 데이터
      const fallbackAnalysis: NutritionAnalysis = {
        calories: Math.floor(Math.random() * 500) + 200,
        protein: Math.floor(Math.random() * 30) + 10,
        carbs: Math.floor(Math.random() * 60) + 20,
        fat: Math.floor(Math.random() * 25) + 5,
        foodName: '🔧 테스트 샘플 데이터',
        description: `${sendMethod} 방식 전송 실패. N8N 웹훅 설정을 확인해주세요.`
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
      {/* 전송 방식 선택 */}
      <div className="bg-white rounded-2xl shadow-xl p-4 mb-4">
        <h3 className="text-lg font-semibold mb-3">전송 방식 선택</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setSendMethod('formdata')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              sendMethod === 'formdata'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            FormData (multipart/form-data)
          </button>
          <button
            onClick={() => setSendMethod('base64')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              sendMethod === 'base64'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Base64 JSON
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {sendMethod === 'formdata'
            ? 'N8N에서 Binary Data로 받을 수 있는 방식'
            : 'JSON으로 Base64 인코딩된 이미지를 전송하는 방식'
          }
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          🍽️ 음식 이미지 분석 (디버그 모드)
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
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
                  {selectedImage?.name} • {formatFileSize(selectedImage?.size || 0)}
                </div>
              </div>
            </div>

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
                  {sendMethod === 'formdata' ? 'FormData로' : 'Base64로'} AI 분석하기
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">분석 결과</h3>
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 mb-6">
            <h4 className="text-xl font-bold text-gray-900 mb-2">{analysis.foodName}</h4>
            <p className="text-gray-700">{analysis.description}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl text-center">
              <div className="text-3xl mb-2">🔥</div>
              <div className="text-2xl font-bold text-red-600 mb-1">{analysis.calories}</div>
              <div className="text-sm text-gray-600">칼로리 (kcal)</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl text-center">
              <div className="text-3xl mb-2">💪</div>
              <div className="text-2xl font-bold text-blue-600 mb-1">{analysis.protein}g</div>
              <div className="text-sm text-gray-600">단백질</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl text-center">
              <div className="text-3xl mb-2">🌾</div>
              <div className="text-2xl font-bold text-green-600 mb-1">{analysis.carbs}g</div>
              <div className="text-sm text-gray-600">탄수화물</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl text-center">
              <div className="text-3xl mb-2">🥑</div>
              <div className="text-2xl font-bold text-yellow-600 mb-1">{analysis.fat}g</div>
              <div className="text-sm text-gray-600">지방</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}