'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
    >
      <Printer className="w-4 h-4" /> Print Report
    </button>
  )
}
