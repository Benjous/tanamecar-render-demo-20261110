import { Head } from '@inertiajs/react';
import { Eye, X } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';

type Row = {
    id: number;
    action: string;
    entity_type: string | null;
    entity_id: number | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    impersonator_id: number | null;
    impersonator_name: string | null;
    created_at: string;
    user_name: string | null;
    user_email: string | null;
};

type UserOption = { id: number; name: string; email: string };

const moduleLabels: Record<string, string> = {
    clients: 'Clients',
    contracts: 'Contrats',
    payments: 'Paiements',
    invoices: 'Factures',
    quotes: 'Devis',
    vehicles: 'Véhicules',
    vehicle_installments: 'Traites',
    vehicle_amortizations: 'Amortissements',
    vehicle_deadlines: 'Échéances',
    roles: 'Rôles',
    users: 'Utilisateurs',
    teams: 'Équipes',
    settings: 'Paramètres',
    deadline_rules: 'Règles',
};

const actionLabels: Record<string, string> = {
    create: 'Création',
    update: 'Modification',
    delete: 'Suppression',
    return: 'Retour',
    duplicate: 'Duplication',
    archive: 'Archivage',
    deactivate: 'Désactivation',
    import: 'Import',
    import_gap: 'Import',
    login: 'Connexion',
    logout: 'Déconnexion',
    convert: 'Conversion',
    impersonation_start: 'Profil ouvert',
    impersonation_stop: 'Retour profil',
    impersonation_failed: 'Profil refusé',
    '2fa_enable_requested': '2FA demandée',
    '2fa_enabled': '2FA activée',
    '2fa_disabled': '2FA désactivée',
    '2fa_recovery_regenerated': 'Codes 2FA',
};

function timeOf(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(parsed);
}

function dateOf(value: string): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10);
    const formatted = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parsed);
    return formatted;
}

function changedKeys(before: Record<string, unknown> | null, after: Record<string, unknown> | null): string[] {
    if (!before || !after) return [];
    return Object.keys(after).filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
}

function detailOf(row: Row): string {
    if (row.action === 'impersonation_start') return 'Ouverture administrateur';
    if (row.action === 'impersonation_stop') return 'Retour administrateur';
    if (row.action === 'impersonation_failed') return 'Mot de passe refusé';
    if (row.action === 'update') {
        const keys = changedKeys(row.before, row.after);
        return keys.length ? keys.slice(0, 4).join(', ') + (keys.length > 4 ? ` +${keys.length - 4}` : '') : 'Aucun changement';
    }
    if (row.action === 'delete') return 'Valeurs supprimées';
    if (row.action === 'create') return row.after ? `${Object.keys(row.after).length} champs` : 'Création';
    return '';
}

function json(value: Record<string, unknown> | null): string {
    if (!value) return '-';
    return JSON.stringify(value, null, 2);
}

export default function Index({
    rows,
    filters,
    actions,
    modules,
    users,
    canViewAll,
}: {
    rows: Row[];
    filters: Record<string, string | undefined>;
    actions: string[];
    modules: string[];
    users: UserOption[];
    canViewAll: boolean;
    count: number;
}) {
    const [selected, setSelected] = useState<Row | null>(null);

    const columns: VirtualColumn<Row>[] = [
        { key: 'date', label: 'DATE', width: '96px', sortValue: (row) => row.created_at, render: (row) => dateOf(row.created_at) },
        { key: 'heure', label: 'HEURE', width: '86px', render: (row) => timeOf(row.created_at) },
        {
            key: 'user',
            label: 'UTILISATEUR',
            width: '170px',
            sortValue: (row) => row.user_name ?? '',
            render: (row) => (
                <span className="al-activity-user">
                    <strong>{row.user_name ?? 'Inconnu'}</strong>
                    {row.impersonator_name && <small>via {row.impersonator_name}</small>}
                </span>
            ),
        },
        {
            key: 'module',
            label: 'MODULE',
            width: '110px',
            render: (row) => moduleLabels[row.entity_type ?? ''] ?? row.entity_type ?? '',
        },
        {
            key: 'action',
            label: 'ACTION',
            width: '120px',
            render: (row) => actionLabels[row.action] ?? row.action,
        },
        { key: 'record', label: 'ENREG.', width: '76px', render: (row) => row.entity_id ?? '' },
        { key: 'detail', label: 'DÉTAIL', width: '220px', render: (row) => detailOf(row) },
        {
            key: 'open',
            label: '',
            width: '66px',
            render: (row) => (
                <button type="button" className="al-activity-open" onClick={() => setSelected(row)}>
                    <Eye className="h-3.5 w-3.5" /> Détails
                </button>
            ),
        },
    ];

    const filterFields = [
        ...(canViewAll
            ? [{
                name: 'user_id',
                label: 'Utilisateur',
                options: [
                    { value: '', label: 'Tous' },
                    ...users.map((user) => ({ value: String(user.id), label: user.name })),
                ],
            }]
            : []),
        {
            name: 'module',
            label: 'Module',
            options: [
                { value: '', label: 'Tous' },
                ...modules.map((module) => ({ value: module, label: moduleLabels[module] ?? module })),
            ],
        },
        {
            name: 'action',
            label: 'Action',
            options: [
                { value: '', label: 'Toutes' },
                ...actions.map((action) => ({ value: action, label: actionLabels[action] ?? action })),
            ],
        },
        { name: 'date', label: 'Date' },
        { name: 'from', label: 'Du' },
        { name: 'to', label: 'Au' },
        { name: 'q', label: 'Recherche' },
    ];

    return (
        <AppLayout>
            <Head title="Journal d'activité" />
            <div className="al-activity-heading">
                <strong>Journal d'activité</strong>
                <span>{rows.length} opérations</span>
            </div>
            <FilterBar
                action="/reports"
                filters={filters}
                fields={filterFields}
            />
            <VirtualDataList
                rows={rows}
                columns={columns}
                rowKey={(row) => row.id}
                href={() => '/reports'}
                totalLabel={`${rows.length} opérations`}
                empty="Aucun résultat"
            />

            {selected && (
                <div className="al-activity-overlay" onClick={() => setSelected(null)}>
                    <div className="al-activity-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="al-activity-modal-head">
                            <div>
                                <strong>{actionLabels[selected.action] ?? selected.action}</strong>
                                <span>
                                    {selected.user_name ?? 'Inconnu'} · {dateOf(selected.created_at)} {timeOf(selected.created_at)}
                                </span>
                            </div>
                            <button type="button" onClick={() => setSelected(null)} aria-label="Fermer">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="al-activity-meta">
                            <span>Module : {moduleLabels[selected.entity_type ?? ''] ?? selected.entity_type ?? '-'}</span>
                            <span>Enregistrement : {selected.entity_id ?? '-'}</span>
                            {selected.impersonator_name && <span>Admin réel : {selected.impersonator_name}</span>}
                        </div>
                        <div className="al-activity-values">
                            <div>
                                <h3>Avant</h3>
                                <pre>{json(selected.before)}</pre>
                            </div>
                            <div>
                                <h3>Après</h3>
                                <pre>{json(selected.after)}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
