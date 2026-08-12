import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(__dirname, '../../../.gemini/antigravity/brain/b9ca53d8-7020-477e-b327-7703ccb309d3/xuanquan_app_icon_1785910653412.png')
const OUT = resolve(__dirname, '../public')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of sizes) {
  await sharp(SRC)
    .resize(size, size)
    .png()
    .toFile(`${OUT}/icon-${size}x${size}.png`)
  console.log(`✅ icon-${size}x${size}.png`)
}

// Apple touch icon 180x180
await sharp(SRC).resize(180, 180).png().toFile(`${OUT}/apple-touch-icon.png`)
console.log('✅ apple-touch-icon.png')

// Favicon 32x32
await sharp(SRC).resize(32, 32).png().toFile(`${OUT}/favicon-32x32.png`)
console.log('✅ favicon-32x32.png')

// favicon.ico (32x32)
await sharp(SRC).resize(32, 32).toFile(`${OUT}/favicon.ico`)
console.log('✅ favicon.ico')

console.log('\n🎉 Tất cả icons đã được tạo!')
