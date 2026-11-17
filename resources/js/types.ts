export type AuthUser = {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    role: string | null;
    permissions: Record<string, string>;
};

export type ProfileSummary = {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    role: string | null;
};

export type ProfilesProps = {
    current: ProfileSummary;
    available: ProfileSummary[];
    impersonation: { admin_id: number; admin_name: string | null; admin_email: string | null } | null;
};

export type PageProps = {
    auth: { user: AuthUser | null };
    profiles?: ProfilesProps | null;
    flash: { success?: string | null; error?: string | null };
    company: { name: string; currency: string; timezone: string };
    branding: { name: string; logo: string; footer: string; primary?: string; blue?: string; accent?: string };
    [key: string]: unknown;
};

export type EntityField = {
    name: string;
    source: string;
    label: string;
    type: string;
    kind: string;
    input: string;
    required: boolean;
    options: { label: string; value: string }[];
    relation: string | null;
    display: boolean;
    readonly: boolean;
};

export type EntityConfig = {
    key: string;
    table: string;
    label: string;
    icon: string;
    fields: EntityField[];
    list: string[];
};
