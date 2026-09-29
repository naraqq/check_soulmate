import { RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router'
import { track } from '../../lib/analytics'
import { storage } from '../../lib/storage'
import { Button } from './Button'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'quiet'
  size?: 'md' | 'lg'
  className?: string
  /** Ask before discarding unsent answers. */
  confirmMessage?: string
  label?: string
}

/**
 * Starts a brand-new check on this device. Only local progress is cleared —
 * an existing report is not deleted and still opens from its link.
 */
export function RetestButton({ variant = 'secondary', size = 'md', className, confirmMessage, label = 'Дахин шалгах' }: Props) {
  const navigate = useNavigate()

  function startOver() {
    if (confirmMessage && !window.confirm(confirmMessage)) return
    storage.clearAll()
    track({ name: 'check_started' })
    navigate('/check')
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={startOver}>
      <RotateCcw className="size-4" aria-hidden /> {label}
    </Button>
  )
}
