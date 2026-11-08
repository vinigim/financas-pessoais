import { LoginForm } from './LoginForm'

interface PageProps {
  searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { next } = await searchParams
  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <LoginForm next={next} />
    </main>
  )
}
