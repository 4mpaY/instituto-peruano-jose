'use client'

import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'

interface KpiCardProps {
  icon: string
  label: string
  value: number
  color: string
  bgColor: string
  loading?: boolean
}

const StyledCard = styled(Card)(() => ({
  borderRadius: '16px',
  border: 'none',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
  }
}))

export default function KpiCard({ icon, label, value, color, bgColor, loading }: KpiCardProps) {
  return (
    <StyledCard>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant='caption'
              sx={{
                fontWeight: 700,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontSize: '0.7rem'
              }}
            >
              {label}
            </Typography>
            {loading ? (
              <Skeleton variant='text' width={60} height={44} />
            ) : (
              <Typography
                variant='h3'
                sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1.1, mt: 0.5 }}
              >
                {value}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '14px',
              bgcolor: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <i className={icon} style={{ fontSize: 26, color }} />
          </Box>
        </Box>
      </CardContent>
    </StyledCard>
  )
}
