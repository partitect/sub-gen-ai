/**
 * Subcio License Manager
 * LemonSqueezy API entegrasyonu ile lisans doğrulama
 */

const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const https = require('https');

// LemonSqueezy API endpoints
const LEMONSQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1/licenses';

// =============================================================================
// SUPER ADMIN CONFIGURATION
// Bu bölümü kendi bilgilerinizle doldurun
// =============================================================================

// Süper Admin anahtarları (bu anahtarlarla Pro erişimi sağlanır)
const SUPER_ADMIN_KEYS = [
    'SUBCIO-ADMIN-MASTER-KEY',      // Değiştirin: Kendi gizli anahtarınız
    'SUBCIO-DEV-2024-UNLIMITED',    // Değiştirin: Yedek anahtar
];

// Süper Admin Machine ID'leri (bu cihazlar otomatik Pro olur)
// Kendi machine ID'nizi almak için: Settings > Lisans Yönetimi > Cihaz Kimliği
const SUPER_ADMIN_MACHINES = [
    // Kendi machine ID'nizi buraya ekleyin
    // Örnek: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
];

// =============================================================================

// License status enum
const LicenseStatus = {
    VALID: 'valid',
    INVALID: 'invalid',
    EXPIRED: 'expired',
    DISABLED: 'disabled',
    NOT_ACTIVATED: 'not_activated',
    UNKNOWN: 'unknown',
    SUPER_ADMIN: 'super_admin'
};

// License storage path
function getLicenseFilePath() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'license.json');
}

/**
 * Generate unique machine ID based on hardware
 * More reliable than MAC address
 */
function generateMachineId() {
    const components = [
        os.hostname(),
        os.platform(),
        os.arch(),
        os.cpus()[0]?.model || 'unknown-cpu',
        os.totalmem().toString(),
        // Get username for additional uniqueness
        os.userInfo().username
    ];

    const combined = components.join('|');
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32);
}

/**
 * Check if current machine or key is Super Admin
 */
function isSuperAdmin(licenseKey = null) {
    // Check if license key is a super admin key
    if (licenseKey && SUPER_ADMIN_KEYS.includes(licenseKey)) {
        return true;
    }

    // Check if machine ID is in super admin list
    const machineId = generateMachineId();
    if (SUPER_ADMIN_MACHINES.includes(machineId)) {
        return true;
    }

    return false;
}

/**
 * Get Super Admin license data
 */
function getSuperAdminLicense() {
    return {
        key: 'SUPER-ADMIN',
        machineId: generateMachineId(),
        status: LicenseStatus.SUPER_ADMIN,
        activatedAt: new Date().toISOString(),
        isSuperAdmin: true,
        offlineValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    };
}

/**
 * Load saved license from disk
 */
function loadStoredLicense() {
    try {
        const licensePath = getLicenseFilePath();
        if (fs.existsSync(licensePath)) {
            const data = fs.readFileSync(licensePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('[License] Error loading stored license:', error);
    }
    return null;
}

/**
 * Save license to disk
 */
function saveLicense(licenseData) {
    try {
        const licensePath = getLicenseFilePath();
        fs.writeFileSync(licensePath, JSON.stringify(licenseData, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('[License] Error saving license:', error);
        return false;
    }
}

/**
 * Clear stored license
 */
function clearLicense() {
    try {
        const licensePath = getLicenseFilePath();
        if (fs.existsSync(licensePath)) {
            fs.unlinkSync(licensePath);
        }
        return true;
    } catch (error) {
        console.error('[License] Error clearing license:', error);
        return false;
    }
}

/**
 * Make HTTPS request to LemonSqueezy API
 */
function makeApiRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);

        const url = new URL(endpoint);
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Validate license key with LemonSqueezy
 */
async function validateLicense(licenseKey) {
    // Check for Super Admin key first
    if (isSuperAdmin(licenseKey)) {
        const adminLicense = getSuperAdminLicense();
        saveLicense(adminLicense);
        return { success: true, status: LicenseStatus.SUPER_ADMIN, data: adminLicense };
    }

    const machineId = generateMachineId();

    try {
        const response = await makeApiRequest(`${LEMONSQUEEZY_API_URL}/validate`, {
            license_key: licenseKey,
            instance_name: machineId
        });

        if (response.status === 200 && response.data.valid) {
            const licenseData = {
                key: licenseKey,
                machineId: machineId,
                status: LicenseStatus.VALID,
                validatedAt: new Date().toISOString(),
                instanceId: response.data.instance?.id || null,
                meta: response.data.meta || {},
                // Cache for offline use
                offlineValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            };

            saveLicense(licenseData);
            return { success: true, status: LicenseStatus.VALID, data: licenseData };
        } else {
            return {
                success: false,
                status: LicenseStatus.INVALID,
                error: response.data.error || 'License validation failed'
            };
        }
    } catch (error) {
        console.error('[License] Validation error:', error);

        // Check for cached license (offline mode)
        const storedLicense = loadStoredLicense();
        if (storedLicense && storedLicense.key === licenseKey) {
            const offlineValid = new Date(storedLicense.offlineValidUntil) > new Date();
            if (offlineValid) {
                return {
                    success: true,
                    status: LicenseStatus.VALID,
                    data: storedLicense,
                    offline: true
                };
            }
        }

        return {
            success: false,
            status: LicenseStatus.UNKNOWN,
            error: 'Network error. Please check your internet connection.'
        };
    }
}

/**
 * Activate license on this machine
 */
async function activateLicense(licenseKey) {
    // Check for Super Admin key first
    if (isSuperAdmin(licenseKey)) {
        const adminLicense = getSuperAdminLicense();
        saveLicense(adminLicense);
        return { success: true, status: LicenseStatus.SUPER_ADMIN, data: adminLicense };
    }

    const machineId = generateMachineId();
    const instanceName = `${os.hostname()}-${os.platform()}`;

    try {
        const response = await makeApiRequest(`${LEMONSQUEEZY_API_URL}/activate`, {
            license_key: licenseKey,
            instance_name: instanceName
        });

        if (response.status === 200 && response.data.activated) {
            const licenseData = {
                key: licenseKey,
                machineId: machineId,
                instanceId: response.data.instance?.id,
                instanceName: instanceName,
                status: LicenseStatus.VALID,
                activatedAt: new Date().toISOString(),
                meta: response.data.meta || {},
                offlineValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };

            saveLicense(licenseData);
            return { success: true, status: LicenseStatus.VALID, data: licenseData };
        } else {
            const errorMsg = response.data.error || 'Activation failed';

            // Check if already at device limit
            if (errorMsg.includes('limit') || response.status === 400) {
                return {
                    success: false,
                    status: LicenseStatus.INVALID,
                    error: 'Bu lisans cihaz limitine ulaştı. Başka bir cihazdan deaktive edin.'
                };
            }

            return { success: false, status: LicenseStatus.INVALID, error: errorMsg };
        }
    } catch (error) {
        console.error('[License] Activation error:', error);
        return {
            success: false,
            status: LicenseStatus.UNKNOWN,
            error: 'Network error. Please check your internet connection.'
        };
    }
}

/**
 * Deactivate license from this machine
 */
async function deactivateLicense() {
    const storedLicense = loadStoredLicense();

    // Super Admin can't deactivate normally
    if (storedLicense?.isSuperAdmin) {
        clearLicense();
        return { success: true, message: 'Super Admin license cleared' };
    }

    if (!storedLicense || !storedLicense.instanceId) {
        clearLicense();
        return { success: true, message: 'License cleared locally' };
    }

    try {
        const response = await makeApiRequest(`${LEMONSQUEEZY_API_URL}/deactivate`, {
            license_key: storedLicense.key,
            instance_id: storedLicense.instanceId
        });

        clearLicense();

        if (response.status === 200 && response.data.deactivated) {
            return { success: true, message: 'License deactivated successfully' };
        } else {
            return { success: true, message: 'License cleared locally (remote deactivation may have failed)' };
        }
    } catch (error) {
        console.error('[License] Deactivation error:', error);
        clearLicense();
        return { success: true, message: 'License cleared locally' };
    }
}

/**
 * Check current license status
 */
function getLicenseStatus() {
    // Check for Super Admin machine first (auto Pro without activation)
    if (isSuperAdmin()) {
        return {
            isLicensed: true,
            status: LicenseStatus.SUPER_ADMIN,
            isPro: true,
            isSuperAdmin: true,
            activatedAt: new Date().toISOString(),
            key: 'SUPER-ADMIN'
        };
    }

    const storedLicense = loadStoredLicense();

    if (!storedLicense) {
        return {
            isLicensed: false,
            status: LicenseStatus.NOT_ACTIVATED,
            isPro: false
        };
    }

    // Super Admin stored license
    if (storedLicense.isSuperAdmin) {
        return {
            isLicensed: true,
            status: LicenseStatus.SUPER_ADMIN,
            isPro: true,
            isSuperAdmin: true,
            activatedAt: storedLicense.activatedAt,
            key: 'SUPER-ADMIN'
        };
    }

    // Check if offline cache is still valid
    const offlineValid = new Date(storedLicense.offlineValidUntil) > new Date();

    return {
        isLicensed: storedLicense.status === LicenseStatus.VALID && offlineValid,
        status: storedLicense.status,
        isPro: storedLicense.status === LicenseStatus.VALID,
        activatedAt: storedLicense.activatedAt,
        key: storedLicense.key ? `${storedLicense.key.substring(0, 8)}...` : null,
        offlineMode: !offlineValid
    };
}

/**
 * Get machine ID for display
 */
function getMachineId() {
    return generateMachineId();
}

module.exports = {
    LicenseStatus,
    validateLicense,
    activateLicense,
    deactivateLicense,
    getLicenseStatus,
    getMachineId,
    loadStoredLicense,
    clearLicense,
    isSuperAdmin,
    SUPER_ADMIN_KEYS,
    SUPER_ADMIN_MACHINES
};
