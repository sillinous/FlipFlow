import dynamic from 'next/dynamic'
export const revalidate = 0
const AnalyzePage = dynamic(() => import('./client'), { ssr: false })
export default AnalyzePage
