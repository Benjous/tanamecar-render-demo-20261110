import { Head, Link } from '@inertiajs/react';
import { FileText, Receipt, Settings2, RefreshCw } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { PageHeader } from '@/components/ui';

export default function Index({ counts }: { counts: Record<string, number> }) {
    const sections = [
        { title: 'Contrat', detail: `${counts.contracts} locations`, href: '/contracts', icon: FileText },
        { title: 'Facturation', detail: `${counts.invoices} factures, ${counts.quotes} devis`, href: '/invoices', icon: Receipt },
        { title: 'Profil société', detail: 'Réglages existants de la société', href: '/settings/company', icon: Settings2 },
        { title: 'Mise à jour', detail: 'Versions et historique réel des changements', href: '/billing/versions', icon: RefreshCw },
    ];
    return (
        <AppLayout>
            <Head title="Facturation" />
            <PageHeader title="Facturation"  />
            <div className="grid gap-4 sm:grid-cols-2">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return <Link key={section.title} href={section.href} className="tc-card flex items-start gap-4 p-5 hover:border-brand-300"><div className="rounded-xl bg-brand-50 p-3 text-brand-700"><Icon className="h-5 w-5" /></div><div><div className="font-bold text-brand-900">{section.title}</div><div className="text-sm text-slate-500">{section.detail}</div></div></Link>;
                })}
            </div>
            <p className="mt-4 text-xs text-slate-500"></p>
        </AppLayout>
    );
}
