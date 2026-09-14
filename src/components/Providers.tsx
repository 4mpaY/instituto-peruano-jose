// Type Imports
import type { Session } from 'next-auth'

import type { ChildrenType, Direction } from '@core/types'

// Context Imports
import { ConfigProvider } from '@/contexts/ConfigContext'
import { NextAuthProvider } from '@/contexts/nextAuthProvider'
import { ReactQueryProvider } from '@/components/ReactQueryProvider'
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'

// Util Imports
import { getDemoName, getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'

import { CartProvider } from '@/features/web/cart/context/CartContext'
import CartDrawer from '@/features/web/cart/components/CartDrawer'
import SessionExpiredWatcher from '@/components/SessionExpiredWatcher'

type Props = ChildrenType & {
    direction?: Direction
    session: Session | null
    configs?: Record<string, string>
}

export const Providers = (props: Props) => {
    // Props
    const { children, direction = 'ltr', session, configs = {} } = props

    // Vars
    const mode = getMode()
    const settingsCookie = getSettingsFromCookie()
    const demoName = getDemoName()
    const systemMode = getSystemMode()

    // Override settings with DB primary color, ignoring any local cookie values to enforce global branding
    const primaryColor = configs.PRIMARY_COLOR_MAIN || '#131FF2'

    const settings = {
        ...settingsCookie,
        primaryColor
    }

    return (
        <ConfigProvider configs={configs}>
            <NextAuthProvider session={session}>
                <ReactQueryProvider>
                    <SessionExpiredWatcher />
                    <VerticalNavProvider>
                        <SettingsProvider settingsCookie={settings} mode={mode} demoName={demoName}>
                            <ThemeProvider direction={direction} systemMode={systemMode}>
                                <CartProvider>
                                    {children}
                                    <CartDrawer />
                                </CartProvider>
                            </ThemeProvider>
                        </SettingsProvider>
                    </VerticalNavProvider>
                </ReactQueryProvider>
            </NextAuthProvider>
        </ConfigProvider>
    )
}
