const https = require('https')

const gardens = [
  { name: 'Hà Hương',     url: 'https://maps.app.goo.gl/XFax2aLjsxTgGdSu7' },
  { name: 'Thanh Bình',   url: 'https://maps.app.goo.gl/i1Oo1zfPueGrUncr9' },
  { name: 'Hiển Lền',     url: 'https://maps.app.goo.gl/YHNA81WGKABXz8nQ7' },
  { name: 'Song Anh',     url: 'https://maps.app.goo.gl/hhnoEF7FatjXmFns9' },
  { name: 'Quang Phương', url: 'https://maps.app.goo.gl/VoPxx2Q2or2CfHmn6' },
  { name: 'Phúc Vân',     url: 'https://maps.app.goo.gl/1pecraSHwrBFS1AfA' },
  { name: 'Oai Liên',     url: 'https://maps.app.goo.gl/Q9FSeKTBBCg7UQvi8' },
  { name: 'Anh Hường',    url: 'https://maps.app.goo.gl/MsoqUvzk9zSSJ3ed8' },
  { name: 'Đức Nghĩa',    url: 'https://maps.app.goo.gl/s3RvrY1RnRerUNz29' },
  { name: 'Tuyên Tú',     url: 'https://maps.app.goo.gl/1Ky7yFTeBUASishH69' },
]

function resolve(url) {
  return new Promise((res) => {
    https.get(url, { headers: { 'User-Agent': 'curl/7.88' } }, r => {
      const loc = r.headers['location'] || ''
      const latM = loc.match(/[,!]3d([\d.]+)/)
      const lngM = loc.match(/[,!]4d([\d.]+)/)
      res({ lat: latM?.[1], lng: lngM?.[1] })
    }).on('error', () => res({ lat: null, lng: null }))
  })
}

;(async () => {
  for (const g of gardens) {
    const r = await resolve(g.url)
    console.log(`  { name: 'Nhà Vườn ${g.name}', lat: ${r.lat}, lng: ${r.lng}, mapsUrl: '${g.url}' },`)
  }
})()
