import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Chip,
    IconButton,
    Tooltip,
    Divider,
    Link,
} from '@mui/material';
import {
    Key as KeyIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    ContentCopy as CopyIcon,
    Refresh as RefreshIcon,
    LockOpen as UnlockIcon,
} from '@mui/icons-material';
import { useLicense } from '../hooks/useLicense';

interface LicenseDialogProps {
    open: boolean;
    onClose: () => void;
}

const LicenseDialog: React.FC<LicenseDialogProps> = ({ open, onClose }) => {
    const {
        licenseInfo,
        isLoading,
        error,
        isPro,
        activateLicense,
        deactivateLicense,
        getMachineId,
        checkLicenseStatus,
    } = useLicense();

    const [licenseKey, setLicenseKey] = useState('');
    const [machineId, setMachineId] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Load machine ID when dialog opens
    React.useEffect(() => {
        if (open) {
            getMachineId().then(setMachineId);
        }
    }, [open, getMachineId]);

    const handleActivate = async () => {
        if (!licenseKey.trim()) {
            setLocalError('Lütfen lisans anahtarını girin');
            return;
        }

        setLocalError(null);
        setSuccessMessage(null);

        const result = await activateLicense(licenseKey.trim());

        if (result.success) {
            setSuccessMessage('Lisans başarıyla aktifleştirildi! 🎉');
            setLicenseKey('');
        } else {
            setLocalError(result.error || 'Aktivasyon başarısız');
        }
    };

    const handleDeactivate = async () => {
        const confirmed = window.confirm(
            'Bu cihazdan lisansı kaldırmak istediğinizden emin misiniz?'
        );

        if (confirmed) {
            setLocalError(null);
            setSuccessMessage(null);

            const success = await deactivateLicense();

            if (success) {
                setSuccessMessage('Lisans başarıyla kaldırıldı');
            } else {
                setLocalError('Lisans kaldırılamadı');
            }
        }
    };

    const copyMachineId = () => {
        if (machineId) {
            navigator.clipboard.writeText(machineId);
        }
    };

    const displayError = localError || error;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <KeyIcon color="primary" />
                <Typography variant="h6">Lisans Yönetimi</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title="Durumu yenile">
                    <IconButton onClick={checkLicenseStatus} size="small">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </DialogTitle>

            <DialogContent dividers>
                {/* Current Status */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Mevcut Durum
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isPro ? (
                            <>
                                <CheckCircleIcon color="success" />
                                <Chip
                                    label="PRO"
                                    color="success"
                                    size="small"
                                    sx={{ fontWeight: 'bold' }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    Tüm özellikler aktif
                                </Typography>
                            </>
                        ) : (
                            <>
                                <ErrorIcon color="warning" />
                                <Chip
                                    label="FREE"
                                    color="warning"
                                    size="small"
                                />
                                <Typography variant="body2" color="text.secondary">
                                    Sınırlı özellikler
                                </Typography>
                            </>
                        )}
                    </Box>

                    {licenseInfo.activatedAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Aktifleştirildi: {new Date(licenseInfo.activatedAt).toLocaleDateString('tr-TR')}
                        </Typography>
                    )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Alerts */}
                {displayError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {displayError}
                    </Alert>
                )}

                {successMessage && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {successMessage}
                    </Alert>
                )}

                {/* Activation Form */}
                {!isPro && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Lisans Anahtarı
                        </Typography>
                        <TextField
                            fullWidth
                            placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                            value={licenseKey}
                            onChange={(e) => setLicenseKey(e.target.value)}
                            disabled={isLoading}
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: <KeyIcon color="action" sx={{ mr: 1 }} />,
                            }}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={handleActivate}
                            disabled={isLoading || !licenseKey.trim()}
                            startIcon={isLoading ? <CircularProgress size={20} /> : <UnlockIcon />}
                        >
                            {isLoading ? 'Aktifleştiriliyor...' : 'Lisansı Aktifleştir'}
                        </Button>

                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Lisansınız yok mu?{' '}
                                <Link
                                    href="https://subcio.lemonsqueezy.com"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    Pro sürümü satın alın
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* Deactivation for Pro users */}
                {isPro && (
                    <Box sx={{ mb: 3 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Pro sürüm aktif. Tüm özellikler kullanılabilir.
                        </Alert>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleDeactivate}
                            disabled={isLoading}
                            startIcon={isLoading ? <CircularProgress size={20} /> : null}
                        >
                            Bu Cihazdan Kaldır
                        </Button>
                    </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Machine ID (for support) */}
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Cihaz Kimliği (Destek için)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                            fullWidth
                            value={machineId || 'Yükleniyor...'}
                            disabled
                            size="small"
                            InputProps={{
                                sx: { fontFamily: 'monospace', fontSize: '0.8rem' }
                            }}
                        />
                        <Tooltip title="Kopyala">
                            <IconButton onClick={copyMachineId} size="small">
                                <CopyIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Kapat</Button>
            </DialogActions>
        </Dialog>
    );
};

export default LicenseDialog;
