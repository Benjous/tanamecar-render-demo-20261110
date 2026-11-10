import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { PageHeader } from '@/components/ui';

export default function Versions({ versions, runtime }: { versions: Array<{ date: string; label: string; detail: string }>; runtime: Record<string, string> }) {
    return (
        <AppLayout>
            <Head title="Versions et mises à jour" />
            <PageHeader title="Versions et mises à jour"  actions={<Link href="/billing" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>} />
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="tc-card p-4"><div className="text-xs text-slate-500">PHP</div><div className="mt-1 font-semibold">{runtime.php}</div></div>
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Laravel</div><div className="mt-1 font-semibold">{runtime.laravel}</div></div>
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Environnement</div><div className="mt-1 font-semibold">{runtime.environment}</div></div>
            </div>
            <section className="tc-card overflow-hidden"><div className="border-b border-slate-100 px-4 py-3 font-semibold">Changements livrés</div><div className="divide-y divide-slate-100">{versions.map((version) => <div key={`${version.date}-${version.label}`} className="px-4 py-3"><div className="text-xs text-slate-500">{version.date}</div><div className="font-semibold text-brand-900">{version.label}</div><div className="text-sm text-slate-600">{version.detail}</div></div>)}</div></section>
        </AppLayout>
    );
}
