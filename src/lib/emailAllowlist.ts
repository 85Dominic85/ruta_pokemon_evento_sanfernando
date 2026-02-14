export const ALLOWED_DOMAINS: string[] = [
    "gmail.com",
    "googlemail.com",
    "outlook.com",
    "outlook.es",
    "hotmail.com",
    "hotmail.es",
    "live.com",
    "msn.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "yahoo.com",
    "yahoo.es",
    "ymail.com",
    "proton.me",
    "protonmail.com",
];

export interface EmailValidationResult {
    valid: boolean;
    error?: string;
}

export function validateEmail(email: string): EmailValidationResult {
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
        return { valid: false, error: "El email es obligatorio." };
    }

    const atIndex = trimmed.indexOf("@");
    if (atIndex < 1) {
        return { valid: false, error: "El email no es válido." };
    }

    const domain = trimmed.slice(atIndex + 1);
    if (!domain || !domain.includes(".")) {
        return { valid: false, error: "El email no es válido." };
    }

    const tld = domain.split(".").pop();
    if (!tld || tld.length < 2) {
        return { valid: false, error: "El email no es válido." };
    }

    if (!ALLOWED_DOMAINS.includes(domain)) {
        return {
            valid: false,
            error:
                "Usa un correo habitual: Gmail, Outlook, iCloud, Yahoo, Proton…",
        };
    }

    return { valid: true };
}

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}
