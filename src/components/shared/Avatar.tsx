type AvatarSize = 'sm' | 'md' | 'lg'

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

interface AvatarProps {
  name: string
  bg?: string
  color?: string
  size?: AvatarSize
}

export default function Avatar({
  name,
  bg = 'bg-navy',
  color = 'text-white',
  size = 'md',
}: AvatarProps) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-semibold ${bg} ${color} ${sizeStyles[size]}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}