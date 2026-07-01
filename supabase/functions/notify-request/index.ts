import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const MANAGER_EMAIL = 'beekai4130@gmail.com'
const FROM_EMAIL = 'Property Control <noreply@propertycontrol.bg>'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { type, description, ownerName, ownerEmail, propertyAddress } = await req.json()

    const typeLabels: Record<string, string> = {
      repair: 'Ремонт',
      cleaning: 'Уборка',
      photo: 'Фото-отчёт',
      'tenant-check': 'Проверка жильца',
      emergency: 'Экстренный выезд',
      other: 'Другое',
    }
    const typeLabel = typeLabels[type] || type
    const address = propertyAddress || '—'
    const date = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [MANAGER_EMAIL],
        subject: `Новая заявка: ${typeLabel} — ${address}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 20px;color:#1a1a2e">📋 Новая заявка от собственника</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#666;width:130px">Собственник</td><td style="padding:8px 0;font-weight:500">${ownerName} (${ownerEmail})</td></tr>
              <tr><td style="padding:8px 0;color:#666">Тип заявки</td><td style="padding:8px 0;font-weight:500">${typeLabel}</td></tr>
              <tr><td style="padding:8px 0;color:#666">Объект</td><td style="padding:8px 0;font-weight:500">${address}</td></tr>
              <tr><td style="padding:8px 0;color:#666">Дата</td><td style="padding:8px 0">${date}</td></tr>
            </table>
            <div style="margin-top:16px;padding:14px;background:#f5f5f5;border-radius:10px">
              <div style="color:#666;font-size:12px;margin-bottom:6px">Описание:</div>
              <div style="font-size:14px;line-height:1.5">${description}</div>
            </div>
            <p style="margin-top:20px;font-size:12px;color:#999">Property Control · property-control.bg</p>
          </div>
        `,
      }),
    })

    return new Response(
      JSON.stringify({ ok: emailRes.ok, status: emailRes.status }),
      { headers: { 'Content-Type': 'application/json', ...CORS } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
    )
  }
})
