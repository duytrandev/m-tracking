interface DividerProps {
  text?: string
}

/**
 * Divider component with optional centered text
 */
export function Divider({ text = 'or' }: DividerProps) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white dark:bg-slate-950 px-3 text-gray-500 dark:text-gray-400 font-medium">{text}</span>
      </div>
    </div>
  )
}
