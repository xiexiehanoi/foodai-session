
import TossPaymentButton from '@/components/payments/TossPaymentButton'

export default function PaymentTestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">결제 테스트 페이지</h1>
        <p className="text-lg text-gray-600 mt-4">
          아래 버튼을 클릭하여 결제를 테스트할 수 있습니다.
        </p>
        <div className="mt-8">
          <TossPaymentButton />
        </div>
        <div className="mt-8 text-left max-w-md mx-auto">
          <h2 className="text-2xl font-bold">테스트 안내</h2>
          <p className="mt-4">
            실제 결제를 테스트하려면, Toss Payments 개발자 센터에서 발급받은
            테스트 클라이언트 키를 환경 변수에 설정해야 합니다.
          </p>
          <p className="mt-4">
            <code>.env.local</code> 파일에 다음을 추가하세요:
          </p>
          <pre className="bg-gray-100 p-4 rounded-lg mt-2">
            <code>NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY=YOUR_TEST_CLIENT_KEY</code>
          </pre>
          <p className="mt-4">
            <code>YOUR_TEST_CLIENT_KEY</code>를 실제 테스트 클라이언트 키로
            바꾸세요.
          </p>
        </div>
      </div>
    </div>
  )
}
