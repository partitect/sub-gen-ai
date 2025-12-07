import { Navigate, useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    Paper,
    Typography,
    Stack,
    IconButton,
    alpha,
    useTheme,
    Chip,
} from "@mui/material";
import { ArrowLeft, Shield, Settings } from "lucide-react";
import { useLicenseContext } from "../contexts/LicenseContext";
import { useTheme as useAppTheme } from "../ThemeContext";
import PresetEditor from "../components/PresetEditor";

export default function AdminPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { isDark } = useAppTheme();
    const { isSuperAdmin, isLoading } = useLicenseContext();

    // Wait for license check
    if (isLoading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isDark ? "grey.900" : "grey.50",
                }}
            >
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    // Redirect if not Super Admin
    if (!isSuperAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: isDark ? "grey.900" : "grey.50",
                py: 3,
            }}
        >
            <Container maxWidth="xl">
                {/* Header */}
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        bgcolor: "background.paper",
                        mb: 3,
                        p: 2,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <IconButton onClick={() => navigate(-1)}>
                            <ArrowLeft />
                        </IconButton>
                        <Box sx={{ flex: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Settings size={24} />
                                <Typography variant="h5" fontWeight={700}>
                                    Admin Panel
                                </Typography>
                                <Chip
                                    label="SUPER ADMIN"
                                    color="secondary"
                                    size="small"
                                    icon={<Shield size={14} />}
                                    sx={{ ml: 1 }}
                                />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                Preset yönetimi ve sistem ayarları
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>

                {/* Preset Editor */}
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        bgcolor: "background.paper",
                        p: 2,
                        minHeight: "70vh",
                    }}
                >
                    <PresetEditor />
                </Paper>
            </Container>
        </Box>
    );
}
