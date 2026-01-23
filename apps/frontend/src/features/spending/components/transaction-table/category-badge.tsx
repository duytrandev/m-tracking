import { HelpCircle } from 'lucide-react'

/**
 * Category badge component props
 */
interface CategoryBadgeProps {
  category: {
    name: string
    color: string
  }
}

/**
 * Category badge component
 * Displays a colored badge with category name
 */
export function CategoryBadge({ category }: CategoryBadgeProps) {
  const isUnknown = category.name === 'Unknown'

  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-background/60 border"
      style={{
        borderColor: `${category.color}40`,
        color: category.color,
      }}
    >
      <div
        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: category.color }}
        aria-hidden="true"
      />
      <span className="truncate max-w-[80px]">{category.name}</span>
      {isUnknown && <HelpCircle className="h-2.5 w-2.5" />}
    </div>
  )
}
