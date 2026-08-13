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

interface LeafletMapProps {
  gardens: Garden[]
}

// ── Nhà vườn đã xác nhận (cập nhật dần) ──
const KNOWN_GARDENS = [
  { name: 'Nhà Vườn Bích Trắc',  lat: 20.9676943, lng: 105.916722,  mapsUrl: 'https://maps.app.goo.gl/ntK6P12err4n2noC9' },
  { name: 'Nhà Vườn Chiến Hoan', lat: 20.9688225, lng: 105.9184685, mapsUrl: 'https://maps.app.goo.gl/2w4Qmj2BknXzRvv2A' },
  { name: 'Nhà Vườn Dũng Bách',  lat: 20.9695591, lng: 105.9166711, mapsUrl: 'https://maps.app.goo.gl/4pTTiTXx6mNBsKHWA' },
  { name: 'Nhà Vườn Sản Hòe',    lat: 20.969511,  lng: 105.9176163, mapsUrl: 'https://maps.app.goo.gl/4c8PeeMtC3jFurEM7' },
]

export function LeafletMap({ gardens }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Load Leaflet dynamically
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = (window as any).L
      if (!mapRef.current) return

      // Khởi tạo map — center tại cổng Xuân Quan
      const map = L.map(mapRef.current, {
        center: [20.9650, 105.9145],
        zoom: 15,
        zoomControl: true,
      })

      mapInstanceRef.current = map

      // OpenStreetMap tiles (miễn phí, không cần API key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // Icon nhà vườn custom
      const gardenIcon = L.divIcon({
        html: `<div style="
          background: #1B6B5A;
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">🌸</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      })

      // Icon cổng làng (đặc biệt)
      const gateIcon = L.divIcon({
        html: `<div style="
          background: #e53935;
          color: white;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        ">📍</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      })

      // Pin cổng làng Xuân Quan
      L.marker([20.9689691, 105.9200531], { icon: gateIcon })
        .addTo(map)
        .bindPopup(`
          <div style="text-align:center; min-width:160px">
            <strong style="color:#e53935">📍 Cổng Làng Hoa Xuân Quan</strong><br/>
            <small>Văn Giang, Hưng Yên</small><br/>
            <a href="https://maps.app.goo.gl/wSQALMvX67CmrbXN9"
               target="_blank"
               style="color:#1B6B5A; font-weight:bold; font-size:12px">
              🧭 Chỉ đường
            </a>
          </div>
        `)

      // Merge KNOWN_GARDENS với data từ DB (ưu tiên tọa độ từ KNOWN_GARDENS)
      // DB data thêm: phone, rating
      const dbMap = new Map(gardens.map(g => [g.name.toLowerCase(), g]))

      KNOWN_GARDENS.forEach(kg => {
        const dbGarden = [...dbMap.values()].find(g =>
          g.name.toLowerCase().includes(kg.name.toLowerCase().replace('nhà vườn ', '').toLowerCase()) ||
          kg.name.toLowerCase().includes(g.name.toLowerCase())
        )

        const phone = dbGarden?.phone
          ? `<br/><a href="tel:${dbGarden.phone}" style="color:#1B6B5A">📞 ${dbGarden.phone}</a>`
          : ''
        const rating = dbGarden?.rating
          ? `<br/><span style="color:#f59e0b">⭐ ${dbGarden.rating}</span> (${dbGarden.review_count ?? 0})`
          : ''
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${kg.lat},${kg.lng}`
        const mapsLink = kg.mapsUrl
          ? `<br/><a href="${kg.mapsUrl}" target="_blank" style="color:#888;font-size:11px">📌 Xem trên Google Maps</a>`
          : ''
        const appLink = dbGarden
          ? `<br/><a href="/search?gardenId=${dbGarden.id}" style="color:#1B6B5A;font-weight:bold;font-size:12px">🌸 Xem sản phẩm</a>`
          : ''

        L.marker([kg.lat, kg.lng], { icon: gardenIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:190px; line-height:1.6">
              <strong style="color:#1B6B5A;font-size:14px">${kg.name}</strong>
              ${rating}
              ${phone}
              ${mapsLink}
              <div style="margin-top:6px;display:flex;gap:6px">
                <a href="${directionsUrl}" target="_blank"
                  style="color:white;background:#1B6B5A;font-weight:bold;font-size:12px;padding:3px 8px;border-radius:8px;text-decoration:none">
                  🧭 Chỉ đường
                </a>
                ${appLink}
              </div>
            </div>
          `)
      })

      // Cũng hiện các garden từ DB có tọa độ mà không có trong KNOWN_GARDENS
      gardens.forEach(g => {
        if (!g.lat || !g.lng) return
        const alreadyShown = KNOWN_GARDENS.some(kg => Math.abs(kg.lat - g.lat!) < 0.001 && Math.abs(kg.lng - g.lng!) < 0.001)
        if (alreadyShown) return

        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lng}`
        L.marker([g.lat, g.lng], { icon: gardenIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:180px">
              <strong style="color:#1B6B5A">${g.name}</strong>
              ${g.phone ? `<br/><a href="tel:${g.phone}" style="color:#1B6B5A">📞 ${g.phone}</a>` : ''}
              <br/><a href="${directionsUrl}" target="_blank"
                style="color:#1B6B5A;font-weight:bold;font-size:12px">🧭 Chỉ đường</a>
            </div>
          `)
      })
    }
    document.head.appendChild(script)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [gardens])

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '320px' }}
      className="z-0"
    />
  )
}
