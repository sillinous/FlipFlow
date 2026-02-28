import dynamic from 'next/dynamic'

export const revalidate = 0

const SignupPage = dynamic(() => import('./client'), { ssr: false })

export default SignupPage
