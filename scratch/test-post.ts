import { POST } from '../src/app/api/usuarios/route'
import prisma from '../src/utils/libs/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret'

async function test() {
  console.log('--- starting post test ---')
  // 1. Find an admin user
  const admin = await prisma.usuario.findFirst({
    where: { rol: 'ADMIN' }
  })
  
  if (!admin) {
    console.error('No admin user found in database!')
    return
  }

  console.log('Using Admin user:', admin.correo)

  // 2. Sign token
  const token = jwt.sign(
    {
      id: admin.id,
      email: admin.correo,
      name: admin.nombre,
      rol: admin.rol,
      esta_activo: admin.esta_activo
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  )

  // 3. Construct mock Request
  const body = {
    correo: 'jose_test@gmail.com',
    contrasena: 'Jose123@',
    nombre: 'jose',
    apellido: 'sd',
    numero_documento: '77777777',
    celular: '930920521',
    rol: 'ESTUDIANTE',
    biografia: 'asd'
  }

  // Next.js standard Request implementation inside node environment (using absolute URL)
  const req = new Request('http://localhost:3000/api/usuarios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  })

  // 4. Invoke POST handler
  console.log('Invoking POST route handler...')
  try {
    const response = await POST(req)
    console.log('POST status:', response.status)
    const json = await response.json()
    console.log('POST response body:', JSON.stringify(json, null, 2))
  } catch (err) {
    console.error('POST invocation crashed:', err)
  }
}

test()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
