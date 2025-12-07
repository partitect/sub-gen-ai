
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Chip,
  alpha,
  useTheme,
  Button,
  Stack,
  IconButton,
} from "@mui/material";
import {
  Palette,
  Globe,
  ArrowLeft,
  Database,
  Trash2,
  HardDrive,
  Key,
  Shield,
  Settings,
} from "lucide-react";
import { useTheme as useAppTheme } from "../ThemeContext";
import { useSettings } from "../contexts/SettingsContext";
import { useLicenseContext } from "../contexts/LicenseContext";
import axios from "axios";
import { useEffect } from "react";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function SettingsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useAppTheme();
  const { settings, updateSettings } = useSettings();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('subcio_language', lang);
    updateSettings({ language: lang });
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  const [models, setModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const res = await axios.get(`${API_BASE}/models`);
      if (res.data.models) {
        setModels(res.data.models);
      }
    } catch (err) {
      console.error("Failed to fetch models", err);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!window.confirm(t('settings.models.confirm_delete') || `Delete model ${modelId}?`)) return;

    try {
      await axios.delete(`${API_BASE}/models/${modelId}`);
      setModels(prev => prev.filter(m => m.id !== modelId));
    } catch (err) {
      console.error("Failed to delete model", err);
      alert("Failed to delete model");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: isDark ? "grey.900" : "grey.50",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowLeft />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {t('settings.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('settings.subtitle')}
            </Typography>
          </Box>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            overflow: "hidden",
            bgcolor: "background.paper",
          }}
        >
          <List sx={{ p: 2 }}>
            {/* License Management */}
            <LicenseSection />

            {/* Admin Panel Link - Only for Super Admins */}
            <AdminSection />
            {/* Theme */}
            <ListItem
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
                mb: 2,
                p: 2,
              }}
            >
              <ListItemIcon>
                <Palette size={24} />
              </ListItemIcon>
              <ListItemText
                primary={t('settings.preferences.theme')}
                secondary={isDark ? t('settings.preferences.dark') : t('settings.preferences.light')}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              <Switch
                checked={isDark}
                onChange={toggleTheme}
                color="primary"
              />
            </ListItem>

            {/* Language */}
            <ListItem
              alignItems="flex-start"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
                mb: 2,
                p: 2,
                flexDirection: "column",
                gap: 2
              }}
            >
              <Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
                <ListItemIcon>
                  <Globe size={24} />
                </ListItemIcon>
                <ListItemText
                  primary={t('settings.preferences.language')}
                  secondary={languages.find(l => l.code === i18n.language)?.name || 'English'}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", ml: { xs: 0, sm: 7 } }}>
                {languages.map((lang) => (
                  <Chip
                    key={lang.code}
                    label={`${lang.flag} ${lang.name}`}
                    onClick={() => handleLanguageChange(lang.code)}
                    variant={i18n.language === lang.code ? "filled" : "outlined"}
                    color={i18n.language === lang.code ? "primary" : "default"}
                    sx={{ cursor: "pointer", borderRadius: 1 }}
                  />
                ))}
              </Box>
            </ListItem>

            {/* Model Management */}
            <ListItem
              alignItems="flex-start"
              sx={{
                bgcolor: alpha(theme.palette.warning.main, 0.05),
                borderRadius: 2,
                p: 2,
                flexDirection: "column",
                gap: 2
              }}
            >
              <Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
                <ListItemIcon>
                  <HardDrive size={24} />
                </ListItemIcon>
                <ListItemText
                  primary={t('settings.models.title') || "Whisper Models Storage"}
                  secondary={t('settings.models.desc') || "Manage downloaded AI models to free up disk space."}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
                <Button size="small" startIcon={<Database size={14} />} onClick={fetchModels}>
                  Refresh
                </Button>
              </Box>

              <Box sx={{ width: "100%", ml: { xs: 0, sm: 7 } }}>
                {!loadingModels && models.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No models downloaded yet.
                  </Typography>
                )}

                <Stack spacing={1}>
                  {models.map(model => (
                    <Box
                      key={model.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          ws-{model.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Size: {model.size} • Last modified: {new Date(model.created).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteModel(model.id)}
                        title="Delete Model"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </ListItem>

          </List>
        </Paper>
      </Container>
    </Box>
  );
}

// License Section Component
function LicenseSection() {
  const { isPro, isLoading } = useLicenseContext();
  const { t } = useTranslation();
  const theme = useTheme();

  const openLicenseDialog = () => {
    if ((window as any).openLicenseDialog) {
      (window as any).openLicenseDialog();
    }
  };

  return (
    <ListItem
      sx={{
        bgcolor: alpha(isPro ? theme.palette.success.main : theme.palette.warning.main, 0.1),
        borderRadius: 2,
        mb: 2,
        p: 2,
      }}
    >
      <ListItemIcon>
        <Key size={24} />
      </ListItemIcon>
      <ListItemText
        primary={t('settings.license.title') || "Lisans Yönetimi"}
        secondary={
          isLoading
            ? "Yükleniyor..."
            : isPro
              ? "Pro sürüm aktif ✓"
              : "Ücretsiz sürüm - Pro'ya yükseltin"
        }
        primaryTypographyProps={{ fontWeight: 600 }}
      />
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          label={isPro ? "PRO" : "FREE"}
          color={isPro ? "success" : "warning"}
          size="small"
          icon={isPro ? <Shield size={14} /> : undefined}
        />
        <Button
          variant={isPro ? "outlined" : "contained"}
          color={isPro ? "inherit" : "primary"}
          size="small"
          onClick={openLicenseDialog}
        >
          {isPro ? "Yönet" : "Aktifleştir"}
        </Button>
      </Stack>
    </ListItem>
  );
}

// Admin Section Component - Only visible for Super Admins
function AdminSection() {
  const { isSuperAdmin, isLoading } = useLicenseContext();
  const theme = useTheme();
  const navigate = useNavigate();

  // Don't show for non-super-admins
  if (isLoading || !isSuperAdmin) {
    return null;
  }

  return (
    <ListItem
      sx={{
        bgcolor: alpha(theme.palette.secondary.main, 0.1),
        borderRadius: 2,
        mb: 2,
        p: 2,
        cursor: "pointer",
        "&:hover": {
          bgcolor: alpha(theme.palette.secondary.main, 0.15),
        },
      }}
      onClick={() => navigate("/admin")}
    >
      <ListItemIcon>
        <Settings size={24} />
      </ListItemIcon>
      <ListItemText
        primary="Admin Panel"
        secondary="Preset yönetimi ve sistem ayarları"
        primaryTypographyProps={{ fontWeight: 600 }}
      />
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          label="SUPER ADMIN"
          color="secondary"
          size="small"
          icon={<Shield size={14} />}
        />
      </Stack>
    </ListItem>
  );
}
