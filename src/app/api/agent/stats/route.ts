import { NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const agentId = parseInt(searchParams.get('agentId') || '1')

  const data = dataStore.getAgentDashboardData(agentId)
  return NextResponse.json(data)
}
