import React, { createContext, useContext, ReactNode } from 'react';
import { useLicense, LicenseInfo, LicenseResult } from '../hooks/useLicense';

interface LicenseContextType {
    licenseInfo: LicenseInfo;
    isLoading: boolean;
    error: string | null;
    isPro: boolean;
    isLicensed: boolean;
    checkLicenseStatus: () => Promise<void>;
    activateLicense: (licenseKey: string) => Promise<LicenseResult>;
    deactivateLicense: () => Promise<boolean>;
    getMachineId: () => Promise<string | null>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

interface LicenseProviderProps {
    children: ReactNode;
}

export const LicenseProvider: React.FC<LicenseProviderProps> = ({ children }) => {
    const license = useLicense();

    return (
        <LicenseContext.Provider value={license}>
            {children}
        </LicenseContext.Provider>
    );
};

export const useLicenseContext = (): LicenseContextType => {
    const context = useContext(LicenseContext);
    if (context === undefined) {
        throw new Error('useLicenseContext must be used within a LicenseProvider');
    }
    return context;
};

/**
 * Higher-order component to require Pro license
 */
interface ProFeatureProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export const ProFeature: React.FC<ProFeatureProps> = ({ children, fallback }) => {
    const { isPro, isLoading } = useLicenseContext();

    if (isLoading) {
        return null;
    }

    if (!isPro) {
        return fallback ? <>{fallback}</> : null;
    }

    return <>{children}</>;
};

/**
 * Component to show Pro badge on features
 */
interface ProBadgeProps {
    show?: boolean;
}

export const ProBadge: React.FC<ProBadgeProps> = ({ show = true }) => {
    const { isPro } = useLicenseContext();

    if (!show || isPro) {
        return null;
    }

    return (
        <span
            style={{
                display: 'inline-block',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 'bold',
                backgroundColor: '#7c3aed',
                color: 'white',
                borderRadius: '4px',
                marginLeft: '6px',
                textTransform: 'uppercase',
            }}
        >
            PRO
        </span>
    );
};

export default LicenseContext;
