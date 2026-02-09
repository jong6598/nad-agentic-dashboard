export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>
}) {
  const { agentId } = await params
  return (
    <div>
      <h1>Agent Detail: {agentId}</h1>
    </div>
  )
}
