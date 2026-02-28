import dynamic from 'next/dynamic'

export const revalidate = 0

const DashboardPage = dynamic(() => import('./client'), { ssr: false })

export default DashboardPage
