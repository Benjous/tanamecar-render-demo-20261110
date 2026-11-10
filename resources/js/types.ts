export type AuthUser = {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    role: string | null;
    permissions: Record<string, string>;
};

export type PageProps = {
    auth: { user: AuthUser | null };
    flash: { success?: string | null; error?: string | null };
    company: { name: string; currency: string; timezone: string };
    branding: { footer: string };
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
