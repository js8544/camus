import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
const BACKEND_ENDPOINT = process.env.BACKEND_ENDPOINT;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { params } = body;

    if (!params) {
      return NextResponse.json({ error: 'Task params are required' }, { status: 400 });
    }

    if (!BACKEND_ENDPOINT) {
      return NextResponse.json({ error: 'Backend endpoint not configured' }, { status: 500 });
    }

    // 调用后端API获取计划
    const response = await fetch(`${BACKEND_ENDPOINT}/report/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
            "topic_and_objective": params.topic,
            "target_population": params.persona,
            "questionnaire": params.questions,
            "report_dimensions": params.reportDimensions,
            "background_info": params.basicKnowledge,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend plan API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch plan from backend' }, 
        { status: response.status }
      );
    }

    const planData = await response.json();

    return NextResponse.json(planData );
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan' }, 
      { status: 500 }
    );
  }
}
