import { Head, useForm } from '@inertiajs/react';
import { theme } from '@/lib/theme';
import AppLayout from '@/Layouts/AppLayout';

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
            <Head title="Profile" />
            <form onSubmit={(e) => { e.preventDefault(); put('/settings/company'); }}>
                <table className="al-form-table">
                    <tbody>
                        <tr><td className="al-form-label"><span className="al-triangle">&#9654;</span>Nom</td><td><input value={data.name} onChange={(e) => setData('name', e.target.value)} />{errors.name && <div className="al-login-error">{errors.name}</div>}</td></tr>
                        <tr><td className="al-form-label"><span className="al-triangle">&#9654;</span>Nom de marque</td><td><input value={data.brand_name} onChange={(e) => setData('brand_name', e.target.value)} /></td></tr>
                        <tr><td className="al-form-label"><span className="al-triangle">&#9654;</span>Devise</td><td><input value={data.currency} onChange={(e) => setData('currency', e.target.value)} /></td></tr>
                        <tr><td className="al-form-label"><span className="al-triangle">&#9654;</span>Fuseau horaire</td><td><input value={data.timezone} onChange={(e) => setData('timezone', e.target.value)} /></td></tr>
                        <tr><td className="al-form-label"><span className="al-triangle">&#9654;</span>Format de date</td><td><input value={data.date_format} onChange={(e) => setData('date_format', e.target.value)} /></td></tr>
                        <tr><td className="al-form-label"><span className="al-triangle">&#9654;</span>Couleur principale</td><td><input type="color" value={data.theme_primary} onChange={(e) => setData('theme_primary', e.target.value)} style={{ width: 80, height: 24 }} /></td></tr>
                        <tr><td className="al-form-label"><span className="al-triangle">&#9654;</span>Couleur accent</td><td><input type="color" value={data.theme_accent} onChange={(e) => setData('theme_accent', e.target.value)} style={{ width: 80, height: 24 }} /></td></tr>
                        <tr><td /><td className="al-form-actions"><button type="submit" className="al-button al-button-primary" disabled={processing}>{processing ? 'Enregistrement...' : 'Enregistrer'}</button></td></tr>
                    </tbody>
                </table>
            </form>
        </AppLayout>
    );
}
