import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, PageHeader } from '@/components/ui';

export default function DesignSystem() {
    return (
        <AppLayout>
            <Head title="Système de design" />
            <PageHeader title="Système de design"  />
            <div className="space-y-6">
                <section className="tc-card p-5"><h2 className="mb-3 font-bold">Couleurs</h2><div className="grid gap-2 sm:grid-cols-5 lg:grid-cols-10">{['50','100','200','300','400','500','600','700','800','900'].map((shade) => <div key={shade}><div className="h-12 rounded-lg border border-brand-100" style={{ background: `var(--brand-${shade})` }} /><div className="mt-1 text-[11px] text-slate-500">brand-{shade}</div></div>)}</div></section>
                <section className="tc-card p-5"><h2 className="mb-3 font-bold">Typographie</h2><div className="space-y-2"><div className="text-[36px] font-black">36 px, titre</div><div className="text-[30px] font-bold">30 px, section</div><div className="text-[24px] font-bold">24 px, sous-section</div><div className="text-[20px] font-semibold">20 px, carte</div><div className="text-[18px]">18 px, texte fort</div><div className="text-[16px]">16 px, texte courant</div><div className="text-[14px]">14 px, métadonnée</div><div className="text-[13px]">13 px, liste</div><div className="text-[12px] uppercase tracking-wide text-slate-500">12 px, légende</div></div></section>
                <section className="tc-card p-5"><h2 className="mb-3 font-bold">Boutons</h2><div className="flex flex-wrap gap-2"><button className="tc-btn-primary">Primaire</button><button className="tc-btn-secondary">Secondaire</button><button className="tc-btn border border-transparent text-brand-700 hover:bg-brand-50">Fantôme</button><button className="tc-btn-danger">Destructif</button><button className="tc-btn-primary" disabled>Désactivé</button></div></section>
                <section className="tc-card p-5"><h2 className="mb-3 font-bold">Champs et puces</h2><div className="grid gap-3 sm:grid-cols-3"><input className="tc-input" aria-label="Champ texte" placeholder="Champ texte" /><select className="tc-input" aria-label="Sélecteur"><option>Sélecteur</option></select><input type="date" className="tc-input" aria-label="Date" /></div><div className="mt-3 flex flex-wrap gap-2"><Badge tone="bg-emerald-50 text-emerald-700 border-emerald-200">Succès</Badge><Badge tone="bg-amber-50 text-amber-800 border-amber-200">Avertissement</Badge><Badge tone="bg-rose-50 text-rose-700 border-rose-200">Danger</Badge><Badge tone="bg-sky-50 text-sky-700 border-sky-200">Info</Badge></div></section>
                <section className="tc-card p-5"><h2 className="mb-3 font-bold">États</h2><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-brand-100 p-4"><div className="h-3 w-2/3 animate-pulse rounded bg-brand-100" /><div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-brand-100" /><div className="mt-3 text-xs text-slate-500">Squelette de chargement</div></div><div className="rounded-xl border border-dashed border-brand-200 p-4 text-sm text-slate-500">Aucun résultat</div><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Toast de succès.</div></div></section>
            </div>
        </AppLayout>
    );
}
