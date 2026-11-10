import { Head, useForm } from '@inertiajs/react';
import { theme } from '@/lib/theme';
import { Save } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';

export default function CompanySettings({ settings }: { settings: Record<string, any> }) {
    const { data, setData, put, processing, errors } = useForm({
        name: settings['company.name'] ?? 'TanameCar',
        brand_name: settings['company.brand_name'] ?? 'TANAMECAR',
        currency: settings['company.currency'] ?? 'MAD',
        timezone: settings['company.timezone'] ?? 'Africa/Casablanca',
        date_format: settings['company.date_format'] ?? 'd/m/Y',
        theme_primary: settings['theme.primary'] ?? theme.primary,
        theme_accent: settings['theme.accent'] ?? theme.blue,
    });

    return (
        <AppLayout>
            <Head title="Société" />
            <PageHeader title="Société"  />
            <form onSubmit={(e) => { e.preventDefault(); put('/settings/company'); }} className="tc-card max-w-3xl p-5">
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nom" error={errors.name}><input className="tc-input" value={data.name} onChange={(e) => setData('name', e.target.value)} /></Field>
                    <Field label="Nom de marque"><input className="tc-input" value={data.brand_name} onChange={(e) => setData('brand_name', e.target.value)} /></Field>
                    <Field label="Devise"><input className="tc-input" value={data.currency} onChange={(e) => setData('currency', e.target.value)} /></Field>
                    <Field label="Fuseau horaire"><input className="tc-input" value={data.timezone} onChange={(e) => setData('timezone', e.target.value)} /></Field>
                    <Field label="Format de date"><input className="tc-input" value={data.date_format} onChange={(e) => setData('date_format', e.target.value)} /></Field>
                    <Field label="Couleur principale"><input type="color" className="tc-input h-10" value={data.theme_primary} onChange={(e) => setData('theme_primary', e.target.value)} /></Field>
                    <Field label="Couleur accent"><input type="color" className="tc-input h-10" value={data.theme_accent} onChange={(e) => setData('theme_accent', e.target.value)} /></Field>
                </div>
                <div className="mt-4 flex justify-end"><button className="tc-btn-primary" disabled={processing}><Save className="h-4 w-4" /> Enregistrer</button></div>
            </form>
        </AppLayout>
    );
}


