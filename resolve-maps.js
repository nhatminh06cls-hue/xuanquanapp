const https = require('https')

const gardens = [
  { name: 'Vườn cây Hoàng Kim', url: 'https://maps.app.goo.gl/vcKSrozLVPYbRuy39' },
  { name: 'Hà Từ',              url: 'https://maps.app.goo.gl/1qk3TPdjyD2BsmqJ7' },
  { name: 'Nam Thu',            url: 'https://maps.app.goo.gl/L781sKGn7oa2UoTZ8' },
  { name: 'Duy Phượng',        url: 'https://maps.app.goo.gl/4RnpZcpLTPxC3yon9' },
  { name: 'Hưởng Hiền',        url: 'https://maps.app.goo.gl/APxJBPVR6c4yHpUb6' },
  { name: 'Lan Tươi',          url: 'https://maps.app.goo.gl/RgrhwGQW3mikCcgu5' },
  { name: 'Ánh Việt',          url: 'https://maps.app.goo.gl/kz695zvCiYL7G3DB8' },
  { name: 'Dũng Bách (2)',     url: 'https://maps.app.goo.gl/WtweGJzxXecutS2y8' },
  { name: 'Nhi Anh',           url: 'https://maps.app.goo.gl/2a7riF44YFbUkemK8' },
  { name: 'Tường Nhung',       url: 'https://maps.app.goo.gl/t8NmMaH8rrJoapbbA' },
  { name: 'Hoàng Kim',         url: 'https://maps.app.goo.gl/taRLDmaJxPNsccCq8' },
  { name: 'Tĩnh Thúy',         url: 'https://maps.app.goo.gl/jrfmjXnXpS9Vsjso7' },
  { name: 'Thanh Dương',       url: 'https://maps.app.goo.gl/KSgzTJ8a7UM53PFi6' },
  { name: 'Bảo Anh',           url: 'https://maps.app.goo.gl/VKKMB4LeuDyL91nE6' },
  { name: 'Vườn Lan NN',       url: 'https://maps.app.goo.gl/7HajZqQKAdYU2RYW6' },
  { name: 'Lý Trường',         url: 'https://maps.app.goo.gl/aZMUQmDjYKVFuQiX6' },
  { name: 'Ly Phóng',          url: 'https://maps.app.goo.gl/LibfY219B8LPrPgj8' },
  { name: 'Uyên Quảng',        url: 'https://maps.app.goo.gl/MhLA4FGXWns4YcU79' },
  { name: 'Thủy Cam',          url: 'https://maps.app.goo.gl/9twnKhotwqPVtsX2A' },
]

function resolve(url) {
  return new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': 'curl/7.88' } }, r => {
      const loc = r.headers['location'] || ''
      // Extract pin coordinates from !3d LAT !4d LNG
      const latM = loc.match(/[!,]3d([\d.]+)/)
      const lngM = loc.match(/[!,]4d([\d.]+)/)
      res({ lat: latM?.[1], lng: lngM?.[1], loc })
    }).on('error', rej)
  })
}

;(async () => {
  for (const g of gardens) {
    const r = await resolve(g.url)
    console.log(`  { name: '${g.name}', lat: ${r.lat}, lng: ${r.lng}, mapsUrl: '${g.url}' },`)
  }
})()
