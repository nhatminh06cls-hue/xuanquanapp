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

      // Pins nhà vườn
      gardens.forEach(g => {
        if (!g.lat || !g.lng) return

        const phoneLink = g.phone
          ? `<br/><a href="tel:${g.phone}" style="color:#1B6B5A">📞 ${g.phone}</a>`
          : ''
        const rating = g.rating
          ? `<br/><span style="color:#f59e0b">⭐ ${g.rating}</span> (${g.review_count ?? 0})`
          : ''
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lng}`

        L.marker([g.lat, g.lng], { icon: gardenIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:180px">
              <strong style="color:#1B6B5A">${g.name}</strong>
              ${rating}
              <br/><small style="color:#666">${g.address}</small>
              ${phoneLink}
              <br/><a href="${directionsUrl}" target="_blank"
                style="color:#1B6B5A; font-weight:bold; font-size:12px; margin-top:4px; display:inline-block">
                🧭 Chỉ đường
              </a>
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
