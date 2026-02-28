import dynamic from 'next/dynamic'
export const revalidate = 0
const LoginPage = dynamic(() => import('./client'), { ssr: false })
export default LoginPage
