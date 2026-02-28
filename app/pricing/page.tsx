import dynamic from 'next/dynamic'

export const revalidate = 0

const PricingPage = dynamic(() => import('./client'), { ssr: false })

export default PricingPage
