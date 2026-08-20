'use client'

import { useEffect, useRef } from 'react'

interface Garden {
  id: string
  name: string
  address: string
  phone?: string
  lat?: number
  lng?: number
  rating?: number
  review_count?: number
}

interface GoongMapProps {
  gardens: Garden[]
  apiKey: string
}

// ── Nhà vườn đã xác nhận với tọa độ chính xác từ Google Maps ──
const KNOWN_GARDENS = [
  // ── 4 nhà vườn bạn xác nhận trực tiếp ──
  { name: 'Nhà Vườn Bích Trắc',      lat: 20.9676943, lng: 105.916722,  mapsUrl: 'https://maps.app.goo.gl/ntK6P12err4n2noC9' },
  { name: 'Nhà Vườn Chiến Hoan',     lat: 20.9688225, lng: 105.9184685, mapsUrl: 'https://maps.app.goo.gl/2w4Qmj2BknXzRvv2A' },
  { name: 'Nhà Vườn Dũng Bách',      lat: 20.9695591, lng: 105.9166711, mapsUrl: 'https://maps.app.goo.gl/4pTTiTXx6mNBsKHWA' },
  { name: 'Nhà Vườn Sản Hòe',        lat: 20.969511,  lng: 105.9176163, mapsUrl: 'https://maps.app.goo.gl/4c8PeeMtC3jFurEM7' },
  // ── Nhà vườn từ Google Doc ──
  { name: 'Vườn Cây Hoàng Kim',      lat: 20.968513,  lng: 105.917944,  mapsUrl: 'https://maps.app.goo.gl/vcKSrozLVPYbRuy39' },
  { name: 'Nhà Vườn Hà Từ',          lat: 20.9688499, lng: 105.9188319, mapsUrl: 'https://maps.app.goo.gl/1qk3TPdjyD2BsmqJ7' },
  { name: 'Nhà Vườn Nam Thu',        lat: 20.9687712, lng: 105.9186282, mapsUrl: 'https://maps.app.goo.gl/L781sKGn7oa2UoTZ8' },
  { name: 'Nhà Vườn Duy Phượng',    lat: 20.9688223, lng: 105.9181214, mapsUrl: 'https://maps.app.goo.gl/4RnpZcpLTPxC3yon9' },
  { name: 'Nhà Vườn Hưởng Hiền',    lat: 20.9688833, lng: 105.917546,  mapsUrl: 'https://maps.app.goo.gl/APxJBPVR6c4yHpUb6' },
  { name: 'Nhà Vườn Lan Tươi',      lat: 20.9691996, lng: 105.9166577, mapsUrl: 'https://maps.app.goo.gl/RgrhwGQW3mikCcgu5' },
  { name: 'Nhà Vườn Ánh Việt',      lat: 20.9689873, lng: 105.916877,  mapsUrl: 'https://maps.app.goo.gl/kz695zvCiYL7G3DB8' },
  { name: 'Nhà Vườn Nhi Anh',       lat: 20.9690841, lng: 105.9176104, mapsUrl: 'https://maps.app.goo.gl/2a7riF44YFbUkemK8' },
  { name: 'Nhà Vườn Tường Nhung',   lat: 20.9686326, lng: 105.9184002, mapsUrl: 'https://maps.app.goo.gl/t8NmMaH8rrJoapbbA' },
  { name: 'Nhà Vườn Hoàng Kim',     lat: 20.968513,  lng: 105.917944,  mapsUrl: 'https://maps.app.goo.gl/taRLDmaJxPNsccCq8' },
  { name: 'Nhà Vườn Tĩnh Thúy',     lat: 20.9686737, lng: 105.9166202, mapsUrl: 'https://maps.app.goo.gl/jrfmjXnXpS9Vsjso7' },
  { name: 'Cây Cảnh Thanh Dương',   lat: 20.968473,  lng: 105.9167942, mapsUrl: 'https://maps.app.goo.gl/KSgzTJ8a7UM53PFi6' },
  { name: 'Nhà Vườn Bảo Anh',       lat: 20.9679402, lng: 105.9179091, mapsUrl: 'https://maps.app.goo.gl/VKKMB4LeuDyL91nE6' },
  { name: 'Vườn Lan Nông Nghiệp',   lat: 20.9678844, lng: 105.9172722, mapsUrl: 'https://maps.app.goo.gl/7HajZqQKAdYU2RYW6' },
  { name: 'Nhà Vườn Lý Trường',     lat: 20.9675675, lng: 105.9163952, mapsUrl: 'https://maps.app.goo.gl/aZMUQmDjYKVFuQiX6' },
  { name: 'Nhà Vườn Ly Phóng',      lat: 20.9672091, lng: 105.9166906, mapsUrl: 'https://maps.app.goo.gl/LibfY219B8LPrPgj8' },
  { name: 'Nhà Vườn Uyên Quảng',   lat: 20.9565786, lng: 105.9151653, mapsUrl: 'https://maps.app.goo.gl/MhLA4FGXWns4YcU79' },
  { name: 'Nhà Vườn Thủy Cam',      lat: 20.9566858, lng: 105.9160796, mapsUrl: 'https://maps.app.goo.gl/9twnKhotwqPVtsX2A' },
  // ── Bổ sung từ Google Doc (đợt 2) ──
  { name: 'Nhà Vườn Hà Hương',      lat: 20.9667955, lng: 105.9165229, mapsUrl: 'https://maps.app.goo.gl/XFax2aLjsxTgGdSu7' },
  { name: 'Nhà Vườn Thanh Bình',    lat: 20.9663577, lng: 105.9165122, mapsUrl: 'https://maps.app.goo.gl/i1Oo1zfPueGrUncr9' },
  { name: 'Nhà Vườn Hiển Lền',      lat: 20.9662173, lng: 105.917503,  mapsUrl: 'https://maps.app.goo.gl/YHNA81WGKABXz8nQ7' },
  { name: 'Nhà Vườn Song Anh',      lat: 20.9655845, lng: 105.9167825, mapsUrl: 'https://maps.app.goo.gl/hhnoEF7FatjXmFns9' },
  { name: 'Nhà Vườn Quang Phương',  lat: 20.9654731, lng: 105.918356,  mapsUrl: 'https://maps.app.goo.gl/VoPxx2Q2or2CfHmn6' },
  { name: 'Nhà Vườn Phúc Vân',      lat: 20.9656089, lng: 105.9146957, mapsUrl: 'https://maps.app.goo.gl/1pecraSHwrBFS1AfA' },
  { name: 'Nhà Vườn Oai Liên',      lat: 20.9654375, lng: 105.9156875, mapsUrl: 'https://maps.app.goo.gl/Q9FSeKTBBCg7UQvi8' },
  { name: 'Nhà Vườn Anh Hường',     lat: 20.9652787, lng: 105.916835,  mapsUrl: 'https://maps.app.goo.gl/MsoqUvzk9zSSJ3ed8' },
  { name: 'Nhà Vườn Đức Nghĩa',     lat: 20.9651693, lng: 105.917048,  mapsUrl: 'https://maps.app.goo.gl/s3RvrY1RnRerUNz29' },
  { name: 'Nhà Vườn Tuyên Tú',      lat: 20.955692,  lng: 105.9154636, mapsUrl: 'https://maps.app.goo.gl/1Ky7yFTeBUASishH69' },
]

export function GoongMap({ gardens, apiKey }: GoongMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  // Fallback: nếu chưa có Goong API key, hiện danh sách nhà vườn
  if (!apiKey) {
    return (
      <div style={{ background: '#f8f5f0' }}>
        {/* Banner thông báo */}
        <div style={{
          background: 'linear-gradient(135deg, #1B6B5A, #2d9a7a)',
          color: 'white', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px'
        }}>
          <span>🗺️</span>
          <span>Bản đồ tương tác đang được kích hoạt — Xem danh sách nhà vườn bên dưới</span>
        </div>

        {/* Nút chỉ đường cổng làng */}
        <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #eee' }}>
          <a
            href="https://maps.app.goo.gl/wSQALMvX67CmrbXN9"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#e53935', color: 'white', padding: '8px 16px',
              borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px'
            }}
          >
            📍 Chỉ đường đến Cổng Làng Hoa Xuân Quan
          </a>
        </div>

        {/* Danh sách nhà vườn */}
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
          {KNOWN_GARDENS.map((kg, i) => {
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${kg.lat},${kg.lng}`
            return (
              <div key={i} style={{
                background: 'white', borderRadius: '12px', padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🌸</span>
                  <span style={{ fontWeight: '600', fontSize: '13px', color: '#1a1a1a' }}>{kg.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {kg.mapsUrl && (
                    <a href={kg.mapsUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: '#888', textDecoration: 'none' }}>
                      📌
                    </a>
                  )}
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      background: '#1B6B5A', color: 'white', padding: '4px 10px',
                      borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none'
                    }}>
                    🧭 Đường
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Load Goong JS CSS (jsDelivr CDN chính thức)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css'
    document.head.appendChild(link)

    // Load Goong JS SDK
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js'
    script.onload = () => {
      const goongjs = (window as any).goongjs
      if (!mapRef.current || !goongjs) return

      // Set access token
      goongjs.accessToken = apiKey

      // Khởi tạo bản đồ Goong (nền tảng VN, không có đường lưỡi bò)
      const map = new goongjs.Map({
        container: mapRef.current,
        style: 'https://tiles.goong.io/assets/goong_map_web.json',
        center: [105.9170, 20.9680], // Xuân Quan
        zoom: 15,
      })

      mapInstanceRef.current = map

      map.on('load', () => {
        // ── Pin cổng làng (đỏ) ──
        const gateEl = document.createElement('div')
        gateEl.innerHTML = '📍'
        gateEl.style.cssText = `
          background:#e53935; color:white; border-radius:50%;
          width:36px; height:36px; display:flex; align-items:center;
          justify-content:center; font-size:18px;
          border:2px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.4);
          cursor:pointer;
        `

        new goongjs.Marker({ element: gateEl })
          .setLngLat([105.9200531, 20.9689691])
          .setPopup(
            new goongjs.Popup({ offset: 18 }).setHTML(`
              <div style="text-align:center;min-width:160px">
                <strong style="color:#e53935">📍 Cổng Làng Hoa Xuân Quan</strong><br/>
                <small>Văn Giang, Hưng Yên</small><br/>
                <a href="https://maps.app.goo.gl/wSQALMvX67CmrbXN9"
                   target="_blank" style="color:#1B6B5A;font-weight:bold;font-size:12px">
                  🧭 Chỉ đường
                </a>
              </div>
            `)
          )
          .addTo(map)

        // ── Pins nhà vườn (xanh) ──
        const dbMap = new Map(gardens.map(g => [g.name.toLowerCase(), g]))

        KNOWN_GARDENS.forEach(kg => {
          const dbGarden = [...dbMap.values()].find(g =>
            g.name.toLowerCase().includes(kg.name.toLowerCase().replace('nhà vườn ', '')) ||
            kg.name.toLowerCase().includes(g.name.toLowerCase())
          )

          const el = document.createElement('div')
          el.innerHTML = '🌸'
          el.style.cssText = `
            background:#1B6B5A; color:white; border-radius:50%;
            width:30px; height:30px; display:flex; align-items:center;
            justify-content:center; font-size:14px;
            border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);
            cursor:pointer;
          `

          const phone = dbGarden?.phone
            ? `<br/><a href="tel:${dbGarden.phone}" style="color:#1B6B5A">📞 ${dbGarden.phone}</a>`
            : ''
          const rating = dbGarden?.rating
            ? `<br/><span style="color:#f59e0b">⭐ ${dbGarden.rating}</span>`
            : ''
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${kg.lat},${kg.lng}`
          const mapsLink = kg.mapsUrl
            ? `<br/><a href="${kg.mapsUrl}" target="_blank" style="color:#888;font-size:11px">📌 Google Maps</a>`
            : ''
          const appLink = dbGarden?.id
            ? `<a href="/search?gardenId=${dbGarden.id}" style="color:#1B6B5A;font-weight:bold;font-size:12px">🌸 Xem SP</a>`
            : ''

          new goongjs.Marker({ element: el })
            .setLngLat([kg.lng, kg.lat])
            .setPopup(
              new goongjs.Popup({ offset: 16 }).setHTML(`
                <div style="min-width:190px;line-height:1.7">
                  <strong style="color:#1B6B5A;font-size:13px">${kg.name}</strong>
                  ${rating}${phone}${mapsLink}
                  <div style="margin-top:6px;display:flex;gap:6px">
                    <a href="${directionsUrl}" target="_blank"
                      style="color:white;background:#1B6B5A;font-weight:bold;font-size:11px;
                             padding:3px 8px;border-radius:8px;text-decoration:none">
                      🧭 Chỉ đường
                    </a>
                    ${appLink}
                  </div>
                </div>
              `)
            )
            .addTo(map)
        })

        // Thêm garden từ DB chưa có trong KNOWN_GARDENS
        gardens.forEach(g => {
          if (!g.lat || !g.lng) return
          const already = KNOWN_GARDENS.some(
            kg => Math.abs(kg.lat - g.lat!) < 0.001 && Math.abs(kg.lng - g.lng!) < 0.001
          )
          if (already) return

          const el = document.createElement('div')
          el.innerHTML = '🌸'
          el.style.cssText = `
            background:#2d9a7a; color:white; border-radius:50%;
            width:30px; height:30px; display:flex; align-items:center;
            justify-content:center; font-size:14px;
            border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);
            cursor:pointer;
          `
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lng}`
          new goongjs.Marker({ element: el })
            .setLngLat([g.lng, g.lat])
            .setPopup(
              new goongjs.Popup({ offset: 16 }).setHTML(`
                <div style="min-width:180px">
                  <strong style="color:#1B6B5A">${g.name}</strong>
                  ${g.phone ? `<br/><a href="tel:${g.phone}" style="color:#1B6B5A">📞 ${g.phone}</a>` : ''}
                  <br/><a href="${directionsUrl}" target="_blank"
                    style="color:#1B6B5A;font-weight:bold;font-size:12px">🧭 Chỉ đường</a>
                </div>
              `)
            )
            .addTo(map)
        })
      })
    }

    document.head.appendChild(script)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [gardens, apiKey])

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '340px' }}
      className="z-0"
    />
  )
}
