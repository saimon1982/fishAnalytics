import { Routes, Route, Navigate } from 'react-router-dom'
import { RequireAuth } from './modules/auth/components/RequireAuth'
import { LoginPage } from './modules/auth/components/LoginPage'
import { AppLayout } from './modules/shared/components/AppLayout'
import { CatchesPage } from './modules/catches/components/CatchesPage'
import { DashboardPage } from './modules/dashboard/components/DashboardPage'
import { SearchPage } from './modules/search/components/SearchPage'
import { SettingsPage } from './modules/auth/components/SettingsPage'
import { useAuth } from './modules/auth/hooks/useAuth'

function App() {
  const { user } = useAuth() // triggers onAuthStateChanged globally
  const uid = user?.uid ?? ''

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppLayout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage uid={uid} />} />
                  <Route path="/catches" element={<CatchesPage uid={uid} />} />
                  <Route path="/search" element={<SearchPage uid={uid} />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AppLayout>
            </RequireAuth>
          }
        />
      </Routes>
    </>
  )
}

export default App
