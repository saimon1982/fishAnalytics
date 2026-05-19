import { Alert, Box, Button, CircularProgress, Container, Paper, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AUTH_ERROR_STORAGE_KEY = 'fish-analytics-auth-error'

export function LoginPage() {
  const { t } = useTranslation('auth')
  const { loginWithGoogle, loading, user } = useAuth()
  const authErrorCode = useAuthStore((state) => state.authErrorCode)
  const setAuthErrorCode = useAuthStore((state) => state.setAuthErrorCode)
  const navigate = useNavigate()
  const [loginRequested, setLoginRequested] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const isSigningIn = loginRequested

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    if (!loading) {
      setLoginRequested(false)
    }
  }, [loading])

  useEffect(() => {
    const code = authErrorCode ?? window.localStorage.getItem(AUTH_ERROR_STORAGE_KEY)
    if (!code) {
      return
    }

    if (code === 'auth/user-not-whitelisted') {
      setAuthError(t('errorNotWhitelisted'))
    } else if (code === 'auth/popup-closed-by-user') {
      setAuthError(t('errorPopupClosed'))
    } else if (code === 'auth/unauthorized-domain') {
      setAuthError(t('errorUnauthorizedDomain'))
    } else if (code === 'auth/operation-not-allowed') {
      setAuthError(t('errorOperationNotAllowed'))
    } else {
      setAuthError(`${t('errorGeneric')} (${code})`)
    }

    window.localStorage.removeItem(AUTH_ERROR_STORAGE_KEY)
  }, [authErrorCode, t])

  const handleLoginClick = async () => {
    if (loginRequested || loading) return
    setAuthErrorCode(null)
    window.localStorage.removeItem(AUTH_ERROR_STORAGE_KEY)
    setAuthError(null)
    setLoginRequested(true)
    try {
      await loginWithGoogle()
    } catch (error) {
      const code = (error as { code?: string })?.code
      if (code === 'auth/user-not-whitelisted') {
        setAuthError(t('errorNotWhitelisted'))
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError(t('errorPopupClosed'))
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError(t('errorUnauthorizedDomain'))
      } else if (code === 'auth/operation-not-allowed') {
        setAuthError(t('errorOperationNotAllowed'))
      } else {
        setAuthError(`${t('errorGeneric')} ${code ? `(${code})` : ''}`.trim())
      }
    } finally {
      setLoginRequested(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1565C0 0%, #00897B 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
          <Box sx={{ fontSize: 64, mb: 2 }}>🎣</Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            {t('loginTitle')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {t('loginSubtitle')}
          </Typography>
          {authError && <Alert severity="error" sx={{ mb: 2 }}>{authError}</Alert>}
          <Button
            variant="contained"
            size="large"
            onClick={handleLoginClick}
            disabled={isSigningIn}
            startIcon={isSigningIn ? <CircularProgress size={20} color="inherit" /> : undefined}
            sx={{ px: 4, py: 1.5 }}
          >
            {isSigningIn ? t('loggingIn') : t('loginWith')}
          </Button>
          {loading && !isSigningIn && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              Controllo sessione in corso...
            </Typography>
          )}
        </Paper>
      </Container>
    </Box>
  )
}
