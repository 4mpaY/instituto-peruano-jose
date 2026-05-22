import React from 'react'

import { Box, Container, Typography, Divider } from '@mui/material'

export const metadata = {
  title: 'Política de Cambios y Devoluciones | ARM Asset Reliability Management',
}

export default function PoliticaCambiosYDevolucionesPage() {
  return (
    <Box sx={{ bgcolor: 'white', py: { xs: 6, md: 10 }, color: '#333' }}>
      <Container maxWidth="md">
        <Typography variant="h3" fontWeight={900} sx={{ color: 'var(--web-dark, #025E44)' }} mb={2} textAlign="center">
          Política de Cambios y Devoluciones
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" mb={6}>
          Última actualización: Marzo de 2026
        </Typography>

        <Box sx={{ '& h4': { color: 'var(--web-dark, #025E44)', fontWeight: 800, mt: 5, mb: 2 }, '& p': { mb: 2, lineHeight: 1.8 } }}>

          <Typography paragraph>
            La presente política regula las condiciones de reembolso y cambios aplicables a los
            servicios educativos ofrecidos por <strong>[NOMBRE DE EMPRESA]</strong>,
            con RUC <strong>[RUC]</strong>, con domicilio en [DIRECCIÓN] — a través de su Aula Virtual. Al adquirir cualquier curso,
            el usuario declara haber leído y aceptado los términos aquí descritos.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h4">1. Naturaleza del Servicio</Typography>
          <Typography paragraph>
            Los cursos y materiales ofrecidos en nuestra plataforma constituyen <strong>contenido digital de ejecución inmediata</strong>.
            Esto implica que el servicio educativo se activa y se considera prestado desde el momento en que el
            usuario realiza su primer acceso a la plataforma, visualiza la primera lección o descarga cualquier
            material complementario del curso adquirido.
          </Typography>

          <Typography variant="h4">2. Excepción por Contenido Digital — Cláusula de Ejecución Inmediata</Typography>
          <Typography paragraph>
            De conformidad con el <strong>Código de Protección y Defensa del Consumidor (Ley N° 29571)</strong> y
            las disposiciones de <strong>INDECOPI</strong> sobre contratos a distancia y servicios de ejecución inmediata:
          </Typography>
          <Typography paragraph>
            El usuario reconoce expresamente que, al realizar el primer inicio de sesión, visualizar la primera
            lección o descargar cualquier material del curso, otorga su <strong>consentimiento expreso para el inicio
              inmediato de la prestación del servicio</strong>, renunciando con ello a su derecho de arrepentimiento
            o solicitud de reembolso, dado que el servicio se considera consumido desde el inicio de su ejecución.
          </Typography>
          <Typography paragraph>
            Esta condición es aplicable a todos los cursos, rutas de aprendizaje, paquetes y materiales
            digitales disponibles en la plataforma.
          </Typography>

          <Typography variant="h4">3. Condiciones para Solicitar Reembolso</Typography>
          <Typography paragraph>
            El usuario podrá solicitar el reembolso total de su compra únicamente bajo las siguientes condiciones:
          </Typography>
          <Typography paragraph>
            <strong>a) Antes del primer acceso:</strong> Que el usuario no haya ingresado a la plataforma ni
            visualizado contenido alguno tras la compra. El plazo máximo para esta solicitud es de{' '}
            <strong>7 días calendario</strong> desde la fecha de pago confirmado.
          </Typography>
          <Typography paragraph>
            <strong>b) Falla técnica insubsanable:</strong> Si existe un error técnico atribuible a nuestra
            plataforma que impida el acceso al contenido, y que el equipo de soporte no pueda resolver en un plazo
            de <strong>72 horas hábiles</strong> desde la notificación formal del incidente.
          </Typography>

          <Typography variant="h4">4. Proceso de Solicitud de Reembolso</Typography>
          <Typography paragraph>
            Para iniciar un proceso de devolución (si aplica), el usuario debe:
          </Typography>
          <Typography paragraph>
            1. Enviar un correo a <strong>ipg.ingenieros.contacto@gmail.com</strong> con el asunto:{' '}
            <em>&quot;Solicitud de Reembolso — [Nombre del Curso]&quot;</em>.
          </Typography>
          <Typography paragraph>
            2. Adjuntar el comprobante de pago y número de pedido correspondiente.
          </Typography>
          <Typography paragraph>
            3. Nuestro equipo auditará los registros de acceso (logs de IP y actividad) para verificar que el
            contenido no haya sido consumido antes de proceder con la evaluación de la solicitud.
          </Typography>

          <Typography variant="h4">5. Modalidad de Reembolso</Typography>
          <Typography paragraph>
            Si la solicitud es aprobada, el reembolso se gestionará a través de la pasarela de pago <strong>Culqi</strong>.
            El tiempo de acreditación en la cuenta del cliente dependerá de su entidad bancaria, generalmente
            entre <strong>15 y 30 días hábiles</strong>.
          </Typography>
          <Typography paragraph>
            Visiona Perú Safety Solutions S.A.C se reserva el derecho de descontar las comisiones operativas
            cobradas por la pasarela de pago que no sean reembolsables por la misma.
          </Typography>

          <Typography variant="h4">6. Contacto y Atención al Cliente</Typography>
          <Typography paragraph>
            Para consultas relacionadas con esta política, comuníquese con nosotros a través de{' '}
            <strong>ipg.ingenieros.contacto@gmail.com</strong>. De acuerdo con la legislación de protección
            al consumidor vigente, también ponemos a su disposición nuestro{' '}
            <a href="/libro-de-reclamaciones" style={{ color: 'var(--web-dark, #025E44)', textDecoration: 'underline' }}>
              Libro de Reclamaciones
            </a>{' '}
            en la plataforma.
          </Typography>

        </Box>
      </Container>
    </Box>
  )
}
