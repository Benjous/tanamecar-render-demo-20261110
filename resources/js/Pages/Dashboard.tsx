import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { money, number } from '@/lib/utils';

type Kpis = Record<string, number | null>;
type StatusCounts = Record<string, number>;
type Month = { key: string; label: string; contracts: number; days: number; revenue: number; payments: number };
type VehicleRow = {
    id: number;
    display_name: string;
    plate_number: string;
    brand: string | null;
    model: string | null;
    category: string | null;
    status: string;
    operating_mode: string | null;
    contracts: number;
    days: number;
    revenue: number;
    utilization: number;
};

const statusLabels: Record<string, string> = {
    disponible: 'Disponible',
    en_location: 'En location',
    sous_location: 'Sous-location',
    en_reparation: 'Entretien',
    immobilise: 'Immobilisé',
};

const statusColors: Record<string, string> = {
    disponible: '#2e8b57',
    en_location: '#c0392b',
    sous_location: '#8e44ad',
    en_reparation: '#e67e22',
    immobilise: '#95a5a6',
};

function Kpi({ label, value, hint, tone = 'default' }: { label: string; value: string | number; hint?: string; tone?: 'default' | 'green' | 'red' | 'orange' | 'blue' | 'purple' }) {
    return (
        <div className={`bi-kpi bi-kpi-${tone}`}>
            <div className="bi-kpi-label">{label}</div>
            <div className="bi-kpi-value">{value}</div>
            {hint && <div className="bi-kpi-hint">{hint}</div>}
        </div>
    );
}

export default function Dashboard({
    filters,
    filterOptions,
    kpis,
    statusCounts,
    monthly,
    vehiclePerformance,
    periodLabel,
}: {
    filters: Record<string, string | number | null | undefined>;
    filterOptions: { categories: any[]; models: any[]; vehicles: any[] };
    kpis: Kpis;
    statusCounts: StatusCounts;
    monthly: Month[];
    vehiclePerformance: VehicleRow[];
    periodLabel: string;
}) {
    const totalVehicles = Number(statusCounts.total ?? 0);
    const filterValues = Object.fromEntries(
        Object.entries(filters).map(([key, value]) => [key, value === null || value === undefined ? '' : String(value)]),
    );
    const donutSegments = Object.entries(statusLabels)
        .map(([key, label]) => ({ key, label, value: Number(statusCounts[key] ?? 0), color: statusColors[key] }))
        .filter((entry) => entry.value > 0);
    let cursor = 0;
    const donut = donutSegments.map((entry) => {
        const start = cursor;
        const end = cursor + (entry.value / Math.max(1, totalVehicles)) * 100;
        cursor = end;
        return `${entry.color} ${start}% ${end}%`;
    }).join(', ');

    const maxMonthly = Math.max(1, ...monthly.map((month) => Math.max(Number(month.revenue), Number(month.payments))));
    const hasMonthly = monthly.some((month) => Number(month.revenue) > 0 || Number(month.payments) > 0);
    const utilization = Math.max(0, Math.min(100, Number(kpis.utilization ?? 0)));

    return (
        <AppLayout>
            <Head title="État de Parc" />

            <div className="bi-head">
                <div>
                    <h1 className="bi-title">État de Parc</h1>
                    <div className="bi-subtitle">Analyse du {periodLabel}</div>
                </div>
                <div className="bi-head-meta">
                    <span>{number(kpis.filtered_total ?? 0)} véhicules filtrés</span>
                    <span>Parc total : {number(kpis.fleet_total ?? 0)}</span>
                </div>
            </div>

            <FilterBar
                action="/dashboard"
                filters={filterValues}
                fields={[
                    { name: 'from', label: 'Du' },
                    { name: 'to', label: 'Au' },
                    {
                        name: 'status',
                        label: 'Statut',
                        options: [
                            { value: '', label: 'Tous' },
                            { value: 'disponible', label: 'Disponible' },
                            { value: 'en_location', label: 'En location' },
                            { value: 'sous_location', label: 'Sous-location' },
                            { value: 'en_reparation', label: 'Entretien' },
                        ],
                    },
                    { name: 'category_id', label: 'Catégorie', options: [{ value: '', label: 'Toutes' }, ...filterOptions.categories.map((c) => ({ value: String(c.id), label: c.name }))] },
                    { name: 'model_id', label: 'Modèle', options: [{ value: '', label: 'Tous' }, ...filterOptions.models.map((m) => ({ value: String(m.id), label: m.name }))] },
                    { name: 'vehicle_id', label: 'Véhicule', options: [{ value: '', label: 'Tous' }, ...filterOptions.vehicles.map((v) => ({ value: String(v.id), label: `${v.display_name} ${v.plate_number ?? ''}` }))] },
                ]}
            />

            <div className="bi-section-title">Vue générale du parc</div>
            <div className="bi-kpi-grid bi-kpi-grid-7">
                <Kpi label="Véhicules" value={number(kpis.filtered_total ?? 0)} hint={`sur ${number(kpis.fleet_total ?? 0)}`} />
                <Kpi label="Disponibles" value={number(kpis.available ?? 0)} tone="green" />
                <Kpi label="En location" value={number(kpis.in_rental ?? 0)} tone="red" />
                <Kpi label="Sous-location" value={number(kpis.in_sub_rental ?? 0)} tone="purple" />
                <Kpi label="Entretien" value={number(kpis.in_repair ?? 0)} tone="orange" />
                <Kpi label="Immobilisés" value={number(kpis.immobilized ?? 0)} />
                <Kpi label="Taux d'utilisation" value={`${number(kpis.utilization ?? 0)} %`} tone="blue" hint="hors sous-location" />
            </div>

            <div className="bi-two-col">
                <section className="bi-card">
                    <h2 className="bi-card-title">Répartition du parc</h2>
                    <div className="bi-donut-wrap">
                        <div className="bi-donut" style={{ background: donut ? `conic-gradient(${donut})` : '#e5edf3' }}>
                            <div className="bi-donut-center">
                                <strong>{number(totalVehicles)}</strong>
                                <span>véhicules</span>
                            </div>
                        </div>
                        <div className="bi-legend">
                            {donutSegments.length ? donutSegments.map((entry) => (
                                <div key={entry.key} className="bi-legend-row">
                                    <span className="bi-legend-dot" style={{ background: entry.color }} />
                                    <span>{entry.label}</span>
                                    <strong>{number(entry.value)}</strong>
                                    <small>{Math.round((entry.value / Math.max(1, totalVehicles)) * 100)}%</small>
                                </div>
                            )) : <div className="bi-empty">Aucune donnée.</div>}
                        </div>
                    </div>
                </section>

                <section className="bi-card">
                    <h2 className="bi-card-title">Taux d'utilisation</h2>
                    <div className="bi-gauge-wrap">
                        <div className="bi-gauge" style={{ background: `conic-gradient(#2f7fb8 0% ${utilization}%, #e5edf3 ${utilization}% 100%)` }}>
                            <div className="bi-gauge-center"><strong>{number(utilization)}%</strong></div>
                        </div>
                        <div className="bi-gauge-copy">
                            <div><strong>{number(kpis.in_rental ?? 0)}</strong> en location</div>
                            <div><strong>{number(kpis.available ?? 0)}</strong> disponibles</div>
                            <div><strong>{number(kpis.in_repair ?? 0)}</strong> en entretien</div>
                            <div className="bi-muted">Base : parc hors sous-location</div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="bi-section-title">Activité locative</div>
            <div className="bi-kpi-grid bi-kpi-grid-6">
                <Kpi label="Locations en cours" value={number(kpis.active_contracts ?? 0)} tone="blue" />
                <Kpi label="En retard" value={number(kpis.overdue ?? 0)} tone="red" />
                <Kpi label="Retours aujourd'hui" value={number(kpis.due_today ?? 0)} tone="orange" />
                <Kpi label="Retours demain" value={number(kpis.due_tomorrow ?? 0)} tone="orange" />
                <Kpi label="Contrats sur période" value={number(kpis.period_contracts ?? 0)} />
                <Kpi label="Jours de location" value={number(kpis.period_days ?? 0)} />
            </div>

            <div className="bi-section-title">Analyse financière</div>
            <div className="bi-kpi-grid bi-kpi-grid-6">
                <Kpi label="Revenus contrats" value={money(kpis.revenue ?? 0)} hint="contrats partis sur la période" />
                <Kpi label="Encaissements" value={money(kpis.paid ?? 0)} hint="paiements enregistrés" tone="green" />
                <Kpi label="Facturé" value={money(kpis.invoiced ?? 0)} hint="factures émises" />
                <Kpi label="Reste à encaisser" value={money(kpis.remaining ?? 0)} tone="orange" hint="sur les contrats de la période" />
                <Kpi label="Charges" value={money(kpis.charges ?? 0)} tone="red" />
                <Kpi label="Entretien" value="Non disponible" hint="coûts non renseignés" />
            </div>

            <section className="bi-card bi-card-wide">
                <div className="bi-card-head">
                    <h2 className="bi-card-title">Évolution mensuelle</h2>
                    <div className="bi-chart-legend"><span className="bi-legend-revenue" /> Revenus <span className="bi-legend-paid" /> Encaissements</div>
                </div>
                {hasMonthly ? (
                    <div className="bi-month-chart">
                        {monthly.map((month) => (
                            <div key={month.key} className="bi-month" title={`${month.label} : ${month.contracts} contrats · ${money(month.revenue)} · ${money(month.payments)}`}>
                                <div className="bi-month-bars">
                                    <div className="bi-bar bi-bar-revenue" style={{ height: `${Math.max(2, (Number(month.revenue) / maxMonthly) * 100)}%` }} />
                                    <div className="bi-bar bi-bar-paid" style={{ height: `${Math.max(2, (Number(month.payments) / maxMonthly) * 100)}%` }} />
                                </div>
                                <span className="bi-month-label">{month.label}</span>
                            </div>
                        ))}
                    </div>
                ) : <div className="bi-empty">Aucune donnée sur la période.</div>}
            </section>

            <section className="bi-card bi-card-wide">
                <div className="bi-card-head">
                    <h2 className="bi-card-title">Performance par véhicule</h2>
                    <span className="bi-muted">{vehiclePerformance.length} véhicules</span>
                </div>
                <div className="bi-table-wrap">
                    <table className="tc-table">
                        <thead><tr><th>Matricule</th><th>Modèle</th><th>Catégorie</th><th>Statut</th><th>Locations</th><th>Jours</th><th>Revenus</th><th>Utilisation</th></tr></thead>
                        <tbody>
                            {vehiclePerformance.map((vehicle) => (
                                <tr key={vehicle.id}>
                                    <td data-label="Matricule" className="font-semibold">{vehicle.plate_number}</td>
                                    <td data-label="Modèle">{vehicle.display_name}</td>
                                    <td data-label="Catégorie">{vehicle.category ?? '-'}</td>
                                    <td data-label="Statut"><span className={`bi-status bi-status-${vehicle.status}`}>{statusLabels[vehicle.status] ?? vehicle.status}</span></td>
                                    <td data-label="Locations">{number(vehicle.contracts)}</td>
                                    <td data-label="Jours">{number(vehicle.days)}</td>
                                    <td data-label="Revenus">{money(vehicle.revenue)}</td>
                                    <td data-label="Utilisation">
                                        <div className="bi-progress"><span style={{ width: `${Math.min(100, vehicle.utilization)}%` }} /></div>
                                        <small>{number(vehicle.utilization)}%</small>
                                    </td>
                                </tr>
                            ))}
                            {!vehiclePerformance.length && <tr><td colSpan={8} className="py-8 text-center text-slate-400">Aucun véhicule.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
        </AppLayout>
    );
}
