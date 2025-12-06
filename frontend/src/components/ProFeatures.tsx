import React, { useState } from 'react';
import { Box, Chip, Tooltip, IconButton, alpha, useTheme } from '@mui/material';
import { Lock, Crown } from 'lucide-react';
import { useLicenseContext } from '../contexts/LicenseContext';
import UpgradePrompt from './UpgradePrompt';
import { UPGRADE_PROMPTS } from '../config/tierConfig';

// =============================================================================
// ProGate - Wrapper component that shows lock overlay for non-Pro users
// =============================================================================

interface ProGateProps {
    children: React.ReactNode;
    feature?: keyof typeof UPGRADE_PROMPTS;
    disabled?: boolean; // Force enable even for free users
    showBadge?: boolean;
    blurAmount?: number;
}

export const ProGate: React.FC<ProGateProps> = ({
    children,
    feature = 'effect',
    disabled = false,
    showBadge = true,
    blurAmount = 3,
}) => {
    const { isPro } = useLicenseContext();
    const [showUpgrade, setShowUpgrade] = useState(false);
    const theme = useTheme();

    // If Pro or disabled, render children normally
    if (isPro || disabled) {
        return <>{children}</>;
    }

    const prompt = UPGRADE_PROMPTS[feature];

    return (
        <>
            <Box
                sx={{
                    position: 'relative',
                    cursor: 'pointer',
                }}
                onClick={() => setShowUpgrade(true)}
            >
                {/* Blurred content */}
                <Box
                    sx={{
                        filter: `blur(${blurAmount}px)`,
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                >
                    {children}
                </Box>

                {/* Lock overlay */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(theme.palette.background.default, 0.5),
                        borderRadius: 1,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <Lock size={24} />
                        {showBadge && (
                            <Chip
                                label="PRO"
                                size="small"
                                color="warning"
                                icon={<Crown size={12} />}
                                sx={{ fontWeight: 'bold', fontSize: '10px' }}
                            />
                        )}
                    </Box>
                </Box>
            </Box>

            <UpgradePrompt
                open={showUpgrade}
                onClose={() => setShowUpgrade(false)}
                title={prompt.title}
                message={prompt.message}
            />
        </>
    );
};

// =============================================================================
// ProBadge - Simple badge to mark Pro features
// =============================================================================

interface ProBadgeProps {
    show?: boolean;
    tooltip?: string;
}

export const ProBadge: React.FC<ProBadgeProps> = ({
    show = true,
    tooltip = 'Pro özellik',
}) => {
    const { isPro } = useLicenseContext();

    if (!show || isPro) {
        return null;
    }

    return (
        <Tooltip title={tooltip}>
            <Chip
                label="PRO"
                size="small"
                color="warning"
                icon={<Crown size={10} />}
                sx={{
                    fontWeight: 'bold',
                    fontSize: '9px',
                    height: 18,
                    ml: 0.5,
                    '& .MuiChip-icon': {
                        marginLeft: '4px',
                    },
                }}
            />
        </Tooltip>
    );
};

// =============================================================================
// ProButton - Button that shows upgrade prompt for non-Pro users
// =============================================================================

interface ProButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    feature?: keyof typeof UPGRADE_PROMPTS;
    component?: React.ElementType;
    [key: string]: any;
}

export const ProButton: React.FC<ProButtonProps> = ({
    children,
    onClick,
    feature = 'effect',
    component: Component = 'button',
    ...props
}) => {
    const { isPro } = useLicenseContext();
    const [showUpgrade, setShowUpgrade] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        if (isPro) {
            onClick?.();
        } else {
            e.preventDefault();
            e.stopPropagation();
            setShowUpgrade(true);
        }
    };

    const prompt = UPGRADE_PROMPTS[feature];

    return (
        <>
            <Component onClick={handleClick} {...props}>
                {children}
                {!isPro && <ProBadge />}
            </Component>

            <UpgradePrompt
                open={showUpgrade}
                onClose={() => setShowUpgrade(false)}
                title={prompt.title}
                message={prompt.message}
            />
        </>
    );
};

// =============================================================================
// useProFeature - Hook for checking Pro features
// =============================================================================

export function useProFeature() {
    const { isPro } = useLicenseContext();
    const [upgradePrompt, setUpgradePrompt] = useState<{
        open: boolean;
        feature: keyof typeof UPGRADE_PROMPTS;
    }>({
        open: false,
        feature: 'effect',
    });

    const requirePro = (feature: keyof typeof UPGRADE_PROMPTS, callback?: () => void) => {
        if (isPro) {
            callback?.();
            return true;
        } else {
            setUpgradePrompt({ open: true, feature });
            return false;
        }
    };

    const closePrompt = () => {
        setUpgradePrompt((prev) => ({ ...prev, open: false }));
    };

    const UpgradeDialog = () => {
        const prompt = UPGRADE_PROMPTS[upgradePrompt.feature];
        return (
            <UpgradePrompt
                open={upgradePrompt.open}
                onClose={closePrompt}
                title={prompt.title}
                message={prompt.message}
            />
        );
    };

    return {
        isPro,
        requirePro,
        UpgradeDialog,
    };
}
