
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { paymentKey, orderId, amount } = await req.json()

  const secretKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_SECRET_KEY

  const url = 'https://api.tosspayments.com/v1/payments/confirm'
  const basicToken = Buffer.from(`${secretKey}:`).toString('base64')

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, orderId, paymentKey }),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data)
    } else {
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { message: 'Payment confirmation failed' },
      { status: 500 }
    )
  }
}
