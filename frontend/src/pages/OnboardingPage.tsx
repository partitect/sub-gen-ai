/**
 * Onboarding Page - First Launch Model Download
 * 
 * Shows when user first launches the app and needs to download the AI model.
 * Features rotating tips to keep user engaged during download.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    Typography,
    LinearProgress,
    Stack,
    alpha,
    useTheme,
    Button,
    Fade,
} from "@mui/material";
import { Sparkles, Download, CheckCircle, AlertCircle, Cpu, Zap, Globe, Palette } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Feature tips to show during download
const FEATURES = [
    { icon: Zap, title: "Lightning Fast", desc: "AI-powered transcription in seconds" },
    { icon: Globe, title: "50+ Languages", desc: "Automatic language detection" },
    { icon: Palette, title: "Custom Styles", desc: "Beautiful subtitle presets" },
    { icon: Sparkles, title: "One-Click Export", desc: "Multiple formats supported" },
];

export default function OnboardingPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const [status, setStatus] = useState<"checking" | "downloading" | "complete" | "error">("checking");
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("Checking AI model...");
    const [featureIndex, setFeatureIndex] = useState(0);

    // Rotate features every 3 seconds
    useEffect(() => {
        if (status === "downloading") {
            const interval = setInterval(() => {
                setFeatureIndex((prev) => (prev + 1) % FEATURES.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [status]);

    useEffect(() => {
        checkAndDownloadModel();
    }, []);

    const checkAndDownloadModel = async () => {
        try {
            const statusRes = await fetch(`${API_BASE}/model/status`);
            const statusData = await statusRes.json();

            if (statusData.ready) {
                setStatus("complete");
                setProgress(100);
                setMessage("AI model ready!");
                setTimeout(() => navigate("/dashboard"), 1000);
                return;
            }

            setStatus("downloading");
            setMessage("Starting download...");

            const response = await fetch(`${API_BASE}/model/download`, { method: "POST" });
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("Failed to start download");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split("\n").filter(line => line.startsWith("data: "));

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.replace("data: ", ""));
                        setProgress(data.progress || 0);
                        setMessage(data.message || "Downloading...");

                        if (data.status === "complete") {
                            setStatus("complete");
                            setTimeout(() => navigate("/dashboard"), 1000);
                        } else if (data.status === "error") {
                            setStatus("error");
                            setMessage(data.message || "Download failed");
                        }
                    } catch (e) { /* ignore */ }
                }
            }
        } catch (error) {
            console.error("Model download error:", error);
            setStatus("error");
            setMessage("Failed to download. Check your internet connection.");
        }
    };

    const getIcon = () => {
        switch (status) {
            case "checking": return <Cpu size={48} />;
            case "downloading": return <Download size={48} className="animate-bounce" />;
            case "complete": return <CheckCircle size={48} />;
            case "error": return <AlertCircle size={48} />;
        }
    };

    const getColor = () => {
        switch (status) {
            case "complete": return theme.palette.success.main;
            case "error": return theme.palette.error.main;
            default: return theme.palette.primary.main;
        }
    };

    const CurrentFeature = FEATURES[featureIndex];

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.default",
                background: isDark
                    ? "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.12), transparent 60%)"
                    : "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.06), transparent 60%)",
            }}
        >
            <Container maxWidth="sm">
                <Stack spacing={4} alignItems="center" textAlign="center">
                    {/* Logo */}
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Sparkles size={28} color={theme.palette.primary.main} />
                        <Typography variant="h5" fontWeight={800}>Subcio</Typography>
                    </Stack>

                    {/* Animated Icon */}
                    <Box
                        sx={{
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: alpha(getColor(), 0.1),
                            color: getColor(),
                            transition: "all 0.3s ease",
                            animation: status === "downloading" ? "pulse 2s infinite" : "none",
                            "@keyframes pulse": {
                                "0%, 100%": { transform: "scale(1)", opacity: 1 },
                                "50%": { transform: "scale(1.05)", opacity: 0.8 },
                            },
                        }}
                    >
                        {getIcon()}
                    </Box>

                    {/* Title */}
                    <Typography variant="h5" fontWeight={700}>
                        {status === "checking" && "Preparing AI Engine..."}
                        {status === "downloading" && "Downloading AI Model"}
                        {status === "complete" && "Ready to Go!"}
                        {status === "error" && "Download Failed"}
                    </Typography>

                    {/* Message with progress details */}
                    <Typography variant="body1" color="text.secondary" sx={{ minHeight: 24 }}>
                        {message}
                    </Typography>

                    {/* Progress Bar */}
                    {(status === "downloading" || status === "checking") && (
                        <Box sx={{ width: "100%" }}>
                            <LinearProgress
                                variant={progress > 0 ? "determinate" : "indeterminate"}
                                value={progress}
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    "& .MuiLinearProgress-bar": {
                                        borderRadius: 5,
                                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    },
                                }}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {progress > 0 ? `${progress}%` : "Connecting..."}
                            </Typography>
                        </Box>
                    )}

                    {/* Feature Showcase - Rotating Tips */}
                    {status === "downloading" && (
                        <Fade in key={featureIndex} timeout={500}>
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                    minHeight: 100,
                                    width: "100%",
                                }}
                            >
                                <Stack spacing={1} alignItems="center">
                                    <CurrentFeature.icon size={28} color={theme.palette.primary.main} />
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        {CurrentFeature.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {CurrentFeature.desc}
                                    </Typography>
                                </Stack>
                            </Box>
                        </Fade>
                    )}

                    {/* Retry Button */}
                    {status === "error" && (
                        <Button
                            variant="contained"
                            onClick={checkAndDownloadModel}
                            startIcon={<Download size={18} />}
                            sx={{ px: 4 }}
                        >
                            Retry Download
                        </Button>
                    )}

                    {/* One-time info */}
                    {status === "downloading" && (
                        <Typography variant="caption" color="text.disabled" sx={{ maxWidth: 350 }}>
                            One-time download • AI runs locally on your device
                        </Typography>
                    )}
                </Stack>
            </Container>
        </Box>
    );
}
