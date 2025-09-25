'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey')
      const orderId = searchParams.get('orderId')
      const amount = searchParams.get('amount')

      if (!paymentKey || !orderId || !amount) {
        setError({ message: '필수 결제 정보가 없습니다.' })
        return
      }

      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        })

        const data = await response.json()

        if (response.ok) {
          setConfirmationResult(data)
        } else {
          setError(data)
        }
      } catch (err) {
        setError({ message: '결제 승인 중 오류가 발생했습니다.' })
      }
    }

    confirmPayment()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {!confirmationResult && !error && (
          <div>
            <h1 className="text-4xl font-bold">결제 승인 중...</h1>
            <p className="text-lg text-gray-600 mt-4">
              잠시만 기다려주세요.
            </p>
          </div>
        )}

        {confirmationResult && (
          <div>
            <h1 className="text-4xl font-bold text-green-600">결제 성공</h1>
            <p className="text-lg text-gray-600 mt-4">
              결제가 성공적으로 완료되었습니다.
            </p>
            <div className="mt-8 text-left max-w-md mx-auto bg-gray-50 text-black p-4 rounded-lg">
              <p><strong>주문 ID:</strong> {confirmationResult.orderId}</p>
              <p><strong>결제 금액:</strong> {confirmationResult.totalAmount.toLocaleString()}원</p>
              <p><strong>결제 수단:</strong> {confirmationResult.method}</p>
            </div>
          </div>
        )}

        {error && (
          <div>
            <h1 className="text-4xl font-bold text-red-600">결제 실패</h1>
            <p className="text-lg text-gray-600 mt-4">
              {error.message || '결제 승인에 실패했습니다.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
