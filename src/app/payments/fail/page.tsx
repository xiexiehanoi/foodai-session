
export default function PaymentFailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600">결제 실패</h1>
        <p className="text-lg text-gray-600 mt-4">
          결제에 실패했습니다. 다시 시도해주세요.
        </p>
      </div>
    </div>
  )
}
