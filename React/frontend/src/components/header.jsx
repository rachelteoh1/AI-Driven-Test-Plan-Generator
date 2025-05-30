import { Button } from "./ui/button"
import { X } from "lucide-react"

export function Header() {
  return (
    <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4">
          <img src="/keysight.png" alt="KeysightGPT Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-semibold text-gray-900">KeysightGPT</span>
        </div>
      </div>
      <Button variant="ghost" size="icon">
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
