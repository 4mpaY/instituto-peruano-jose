'use client'

// React Imports
import { useEffect, useRef } from 'react'

// Next Imports
// import Img from 'next/image'
import Link from 'next/link'

// Third-party Imports
import styled from '@emotion/styled'

// Type Imports
import type { VerticalNavContextProps } from '@menu/contexts/verticalNavContext'

// Component Imports
// import VuexyLogo from '@core/svg/Logo'

// Config Imports
import themeConfig from '@/utils/configs/themeConfig'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'
import { useConfig } from '@/contexts/ConfigContext'

const montserrat = { className: 'font-montserrat' }

type LogoTextProps = {
  isHovered?: VerticalNavContextProps['isHovered']
  isCollapsed?: VerticalNavContextProps['isCollapsed']
  transitionDuration?: VerticalNavContextProps['transitionDuration']
}

const LogoText = styled.span<LogoTextProps>`
  font-size: 1.25rem;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: var(--mui-palette-primary-main);
  display: flex;
  justify-content: space-between;
  inline-size: 100%;
  transition: ${({ transitionDuration }) =>
    `margin-inline-start ${transitionDuration}ms ease-in-out, opacity ${transitionDuration}ms ease-in-out`};

  ${({ isHovered, isCollapsed }) =>
    isCollapsed && !isHovered ? 'opacity: 0; margin-inline-start: 0;' : 'opacity: 1; margin-inline-start: 10px;'}
`

const SloganText = styled.span<LogoTextProps>`
  font-size: 0.55rem;
  line-height: 1.5;
  font-weight: 400;
  color: var(--mui-palette-primary-main);
  text-transform: uppercase;
  white-space: nowrap;
  transition: ${({ transitionDuration }) =>
    `margin-inline-start ${transitionDuration}ms ease-in-out, opacity ${transitionDuration}ms ease-in-out`};

  ${({ isHovered, isCollapsed }) =>
    isCollapsed && !isHovered ? 'opacity: 0; margin-inline-start: 0;' : 'opacity: 1; margin-inline-start: 10px;'}
`

const Logo = () => {
  // Refs
  const logoTextRef = useRef<HTMLDivElement>(null)

  // Hooks
  const { isHovered, transitionDuration } = useVerticalNav()
  const { settings } = useSettings()
  const configs = useConfig()

  // Vars
  const { layout } = settings
  
  const templateLogo = configs.TEMPLATE_LOGO || themeConfig.templateLogo
  const templateName = configs.TEMPLATE_NAME || themeConfig.templateName
  const templateSlogan = configs.TEMPLATE_SLOGAN || themeConfig.templateSlogan

  useEffect(() => {
    if (layout !== 'collapsed') {
      return
    }

    if (logoTextRef && logoTextRef.current) {
      if (layout === 'collapsed' && !isHovered) {
        logoTextRef.current?.classList.add('hidden')
      } else {
        logoTextRef.current.classList.remove('hidden')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered, layout])

  return (
    <Link href='/' className='flex items-center'>
      <img src={templateLogo} alt={`${templateName} Logo`} className='bs-[46px]' />
      <div
        className={`flex flex-col ${montserrat.className}`}
        ref={logoTextRef}
      >
        <LogoText
          isHovered={isHovered}
          isCollapsed={layout === 'collapsed'}
          transitionDuration={transitionDuration}
        >
          {templateName.split('').map((char: string, index: number) => (
            <span key={index}>{char}</span>
          ))}
        </LogoText>
        {templateSlogan && (
          <SloganText
            isHovered={isHovered}
            isCollapsed={layout === 'collapsed'}
            transitionDuration={transitionDuration}
          >
            {templateSlogan}
          </SloganText>
        )}
      </div>
    </Link>
  )
}

export default Logo
