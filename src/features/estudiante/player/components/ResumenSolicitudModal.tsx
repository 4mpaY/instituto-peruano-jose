import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  Divider,
} from '@mui/material'

import HydratedDate from '@/utils/components/HydratedDate'

export interface SolicitudData {
  pedidoId: string
  numeroPedido: number
  certificadoTipo: string
  total: number
  creadoEn: Date | string
  tieneComprobante: boolean
  etiquetaEntrega: string
  disponibleDesde: Date | string | null
  nombreTipo: string
  comprobanteUrl: string | null
  numeroComprobante: string | null
  referenciaPago: string | null
  estado: string
}

interface ResumenSolicitudModalProps {
  open: boolean
  onClose: () => void
  solicitud: SolicitudData | null
  cursoTitulo: string | null
  notaFinal: number | null
  usuarioDatosEnvio: {
    nombre: string
    apellido: string
    tipo_documento: string
    numero_documento: string
    celular: string
  } | null
}

export function ResumenSolicitudModal({
  open,
  onClose,
  solicitud,
  cursoTitulo,
  notaFinal,
  usuarioDatosEnvio,
}: ResumenSolicitudModalProps) {
  if (!solicitud) return null

  const vouchers = solicitud.comprobanteUrl ? solicitud.comprobanteUrl.split(',') : []

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Resumen de Solicitud</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* Datos del Participante */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'primary.main' }}>
              Datos del Participante
            </Typography>
            <Typography variant="body2">
              <strong>Nombre completo:</strong> {usuarioDatosEnvio?.nombre} {usuarioDatosEnvio?.apellido}
            </Typography>
            <Typography variant="body2">
              <strong>{usuarioDatosEnvio?.tipo_documento || 'Documento'}:</strong> {usuarioDatosEnvio?.numero_documento}
            </Typography>
            <Typography variant="body2">
              <strong>Celular:</strong> {usuarioDatosEnvio?.celular || 'No registrado'}
            </Typography>
          </Box>

          <Divider />

          {/* Datos del Curso */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'primary.main' }}>
              Datos del Curso
            </Typography>
            <Typography variant="body2">
              <strong>Curso:</strong> {cursoTitulo}
            </Typography>
            <Typography variant="body2">
              <strong>Promedio obtenido:</strong> {notaFinal != null ? `${Number(notaFinal).toFixed(2).replace(/\.00$/, '')} / 20` : 'N/A'}
            </Typography>
          </Box>

          <Divider />

          {/* Detalles del Pedido */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'primary.main' }}>
              Detalles del Pedido
            </Typography>
            <Typography variant="body2">
              <strong>N° Pedido:</strong> #{solicitud.numeroPedido.toString().padStart(5, '0')}
            </Typography>
            <Typography variant="body2">
              <strong>Tipo de certificado:</strong> {solicitud.nombreTipo}
            </Typography>
            <Typography variant="body2">
              <strong>Fecha de solicitud:</strong>{' '}
              <HydratedDate date={solicitud.creadoEn} options={{ dateStyle: 'long', timeStyle: 'short' }} />
            </Typography>
            <Typography variant="body2">
              <strong>Estado del pedido:</strong> {solicitud.estado === 'COMPLETADO' ? 'Validado / En Espera' : solicitud.estado === 'PENDIENTE' ? 'Pendiente de Validación' : solicitud.estado}
            </Typography>
            {solicitud.numeroComprobante && (
              <Typography variant="body2">
                <strong>N° de Operación:</strong> {solicitud.numeroComprobante}
              </Typography>
            )}
          </Box>

          <Divider />

          {/* Comprobantes adjuntos */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'primary.main' }}>
              Comprobante(s) Adjunto(s)
            </Typography>
            {vouchers.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {vouchers.map((url, idx) => (
                  <Box
                    key={idx}
                    component="a"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'block',
                    }}
                  >
                    {url.toLowerCase().endsWith('.pdf') ? (
                      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
                         <i className="tabler-file-type-pdf" style={{ fontSize: 24, color: '#ef4444' }} />
                         <Typography variant="caption" sx={{ mt: 0.5, fontSize: '0.65rem' }}>PDF</Typography>
                      </Box>
                    ) : (
                      <img src={url} alt={`Comprobante ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay comprobantes adjuntos
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ fontWeight: 700 }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
