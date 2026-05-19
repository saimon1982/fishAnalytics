import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Avatar, Box, Drawer, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Menu, MenuItem, BottomNavigation,
  BottomNavigationAction, Toolbar, Typography, useMediaQuery, useTheme, Divider,
} from '@mui/material'
import { Dashboard, Search, Menu as MenuIcon, Settings } from '@mui/icons-material'
import SetMeal from '@mui/icons-material/SetMeal'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/modules/auth/hooks/useAuth'

const DRAWER_WIDTH = 240

const navItems = [
  { path: '/dashboard', icon: <Dashboard />, key: 'dashboard' },
  { path: '/catches', icon: <SetMeal />, key: 'catches' },
  { path: '/search', icon: <Search />, key: 'search' },
  { path: '/settings', icon: <Settings />, key: 'settings' },
]

interface Props {
  children: React.ReactNode
}

export function AppLayout({ children }: Props) {
  const { t: tc } = useTranslation('common')
  const { t: td } = useTranslation('dashboard')
  const { t: tcat } = useTranslation('catches')
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)

  const getLabel = (key: string) => {
    if (key === 'dashboard') return td('title')
    if (key === 'catches') return tcat('title')
    if (key === 'search') return tc('search')
    return tc('settings')
  }

  const drawerContent = (
    <Box>
      <Toolbar>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>🎣 Fish Analytics</Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname.startsWith(item.path)}
            onClick={() => { navigate(item.path); setMobileOpen(false) }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={getLabel(item.key)} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )

  const activeIndex = navItems.findIndex((n) => location.pathname.startsWith(n.path))

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" elevation={1} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {!isMobile && '🎣 '}Fish Analytics
          </Typography>
          <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)}>
            <Avatar src={user?.photoURL ?? undefined} sx={{ width: 32, height: 32 }}>
              {user?.displayName?.[0]}
            </Avatar>
          </IconButton>
          <Menu anchorEl={profileAnchor} open={!!profileAnchor} onClose={() => setProfileAnchor(null)}>
            <MenuItem disabled><Typography variant="body2">{user?.displayName}</Typography></MenuItem>
            <MenuItem disabled><Typography variant="caption">{user?.email}</Typography></MenuItem>
            <Divider />
            <MenuItem onClick={() => { navigate('/settings'); setProfileAnchor(null) }}>{tc('settings')}</MenuItem>
            <MenuItem onClick={() => { logout(); setProfileAnchor(null) }}>{tc('logout')}</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {!isMobile && (
        <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
          {drawerContent}
        </Drawer>
      )}

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { sm: `${DRAWER_WIDTH}px` },
          mt: '64px',
          mb: isMobile ? '56px' : 0,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>

      {isMobile && (
        <BottomNavigation
          value={activeIndex}
          onChange={(_, v) => navigate(navItems[v].path)}
          sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, borderTop: '1px solid #e0e0e0' }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction key={item.path} label={getLabel(item.key)} icon={item.icon} />
          ))}
        </BottomNavigation>
      )}
    </Box>
  )
}
