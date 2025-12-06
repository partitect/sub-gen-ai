import { useState, useEffect, useCallback } from 'react';

// License status types
export type LicenseStatus = 'valid' | 'invalid' | 'expired' | 'disabled' | 'not_activated' | 'unknown';

export interface LicenseInfo {
    isLicensed: boolean;
    status: LicenseStatus;
    isPro: boolean;
    activatedAt?: string;
    key?: string;
    offlineMode?: boolean;
}

export interface LicenseResult {
    success: boolean;
    status: LicenseStatus;
    data?: any;
    error?: string;
    offline?: boolean;
}

// Check if running in Electron
const isElectron = () => {
    return typeof window !== 'undefined' && window.electron?.license !== undefined;
};

/**
 * Custom hook for license management
 */
export function useLicense() {
    const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>({
        isLicensed: false,
        status: 'not_activated',
        isPro: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load license status on mount
    useEffect(() => {
        checkLicenseStatus();
    }, []);

    // Check current license status
    const checkLicenseStatus = useCallback(async () => {
        if (!isElectron()) {
            // Development mode or web - treat as Pro for testing
            setLicenseInfo({
                isLicensed: true,
                status: 'valid',
                isPro: true,
            });
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const result = await window.electron.license.getStatus();
            setLicenseInfo(result);
            setError(null);
        } catch (err) {
            console.error('License status check failed:', err);
            setError('Lisans durumu kontrol edilemedi');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Activate license
    const activateLicense = useCallback(async (licenseKey: string): Promise<LicenseResult> => {
        if (!isElectron()) {
            return { success: true, status: 'valid' };
        }

        try {
            setIsLoading(true);
            setError(null);

            const result = await window.electron.license.activate(licenseKey);

            if (result.success) {
                setLicenseInfo({
                    isLicensed: true,
                    status: 'valid',
                    isPro: true,
                    activatedAt: result.data?.activatedAt,
                    key: result.data?.key?.substring(0, 8) + '...',
                });
            } else {
                setError(result.error || 'Aktivasyon başarısız');
            }

            return result;
        } catch (err: any) {
            const errorMsg = err.message || 'Aktivasyon hatası';
            setError(errorMsg);
            return { success: false, status: 'unknown', error: errorMsg };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Deactivate license
    const deactivateLicense = useCallback(async (): Promise<boolean> => {
        if (!isElectron()) {
            return true;
        }

        try {
            setIsLoading(true);
            const result = await window.electron.license.deactivate();

            if (result.success) {
                setLicenseInfo({
                    isLicensed: false,
                    status: 'not_activated',
                    isPro: false,
                });
            }

            return result.success;
        } catch (err) {
            console.error('Deactivation failed:', err);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get machine ID for support
    const getMachineId = useCallback(async (): Promise<string | null> => {
        if (!isElectron()) {
            return 'development-machine';
        }

        try {
            return await window.electron.license.getMachineId();
        } catch (err) {
            console.error('Failed to get machine ID:', err);
            return null;
        }
    }, []);

    return {
        licenseInfo,
        isLoading,
        error,
        isPro: licenseInfo.isPro,
        isLicensed: licenseInfo.isLicensed,
        checkLicenseStatus,
        activateLicense,
        deactivateLicense,
        getMachineId,
    };
}

// Type declaration for window.electron
declare global {
    interface Window {
        electron?: {
            isElectron: boolean;
            platform: string;
            getVersion: () => Promise<string>;
            license: {
                getStatus: () => Promise<LicenseInfo>;
                validate: (licenseKey: string) => Promise<LicenseResult>;
                activate: (licenseKey: string) => Promise<LicenseResult>;
                deactivate: () => Promise<{ success: boolean; message?: string }>;
                getMachineId: () => Promise<string>;
            };
            openFile: () => Promise<string | null>;
            saveFile: (data: any) => Promise<string | null>;
            exportVideo: (options: any) => Promise<any>;
            getBackendUrl: () => string;
            send: (channel: string, data: any) => void;
            receive: (channel: string, func: (...args: any[]) => void) => void;
        };
    }
}

export default useLicense;
