import {
  Avatar, Box, Button, Card, CardContent, CircularProgress,
  Divider, MenuItem, TextField, Typography,
} from "@mui/material"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/modules/auth/hooks/useAuth"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/config/firebase"
import { useState } from "react"
import { useAuthStore } from "../store/authStore"
import type { AppLanguage } from "@/types/domain"
import i18n from "@/i18n"

export function SettingsPage() {
  const { t: tc } = useTranslation("common")
  const { t: ta } = useTranslation("auth")
  const { user, logout } = useAuth()
  const setUser = useAuthStore((s) => s.setUser)
  const [saving, setSaving] = useState(false)

  if (!user) return <CircularProgress />
  const currentUser = user

  const handleLanguageChange = async (lang: AppLanguage) => {
    setSaving(true)
    await updateDoc(doc(db, "users", currentUser.uid), { language: lang })
    setUser({ ...currentUser, language: lang })
    await i18n.changeLanguage(lang)
    setSaving(false)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, display: "block" }}>
        {tc("settings")}
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Avatar src={currentUser.photoURL ?? undefined} sx={{ width: 56, height: 56 }}>
              {currentUser.displayName[0]}
            </Avatar>
            <Box>
              <Typography variant="h6">{currentUser.displayName}</Typography>
              <Typography variant="body2" color="text.secondary">{currentUser.email}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            {tc("language")}
          </Typography>
          <TextField
            select
            value={currentUser.language}
            onChange={(e) => handleLanguageChange(e.target.value as AppLanguage)}
            disabled={saving}
            fullWidth
            size="small"
          >
            <MenuItem value="it">Italiano</MenuItem>
            <MenuItem value="en">English</MenuItem>
          </TextField>
        </CardContent>
      </Card>
      <Divider sx={{ my: 2 }} />
      <Button variant="outlined" color="error" onClick={logout}>{tc("logout")}</Button>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 4, display: "block" }}>
        {ta("logoutConfirm")}
      </Typography>
    </Box>
  )
}
