import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Download, Check } from 'lucide-react'

interface BackupCodesDisplayProps {
  codes: string[]
}

export function BackupCodesDisplay({ codes }: BackupCodesDisplayProps): React.ReactElement {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (): Promise<void> => {
    const text = codes.map((code, i) => `${i + 1}. ${code}`).join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadCodes = (): void => {
    const text = [
      'M-Tracking Backup Codes',
      '========================',
      '',
      'Keep these codes safe. Each code can only be used once.',
      '',
      ...codes.map((code, i) => `${i + 1}. ${code}`),
      '',
      `Generated: ${new Date().toLocaleString()}`,
    ].join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'm-tracking-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
        {codes.map((code, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-muted-foreground w-6">{index + 1}.</span>
            <span className="font-medium">{code}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={copyToClipboard}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        <Button variant="outline" className="flex-1" onClick={downloadCodes}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  )
}
