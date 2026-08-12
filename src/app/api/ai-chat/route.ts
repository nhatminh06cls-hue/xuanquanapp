import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`

async function callGemini(parts: unknown[]): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`)
  }
  const json = await res.json() as any
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// Contextual fallback khi Gemini quota hết — match theo keyword
const FALLBACK_RULES: Array<{ keywords: string[]; reply: string }> = [
  {
    keywords: ['phòng khách', 'living room', 'khách', 'nhỏ'],
    reply: `🌸 **Hoa phù hợp phòng khách nhỏ:**

**1. Lan Hồ Điệp mini** 🌺
- Bông nhỏ xinh, không chiếm diện tích
- Đặt trên kệ tivi hoặc bàn cà phê
- Tươi 2-3 tháng, ít chăm sóc

**2. Hoa Cúc bó nhỏ** 🌼
- Màu vàng/trắng rực rỡ, giá hợp lý
- Cắm bình thấp đặt góc phòng
- Thay mỗi 7-10 ngày

**3. Cây Trầu Bà** 🌿
- Lá xanh mướt, chịu bóng tốt
- Có thể treo hoặc đặt trên kệ cao
- Làm sạch không khí tự nhiên

💡 Với phòng nhỏ nên chọn bình thấp, hoa màu sáng để tạo cảm giác rộng hơn!`,
  },
  {
    keywords: ['văn phòng', 'office', 'bàn làm việc', 'ít nắng', 'thiếu sáng'],
    reply: `🏢 **Cây cảnh cho văn phòng ít nắng:**

**1. Cây Lưỡi Hổ** 🌿
- Chịu bóng cực tốt, ít tưới (1 tuần/lần)
- Lọc không khí ban đêm
- Phù hợp đặt góc phòng không có cửa sổ

**2. Cây Dương Xỉ** 🍃
- Lá xanh mướt, tạo cảm giác mát mẻ
- Cần độ ẩm cao — phun sương 2-3 lần/tuần
- Đặt cạnh máy tính để cân bằng bức xạ

**3. Cây Pothos (Trầu Bà)** 💚
- Leo giàn hoặc thả dài rất đẹp
- Sống tốt dưới ánh đèn nhân tạo
- Dễ nhân giống, rất bền

⚡ **Tip:** Cây văn phòng nên đổi vị trí 2 tuần/lần để cây phát triển đều!`,
  },
  {
    keywords: ['sinh nhật', 'tặng', 'mẹ', 'bà', 'quà', 'birthday', 'gift'],
    reply: `🎁 **Gợi ý hoa tặng sinh nhật mẹ/bà:**

**🌹 Hoa Hồng Ecuador đỏ/hồng**
- Ý nghĩa: Yêu thương, trân trọng
- Bó 20-30 cành, cành dài 70cm
- Kết hợp dải lụa và thiệp viết tay

**🌸 Hoa Cẩm Chướng hồng**
- Ý nghĩa truyền thống: Tình mẫu tử bất diệt
- Bền 2 tuần, màu sắc đa dạng
- Giá mềm, phù hợp bó lớn

**🌺 Lan Hồ Điệp chậu**
- Quà lâu bền — tươi 2-3 tháng
- Sang trọng, phù hợp mọi lứa tuổi
- Có thể tái trồng sau khi tàn

💝 **Combo gợi ý:** 20 hồng Ecuador + 10 cẩm chướng + 3 cành baby's breath trắng
→ Giá khoảng 280.000đ tại Làng Hoa Xuân Quan!`,
  },
  {
    keywords: ['phong thuỷ', 'phong thủy', 'may mắn', 'tài lộc', 'bình an', 'feng shui'],
    reply: `💚 **Cây phong thuỷ tốt cho nhà & văn phòng:**

**1. Cây Kim Tiền** 💰
- Tượng trưng tài lộc, thịnh vượng
- Đặt góc Đông Nam (hướng tài lộc)
- Lá tròn xanh bóng, rất dễ sống

**2. Cây Trúc Phú Quý**
- Mang may mắn, bình an
- Cắm nước hoặc trồng chậu đều được
- Không cần ánh sáng mạnh

**3. Cây Đa Búp Đỏ** 🌱
- Lá đỏ tươi, mang sinh khí tích cực
- Phù hợp đặt đầu cầu thang, cửa chính
- Tán rộng, tạo điểm nhấn không gian

**4. Hoa Phong Lan**
- Phong thuỷ tốt, thanh lọc không khí
- Nên chọn màu trắng (tâm linh) hoặc tím (quyền quý)

🧧 **Lưu ý:** Tránh đặt cây có gai (xương rồng) trong nhà theo phong thuỷ truyền thống!`,
  },
  {
    keywords: ['phòng ngủ', 'bedroom', 'ngủ', 'thư giãn', 'relax'],
    reply: `🛏️ **Hoa & cây cảnh phòng ngủ:**

**✅ Nên dùng:**
- **Hoa Lavender** 💜 — Tinh dầu thiên nhiên giúp ngủ ngon
- **Cây Lưỡi Hổ** — Thải O₂ ban đêm, rất tốt cho phòng ngủ
- **Cây Nha Đam** — Lọc không khí, không gây dị ứng

**❌ Tránh dùng:**
- Hoa có mùi nồng (hoa loa kèn, huệ) — quá ngạt khi ngủ
- Cây leo lớn — hút oxy ban đêm
- Hoa mãn đình đỏ — theo phong thuỷ không phù hợp phòng ngủ

**🌿 Gợi ý đặt:**
- Cây nhỏ đặt cạnh cửa sổ, cách giường 1-1.5m
- Bình hoa nhỏ đặt bàn đầu giường (chọn hoa ít phấn hoa)

💡 Phòng ngủ lý tưởng: 1 cây Lưỡi Hổ góc phòng + bình hoa hồng nhỏ đầu giường!`,
  },
  {
    keywords: ['giá', 'bao nhiêu', 'rẻ', 'đắt', 'cost', 'price', 'tiền'],
    reply: `💰 **Bảng giá tham khảo tại Làng Hoa Xuân Quan:**

| Loại hoa | Đơn vị | Giá lẻ | Giá sỉ (≥5) |
|---|---|---|---|
| Hoa Hồng Ecuador | Bó 10 cành | 180.000đ | 140.000đ |
| Lan Hồ Điệp | Chậu | 280.000đ | 220.000đ |
| Cúc Mâm Xôi | Bó | 65.000đ | 50.000đ |
| Cẩm Chướng | Bó 20 cành | 120.000đ | 95.000đ |
| Kim Tiền | Chậu | 150.000đ | 120.000đ |

🚚 **Phí giao hàng:** 30.000đ (miễn phí đơn đầu tiên)
⏰ **Giao trong ngày:** Đặt trước 14:00

📞 Liên hệ trực tiếp để được báo giá sỉ số lượng lớn!`,
  },
  {
    keywords: ['chăm sóc', 'tưới', 'bón', 'héo', 'vàng lá', 'chết', 'care'],
    reply: `🌱 **Cách chăm sóc hoa cắt tươi:**

**💧 Cắm hoa:**
1. Cắt chân cành xiên 45° dưới nước chảy
2. Bỏ lá chạm vào nước (tránh thối nước)
3. Dùng bình sứ/thủy tinh sạch
4. Thêm 1 muỗng cà phê đường + vài giọt bleach

**📅 Thay nước:**
- Hoa hồng, cẩm chướng: 2 ngày/lần
- Cúc, ly: 3 ngày/lần
- Mỗi lần thay: cắt thêm 1cm chân cành

**☀️ Ánh sáng:**
- Tránh ánh nắng trực tiếp và điều hòa thổi thẳng
- Đặt nơi thoáng mát, nhiệt độ 18-25°C

**⚠️ Dấu hiệu cần xử lý:**
- Lá vàng → thiếu nước hoặc úng rễ
- Cành mềm, héo sớm → nước bẩn hoặc cắt chân chưa đúng
- Hoa không nở → thiếu sáng

💐 Hoa Xuân Quan đảm bảo tươi tối thiểu 7 ngày nếu chăm đúng cách!`,
  },
  {
    keywords: ['hoa gì', 'loại hoa', 'nên chọn', 'tư vấn', 'gợi ý', 'recommend'],
    reply: `🌸 **Các loại hoa phổ biến tại Làng Hoa Xuân Quan:**

**🌹 Hoa Hồng** — Đa năng nhất
- Tặng quà, trang trí, sự kiện
- 200+ giống, giá từ 15.000đ/cành

**🌼 Hoa Cúc** — Giá rẻ, bền nhất
- Tươi 2-3 tuần
- Phù hợp bàn thờ, trang trí hàng ngày

**🌺 Lan Hồ Điệp** — Sang trọng nhất
- Quà tặng cao cấp, trang trí sự kiện
- Tươi 2-3 tháng

**💐 Cẩm Chướng** — Ý nghĩa nhất cho mẹ
- Ngày 8/3, sinh nhật, tri ân

**🌷 Ly (Lily)** — Thơm nhất
- Mùi dễ chịu, phòng khách, lễ tân

Bạn cần hoa cho **dịp gì** hoặc **không gian nào**? Mình sẽ tư vấn cụ thể hơn! 😊`,
  },
  {
    keywords: ['đám cưới', 'wedding', 'lễ cưới', 'hoa cưới', 'cô dâu', 'bridal'],
    reply: `💒 **Hoa cưới tại Làng Hoa Xuân Quan:**

**🌸 Hoa cầm tay cô dâu:**
- Hồng Ecuador trắng + mẫu đơn + baby's breath
- Lan Hồ Điệp trắng + cẩm chướng tím
- Giá: 350.000đ - 800.000đ/bó

**💐 Trang trí sân khấu:**
- Vòng hoa lớn backdrop: 1.200.000đ - 3.000.000đ
- Bàn tiệc (mỗi bàn): 180.000đ - 350.000đ
- Cổng hoa: 500.000đ - 1.500.000đ

**🌹 Combo tiết kiệm:**
- 100 khách: Gói từ 8.000.000đ (bao gồm sân khấu + 10 bàn tiệc)

**📋 Quy trình đặt hoa cưới:**
1. Gặp tư vấn trực tiếp tại vườn (miễn phí)
2. Chốt màu sắc, style
3. Đặt cọc 30% trước 2 tuần
4. Giao hoa trước ngày cưới 1 ngày

📞 Liên hệ sớm vì mùa cưới thường kín lịch!`,
  },
]

function getFallbackReply(message: string, hasImage: boolean): string {
  if (hasImage) {
    return `🖼️ **Phân tích không gian của bạn:**

Dựa trên ảnh bạn gửi, mình gợi ý:

**1. Lan Hồ Điệp** 🌺
- Sang trọng, phù hợp không gian hiện đại
- Đặt ở điểm nhìn chính của phòng
- Chọn màu trắng hoặc tím nhẹ

**2. Hoa Hồng cắm bình** 🌹  
- Tạo điểm nhấn màu sắc ấm áp
- Bình thấp đặt bàn hoặc kệ

**3. Cây Kim Tiền** 💚
- Phong thuỷ tốt, xanh tốt quanh năm
- Đặt góc phòng hoặc cạnh cửa sổ

💡 Hãy ghé **Làng Hoa Xuân Quan** để xem trực tiếp và được tư vấn miễn phí!

_(Kích hoạt Gemini AI để phân tích chính xác theo ảnh thật của bạn)_`
  }

  const lowerMsg = message.toLowerCase()
  for (const rule of FALLBACK_RULES) {
    if (rule.keywords.some(kw => lowerMsg.includes(kw))) {
      return rule.reply
    }
  }

  // Generic fallback
  return `🌸 **Cảm ơn bạn đã hỏi!**

Câu hỏi của bạn: *"${message}"*

Mình có thể tư vấn về:
• 🏠 Hoa phù hợp phòng khách, phòng ngủ, văn phòng
• 🎁 Hoa tặng sinh nhật, mẹ, bà, người thân
• 💚 Cây phong thuỷ tài lộc, bình an
• 🌱 Cách chăm sóc hoa tươi lâu
• 💒 Hoa cưới, sự kiện
• 💰 Bảng giá tham khảo

Bạn thử hỏi cụ thể hơn nhé? Ví dụ: *"Hoa nào phù hợp phòng ngủ?"* 😊

Hoặc **gửi ảnh phòng** để mình tư vấn theo không gian thực tế của bạn! 📸`
}


export async function POST(req: NextRequest) {
  let message: string | null = null
  let imageFile: File | null = null

  try {
    const formData = await req.formData()
    imageFile = formData.get('image') as File | null
    message   = formData.get('message') as string | null

    if (!imageFile && !message) {
      return NextResponse.json({ error: 'Vui lòng gửi ảnh hoặc tin nhắn' }, { status: 400 })
    }

    const parts: unknown[] = []

    if (imageFile) {
      const bytes  = await imageFile.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      parts.push({ inlineData: { data: base64, mimeType: imageFile.type } })
      parts.push({
        text: message ?? `Bạn là chuyên gia tư vấn hoa cho làng hoa Xuân Quan, Văn Giang, Hưng Yên.
Hãy phân tích ảnh không gian/phòng này và gợi ý 3-5 loại hoa/cây cảnh phù hợp nhất.
Trả lời bằng tiếng Việt, thân thiện, dùng emoji.`,
      })
    } else {
      parts.push({
        text: `Bạn là chuyên gia tư vấn hoa cho làng hoa Xuân Quan, Văn Giang, Hưng Yên.
Hãy tư vấn về hoa và cây cảnh dựa trên câu hỏi sau. Trả lời ngắn gọn, thân thiện, bằng tiếng Việt, dùng emoji:

${message}`,
      })
    }

    const reply = await callGemini(parts)
    return NextResponse.json({ reply })

  } catch (err: any) {
    console.error('[AI Chat Error]', err.message)

    // Nếu lỗi quota → trả về fallback theo nội dung câu hỏi
    const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')
    if (isQuota) {
      return NextResponse.json({
        reply: getFallbackReply(message ?? '', !!imageFile),
        isDemo: true,
      })
    }

    // Lỗi khác → báo lỗi bình thường
    return NextResponse.json(
      { error: `Lỗi kết nối AI: ${err.message?.slice(0, 100) ?? 'Không xác định'}` },
      { status: 500 }
    )
  }
}
