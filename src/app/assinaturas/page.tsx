import { listSubscriptions } from '@/lib/subscriptions'
import { SubscriptionsView } from '@/components/SubscriptionsView'

export const dynamic = 'force-dynamic'

export default async function AssinaturasPage() {
  const subscriptions = await listSubscriptions()
  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Assinaturas</h1>
        <p className="text-sm text-slate-400 mt-1">
          Tudo que cobra sozinho todo mês (ou todo ano), convertido em custo mensal.
        </p>
      </div>
      <SubscriptionsView subscriptions={subscriptions} />
    </main>
  )
}
