import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Lock,
    Sparkles,
    Clock,
    Video,
    Palette,
    FileText,
    Wand2,
    Crown,
} from 'lucide-react';
import { PRO_FEATURE_LABELS } from '../config/tierConfig';

interface UpgradePromptProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    feature?: keyof typeof PRO_FEATURE_LABELS;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
    open,
    onClose,
    title = 'Pro Özellik',
    message = 'Bu özellik sadece Pro sürümde kullanılabilir.',
    feature,
}) => {
    const theme = useTheme();

    const openLicenseDialog = () => {
        onClose();
        if ((window as any).openLicenseDialog) {
            (window as any).openLicenseDialog();
        }
    };

    const openPurchasePage = () => {
        window.open('https://subcio.lemonsqueezy.com', '_blank');
    };

    const proFeatures = [
        { icon: <Clock size={18} />, text: PRO_FEATURE_LABELS.unlimitedDuration },
        { icon: <Sparkles size={18} />, text: PRO_FEATURE_LABELS.allEffects },
        { icon: <FileText size={18} />, text: PRO_FEATURE_LABELS.allFormats },
        { icon: <Video size={18} />, text: PRO_FEATURE_LABELS.hdExport },
        { icon: <Wand2 size={18} />, text: PRO_FEATURE_LABELS.noWatermark },
        { icon: <Palette size={18} />, text: PRO_FEATURE_LABELS.advancedStyles },
    ];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.95)} 0%, ${alpha('#1a1a2e', 0.98)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                }
            }}
        >
            <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 20px ${alpha(theme.palette.warning.main, 0.4)}`,
                        }}
                    >
                        <Crown size={32} color="white" />
                    </Box>
                </Box>
                <Typography variant="h5" fontWeight={700}>
                    {title}
                </Typography>
            </DialogTitle>

            <DialogContent>
                <Typography
                    variant="body1"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ mb: 3 }}
                >
                    {message}
                </Typography>

                <Box
                    sx={{
                        bgcolor: alpha(theme.palette.background.paper, 0.3),
                        borderRadius: 2,
                        p: 2,
                        mb: 2,
                    }}
                >
                    <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mb: 1 }}>
                        Pro Sürüm İle:
                    </Typography>
                    <List dense disablePadding>
                        {proFeatures.map((item, index) => (
                            <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 32, color: 'success.main' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>

                <Box
                    sx={{
                        textAlign: 'center',
                        p: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        borderRadius: 2,
                        border: `1px dashed ${alpha(theme.palette.success.main, 0.3)}`,
                    }}
                >
                    <Typography variant="h4" fontWeight={800} color="success.main">
                        $49
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Tek seferlik ödeme • Ömür boyu erişim
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1, gap: 1, justifyContent: 'center' }}>
                <Button onClick={onClose} variant="text" color="inherit">
                    Daha Sonra
                </Button>
                <Button
                    onClick={openLicenseDialog}
                    variant="outlined"
                    color="primary"
                >
                    Anahtarım Var
                </Button>
                <Button
                    onClick={openPurchasePage}
                    variant="contained"
                    color="warning"
                    startIcon={<Crown size={18} />}
                    sx={{
                        px: 3,
                        fontWeight: 600,
                        boxShadow: `0 4px 14px ${alpha(theme.palette.warning.main, 0.4)}`,
                    }}
                >
                    Pro'ya Yükselt
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UpgradePrompt;
