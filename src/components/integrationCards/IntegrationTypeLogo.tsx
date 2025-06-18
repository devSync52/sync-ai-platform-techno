import Image from 'next/image'

type Props = {
  type: string
  size?: number
}

export default function IntegrationTypeLogo({ type, size = 80 }: Props) {
  const logos: Record<string, string> = {
    sellercloud: '/logos/sellercloud.png',
    extensiv: '/logos/extensiv.png',
    project44: '/logos/project44.png',
    outro: '/logos/integration-generic.png',
  }

  const src = logos[type.toLowerCase()] || logos['outro']

  return (
    <Image
      src={src}
      alt={type}
      width={size}
      height={size}
      className="rounded object-contain"
    />
  )
}