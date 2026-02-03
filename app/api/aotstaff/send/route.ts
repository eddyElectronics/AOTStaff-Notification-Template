import { NextRequest, NextResponse } from 'next/server';

const AOTSTAFF_API_URL = 'https://api.airportthai.co.th/V1/AOTStaff/SendMessage/';
const AOTSTAFF_API_KEY = process.env.AOTSTAFF_API_KEY || 'LmBuBI2P4IrjEMLHWRrcrgh1TAQ4AwCpoNHQKLIh';

interface SendMessageRequest {
  to: string[];
  title: string;
  message: string;
  source?: string;
  app_url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json();

    const { to, title, message, source = 'AOT', app_url = '' } = body;

    if (!to || to.length === 0) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุผู้รับ (to)' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุข้อความ (message)' },
        { status: 400 }
      );
    }

    const payload = {
      to,
      title: title || 'แจ้งเตือน',
      source,
      app_url,
      messages: message,
    };

    console.log('Sending AOTStaff notification:', JSON.stringify(payload, null, 2));

    const response = await fetch(AOTSTAFF_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AOTSTAFF_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('AOTStaff API error:', response.status, responseData);
      return NextResponse.json(
        {
          success: false,
          error: `API error: ${response.status}`,
          details: responseData,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error sending AOTStaff notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
