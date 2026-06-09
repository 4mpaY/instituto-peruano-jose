import sharp from 'sharp'

const W = 1024
const H = 724
const BAR = 16
const COLOR = '#36B658'
const TEAL = '#139971'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="white"/>

  <!-- barras top/bottom -->
  <rect x="0" y="0" width="${W}" height="${BAR}" fill="${COLOR}"/>
  <rect x="0" y="${H - BAR}" width="${W}" height="${BAR}" fill="${COLOR}"/>

  <!-- Logo placeholder izquierda -->
  <rect x="48" y="30" width="90" height="36" rx="4" fill="#f5f5f5" stroke="#e0e0e0" stroke-width="1"/>
  <text x="93" y="53" font-family="Arial,sans-serif" font-size="11" fill="#888" text-anchor="middle">LOGO</text>

  <!-- CCL logo placeholder -->
  <rect x="154" y="30" width="90" height="36" rx="4" fill="#f5f5f5" stroke="#e0e0e0" stroke-width="1"/>
  <text x="199" y="53" font-family="Arial,sans-serif" font-size="11" fill="#888" text-anchor="middle">CCL ASOCIADO</text>

  <!-- QR placeholder derecha -->
  <rect x="${W - 48 - 96}" y="26" width="96" height="96" rx="4" fill="#f0f0f0"/>
  <rect x="${W - 48 - 88}" y="34" width="24" height="24" rx="2" fill="#888"/>
  <rect x="${W - 48 - 58}" y="34" width="24" height="24" rx="2" fill="#888"/>
  <rect x="${W - 48 - 88}" y="64" width="24" height="24" rx="2" fill="#888"/>
  <rect x="${W - 48 - 58}" y="64" width="10" height="10" fill="#888"/>
  <rect x="${W - 48 - 44}" y="64" width="10" height="10" fill="#888"/>
  <rect x="${W - 48 - 22}" y="34" width="12" height="54" rx="2" fill="#bbb"/>
  <text x="${W - 48 - 48}" y="136" font-family="Arial,sans-serif" font-size="12" fill="#999" text-anchor="middle">Verifica su</text>
  <text x="${W - 48 - 48}" y="150" font-family="Arial,sans-serif" font-size="12" fill="#999" text-anchor="middle">autenticidad</text>

  <!-- CERTIFICADO centrado -->
  <text x="${W / 2}" y="218" font-family="Georgia,serif" font-size="64" fill="#1a1a1a" font-weight="300" text-anchor="middle" letter-spacing="8">CERTIFICADO</text>

  <!-- Otorgado a -->
  <text x="${W / 2}" y="262" font-family="Arial,sans-serif" font-size="18" fill="#888" text-anchor="middle">Otorgado a:</text>

  <!-- Nombre estudiante -->
  <text x="${W / 2}" y="308" font-family="Arial,sans-serif" font-size="42" fill="${TEAL}" font-weight="bold" text-anchor="middle">Nombre del Estudiante</text>

  <!-- Por haber concluido -->
  <text x="${W / 2}" y="352" font-family="Arial,sans-serif" font-size="17" fill="#555" text-anchor="middle">Por haber concluido y aprobado con exito el curso de especializacion de:</text>

  <!-- Nombre curso -->
  <text x="${W / 2}" y="396" font-family="Arial,sans-serif" font-size="36" fill="#1a1a1a" font-weight="bold" text-anchor="middle">Nombre del curso</text>

  <!-- Descripcion -->
  <text x="${W / 2}" y="440" font-family="Arial,sans-serif" font-size="15" fill="#555" text-anchor="middle">Emitido por el <tspan font-weight="bold" fill="#1a1a1a">Instituto Peruano de Gestion Ambiental,</tspan> con una duracion de xxxx horas,</text>
  <text x="${W / 2}" y="460" font-family="Arial,sans-serif" font-size="15" fill="#555" text-anchor="middle">realizado desde el 00 al 00 de xxxxx del 0000.</text>

  <!-- Por cuanto -->
  <text x="${W / 2}" y="492" font-family="Arial,sans-serif" font-size="15" fill="#555" text-anchor="middle">Por cuanto: Para que conste y sea reconocido, se otorga el presente certificado en calidad de:</text>

  <!-- APROBADO -->
  <text x="${W / 2}" y="528" font-family="Arial,sans-serif" font-size="15" fill="${TEAL}" font-weight="bold" text-anchor="middle" letter-spacing="3">APROBADO</text>

  <!-- Firmado -->
  <text x="${W / 2}" y="550" font-family="Arial,sans-serif" font-size="14" fill="#888" text-anchor="middle">Firmado, el 00 de xxxxx del 0000.</text>

  <!-- Firma izquierda -->
  <line x1="240" y1="628" x2="440" y2="628" stroke="#333" stroke-width="1"/>
  <text x="340" y="644" font-family="Arial,sans-serif" font-size="15" fill="#1a1a1a" font-weight="bold" text-anchor="middle">Gerente General</text>
  <text x="340" y="660" font-family="Arial,sans-serif" font-size="13" fill="#888" text-anchor="middle">Instituto Peruano</text>

  <!-- Firma derecha -->
  <line x1="584" y1="628" x2="784" y2="628" stroke="#333" stroke-width="1"/>
  <text x="684" y="644" font-family="Arial,sans-serif" font-size="15" fill="#1a1a1a" font-weight="bold" text-anchor="middle">Director Academico</text>
  <text x="684" y="660" font-family="Arial,sans-serif" font-size="13" fill="#888" text-anchor="middle">Instituto Peruano</text>
</svg>`

await sharp(Buffer.from(svg))
  .resize(1024, 724)
  .png()
  .toFile('public/images/plantillas-certificado/minimalista.png')

console.log('Thumbnail generado OK')
