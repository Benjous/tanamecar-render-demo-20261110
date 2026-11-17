import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { amount } from '@/lib/utils';

type Metrics = Record<string, number>;

function value(metrics: Metrics, key: string): string {
    return amount(metrics[key] ?? 0);
}

export default function FinanceOverview({ metrics }: { metrics: Metrics; counts: Record<string, number>; recentCharges: unknown[]; recentProfits: unknown[]; recentCredits: unknown[] }) {
    const { url } = usePage();
    const bilan = new URLSearchParams(url.split('?')[1] ?? '').get('view') === 'bilan';
    const charges = Number(metrics.charges_total ?? 0);
    const payments = Number(metrics.payments_total ?? 0);
    const installments = Number(metrics.installments_total ?? 0);
    const cash = Number(metrics.cash_balance ?? 0);
    const remaining = Number(metrics.contract_remaining ?? 0);
    const benefit = payments - charges - installments;

    if (bilan) {
        const blockOne: Array<[string, string]> = [
            ['CAPITAL', amount(0)],
            ['CAISSE', amount(cash)],
            ['RESTE', amount(remaining)],
            ['TRAITE', amount(installments)],
            ['BÉNÉFICE', amount(benefit)],
        ];
        const blockTwo: Array<[string, string]> = [
            ['CAPITAL', amount(0)],
            ['CAISSE', amount(cash)],
            ['RESTE NET', amount(remaining + installments)],
            ['TRAITE', amount(installments)],
            ['BÉNÉFICE', amount(benefit + installments)],
        ];

        return (
            <AppLayout>
                <Head title="Bilan" />
                <table className="al-data-table al-compact" style={{ width: '230px' }}>
                    <tbody>
                        {blockOne.map(([label, montant]) => (
                            <tr key={`one-${label}`}><td>{label}</td><td className="al-money-cell">{montant}</td></tr>
                        ))}
                        <tr><td colSpan={2}>&nbsp;</td></tr>
                        {blockTwo.map(([label, montant]) => (
                            <tr key={`two-${label}`}><td>{label}</td><td className="al-money-cell">{montant}</td></tr>
                        ))}
                    </tbody>
                </table>
                <table className="al-data-table al-compact" style={{ width: '500px', marginTop: 8 }}>
                    <tbody>
                        <tr>
                            <td>charge fixe</td>
                            <td>charge en voiture</td>
                            <td className="al-money-cell">{amount(charges)}</td>
                            <td>traite</td>
                            <td className="al-money-cell">{amount(installments)}</td>
                            <td>Total</td>
                            <td className="al-money-cell">{amount(charges + installments)}</td>
                        </tr>
                    </tbody>
                </table>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="État Global" />
            <table className="al-data-table" style={{ width: '760px' }}>
                <tbody>
                    <tr className="al-table-head al-finance-head"><td>FRAIS</td><td>ESTIMATIF</td><td>REEL</td><td>DIFFERENCE</td></tr>
                    <tr><td>Annuel</td><td className="al-money-cell">{amount(0)}</td><td className="al-money-cell">{amount(charges)}</td><td className="al-money-cell">{amount(charges)}</td></tr>
                    <tr><td>Par mois</td><td className="al-money-cell">{amount(0)}</td><td className="al-money-cell">{amount(charges / 12)}</td><td className="al-money-cell">{amount(charges / 12)}</td></tr>
                    <tr><td>Par jour</td><td className="al-money-cell">{amount(0)}</td><td className="al-money-cell">{amount(charges / 365)}</td><td className="al-money-cell">{amount(charges / 365)}</td></tr>

                    <tr className="al-table-head al-finance-head"><td>TVA (E)</td><td>TVA (S)</td><td>ECART</td><td /></tr>
                    <tr><td className="al-money-cell">{amount(0)}</td><td className="al-money-cell">{amount(0)}</td><td className="al-money-cell">{amount(0)}</td><td /></tr>

                    <tr className="al-table-head al-finance-head"><td>CRÉDIT EN COURS</td><td>CRÉDIT DÉPASSÉ</td><td>CRÉDIT</td><td /></tr>
                    <tr><td className="al-money-cell">{amount(installments)}</td><td className="al-money-cell">{amount(0)}</td><td className="al-money-cell">{amount(installments)}</td><td /></tr>

                    <tr className="al-table-head al-finance-head"><td>TRAITE</td><td>CHARGE</td><td>TRAITE + CHARGE</td><td /></tr>
                    <tr><td className="al-money-cell">{amount(installments)}</td><td className="al-money-cell">{amount(charges)}</td><td className="al-money-cell">{amount(installments + charges)}</td><td /></tr>

                    <tr className="al-table-head al-finance-head"><td>REVENU</td><td>SOLDE</td><td>CAISSE</td><td /></tr>
                    <tr><td className="al-money-cell">{amount(payments)}</td><td className="al-money-cell">{amount(cash)}</td><td className="al-money-cell">{amount(cash)}</td><td /></tr>
                </tbody>
            </table>
        </AppLayout>
    );
}
