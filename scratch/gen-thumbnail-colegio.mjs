import sharp from 'sharp'

const W = 1024
const H = 724
const RED = '#B22234'
const BORDER = 14

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="white"/>
  <rect x="0" y="0" width="${BORDER}" height="${H}" fill="${RED}"/>
  <rect x="0" y="${H - BORDER}" width="${W}" height="${BORDER}" fill="${RED}"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="#d6d6d6" stroke-width="2"/>

  <rect x="220" y="42" width="120" height="48" rx="4" fill="#f8f8f8" stroke="#ddd"/>
  <text x="280" y="72" font-family="Arial,sans-serif" font-size="11" fill="#888" text-anchor="middle">CIP</text>
  <rect x="360" y="42" width="120" height="48" rx="4" fill="#f8f8f8" stroke="#ddd"/>
  <text x="420" y="72" font-family="Arial,sans-serif" font-size="11" fill="#888" text-anchor="middle">IPG</text>

  <rect x="${W - 48 - 96}" y="36" width="96" height="96" rx="4" fill="#f0f0f0"/>
  <text x="${W - 48 - 48}" y="150" font-family="Arial,sans-serif" font-size="11" fill="#999" text-anchor="middle">Verifica su autenticidad</text>

  <text x="${W / 2}" y="210" font-family="Arial,sans-serif" font-size="58" fill="#1a1a1a" text-anchor="middle">CERTIFICADO</text>
  <text x="${W / 2}" y="250" font-family="Arial,sans-serif" font-size="16" fill="#888" text-anchor="middle">Otorgado a:</text>
  <text x="${W / 2}" y="295" font-family="Arial,sans-serif" font-size="38" fill="${RED}" font-weight="bold" text-anchor="middle">Nombre del Estudiante</text>
  <text x="${W / 2}" y="340" font-family="Arial,sans-serif" font-size="16" fill="#555" text-anchor="middle">Por haber concluido y aprobado con éxito el curso de especialización de:</text>
  <text x="${W / 2}" y="385" font-family="Arial,sans-serif" font-size="32" fill="#1a1a1a" font-weight="bold" text-anchor="middle">Nombre del curso</text>
  <text x="${W / 2}" y="430" font-family="Arial,sans-serif" font-size="14" fill="#666" text-anchor="middle">Colegio de Ingenieros del Perú y el Instituto Peruano de Gestión Ambiental...</text>
  <text x="${W / 2}" y="500" font-family="Arial,sans-serif" font-size="14" fill="#888" font-weight="bold" text-anchor="middle">APROBADO</text>

  <line x1="250" y1="600" x2="430" y2="600" stroke="#333"/>
  <text x="340" y="620" font-family="Arial,sans-serif" font-size="13" fill="#333" font-weight="bold" text-anchor="middle">Gerente General</text>
  <line x1="594" y1="600" x2="774" y2="600" stroke="#333"/>
  <text x="684" y="620" font-family="Arial,sans-serif" font-size="13" fill="#333" font-weight="bold" text-anchor="middle">Director Académico</text>
</svg>`

await sharp(Buffer.from(svg)).png().toFile('public/images/plantillas-certificado/colegio_ingenieros.png')
console.log('Thumbnail colegio generado OK')
