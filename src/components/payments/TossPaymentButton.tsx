
'use client'

import { loadTossPayments } from '@tosspayments/payment-sdk'
import { nanoid } from 'nanoid'

export default function TossPaymentButton() {
  const handlePayment = async () => {
    const tossPayments = await loadTossPayments(
      process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY || ''
    )

    tossPayments.requestPayment('카드', {
      amount: 15000,
      orderId: nanoid(),
      orderName: '토스 티셔츠 외 2건',
      customerName: '김토스',
      successUrl: `${window.location.origin}/payments/success`,
      failUrl: `${window.location.origin}/payments/fail`,
    })
  }

  return (
    <button
      onClick={handlePayment}
      className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
    >
      결제
    </button>
  )
}
