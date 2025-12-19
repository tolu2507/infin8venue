// app/menu/payment-cancel/page.tsx
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <XCircle className="h-24 w-24 text-red-500 mx-auto mb-8" />
        <h1 className="text-4xl font-bold mb-4">Payment Cancelled</h1>
        <p className="text-xl text-gray-300">
          No worries — you can try again or pay with cash at the counter.
        </p>
      </div>
    </div>
  );
}
