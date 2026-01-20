import { useRef, useState } from 'react'
import { User, Camera, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAvatarUpload } from '../hooks/use-avatar-upload'
import { cn } from '@/lib/utils'

/**
 * Avatar upload component
 * Handles image selection, preview, upload, and deletion
 */

interface AvatarUploadProps {
  currentAvatar?: string
  name: string
}

export function AvatarUpload({ currentAvatar, name }: AvatarUploadProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const { uploadAvatar, isUploading, deleteAvatar, isDeleting } = useAvatarUpload()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Upload
    uploadAvatar(file)
  }

  const handleDelete = (): void => {
    if (confirm('Are you sure you want to remove your avatar?')) {
      deleteAvatar()
      setPreview(null)
    }
  }

  const displayAvatar = preview || currentAvatar

  return (
    <div className="flex items-center gap-6">
      {/* Avatar Display */}
      <div className="relative">
        <div
          className={cn(
            'h-24 w-24 rounded-full overflow-hidden bg-muted',
            'flex items-center justify-center'
          )}
        >
          {displayAvatar ? (
            <img src={displayAvatar} alt={name} className="h-full w-full object-cover" />
          ) : (
            <User className="h-12 w-12 text-muted-foreground" />
          )}

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {currentAvatar ? 'Change' : 'Upload'}
        </Button>

        {currentAvatar && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}

        <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB.</p>
      </div>
    </div>
  )
}
