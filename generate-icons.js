const sharp = require('sharp')
const path = require('path')
const publicDir = path.join(__dirname, 'public')
const src = path.join(publicDir, 'logo-xuanquan.png')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

async function run() {
  for (const s of sizes) {
    await sharp(src)
      .resize(s, s, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, `icon-${s}x${s}.png`))
    console.log(`✓ icon-${s}x${s}.png`)
  }

  // apple-touch-icon 180x180
  await sharp(src)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 255 } })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'))
  console.log('✓ apple-touch-icon.png')

  // favicon-32x32
  await sharp(src)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 255 } })
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'))
  console.log('✓ favicon-32x32.png')

  console.log('🎉 Tất cả icons đã được tạo!')
}

run().catch(console.error)
