import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';

type Option = { id: number; name: string; brand_id?: number };

export default function VehicleForm({ vehicle, brands, models, colors, categories }: { vehicle: any; brands: Option[]; models: Option[]; colors: Option[]; categories: Option[] }) {
    const { data, setData, post, put, processing, errors } = useForm({
        display_name: vehicle?.display_name ?? '',
        status: vehicle?.status ?? 'disponible',
        operating_mode: vehicle?.operating_mode ?? 'location',
        brand_id: vehicle?.brand_id ?? '',
        model_id: vehicle?.model_id ?? '',
        color_id: vehicle?.color_id ?? '',
        category_id: vehicle?.category_id ?? '',
        plate_number: vehicle?.plate_number ?? '',
        cpi_ww: vehicle?.cpi_ww ?? '',
        first_registration_date: vehicle?.first_registration_date ?? '',
        fiscal_power: vehicle?.fiscal_power ?? '',
        fuel_type: vehicle?.fuel_type ?? '',
        gearbox: vehicle?.gearbox ?? '',
        chassis_number: vehicle?.chassis_number ?? '',
        km: vehicle?.km ?? '',
        purchase_price: vehicle?.purchase_price ?? '',
        daily_rate: vehicle?.daily_rate ?? '',
        credit_months: vehicle?.credit_months ?? '',
        credit_down_payment: vehicle?.credit_down_payment ?? '',
        monthly_installment: vehicle?.monthly_installment ?? '',
        credit_due_date: vehicle?.credit_due_date ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (vehicle) put(`/vehicles/${vehicle.id}`);
        else post('/vehicles');
    }

    return (
        <AppLayout>
            <Head title={vehicle ? `Modifier ${vehicle.display_name}` : 'Nouveau voiture'} />
            <PageHeader title={vehicle ? `Modifier ${vehicle.display_name}` : 'Nouveau voiture'}  actions={<Link href="/vehicles" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>} />

            <form onSubmit={submit} className="space-y-6">
                <section className="tc-card p-5">
                    <h2 className="mb-4 text-sm font-bold">Général</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Nom du voiture *" error={errors.display_name}><input className="tc-input" value={data.display_name} onChange={(e) => setData('display_name', e.target.value)} /></Field>
                        <Field label="Statut *" error={errors.status}><select className="tc-input" value={data.status} onChange={(e) => setData('status', e.target.value)}><option value="disponible">Disponible</option><option value="en_location">En location</option><option value="en_reparation">En réparation</option><option value="hors_service">Hors service</option></select></Field>
                        <Field label="Mode *" error={errors.operating_mode}><select className="tc-input" value={data.operating_mode} onChange={(e) => setData('operating_mode', e.target.value)}><option value="location">Location</option><option value="sous_location">Sous-location</option><option value="service">Service</option></select></Field>
                        <Field label="Marque"><select className="tc-input" value={data.brand_id} onChange={(e) => setData('brand_id', e.target.value)}><option value="">-</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
                        <Field label="Modèle"><select className="tc-input" value={data.model_id} onChange={(e) => setData('model_id', e.target.value)}><option value="">-</option>{models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
                        <Field label="Couleur"><select className="tc-input" value={data.color_id} onChange={(e) => setData('color_id', e.target.value)}><option value="">-</option>{colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                        <Field label="Catégorie"><select className="tc-input" value={data.category_id} onChange={(e) => setData('category_id', e.target.value)}><option value="">-</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                        <Field label="Matricule"><input className="tc-input" value={data.plate_number} onChange={(e) => setData('plate_number', e.target.value)} /></Field>
                        <Field label="CPI WW"><input className="tc-input" value={data.cpi_ww} onChange={(e) => setData('cpi_ww', e.target.value)} /></Field>
                    </div>
                </section>

                <section className="tc-card p-5">
                    <h2 className="mb-4 text-sm font-bold">Technique</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Mise en circulation"><input type="date" className="tc-input" value={data.first_registration_date} onChange={(e) => setData('first_registration_date', e.target.value)} /></Field>
                        <Field label="Puissance fiscale"><input type="number" className="tc-input" value={data.fiscal_power} onChange={(e) => setData('fiscal_power', e.target.value)} /></Field>
                        <Field label="Carburant"><select className="tc-input" value={data.fuel_type} onChange={(e) => setData('fuel_type', e.target.value)}><option value="">-</option><option value="Diesel">Diesel</option><option value="Essence">Essence</option><option value="Hybrid">Hybrid</option><option value="electrique">Électrique</option></select></Field>
                        <Field label="Boîte"><select className="tc-input" value={data.gearbox} onChange={(e) => setData('gearbox', e.target.value)}><option value="">-</option><option value="Automatique">Automatique</option><option value="Manuel">Manuel</option></select></Field>
                        <Field label="N° châssis"><input className="tc-input" value={data.chassis_number} onChange={(e) => setData('chassis_number', e.target.value)} /></Field>
                        <Field label="Km"><input type="number" className="tc-input" value={data.km} onChange={(e) => setData('km', e.target.value)} /></Field>
                    </div>
                </section>

                <section className="tc-card p-5">
                    <h2 className="mb-4 text-sm font-bold">Finance</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Prix d’achat"><input type="number" className="tc-input" value={data.purchase_price} onChange={(e) => setData('purchase_price', e.target.value)} /></Field>
                        <Field label="Prix/jour"><input type="number" className="tc-input" value={data.daily_rate} onChange={(e) => setData('daily_rate', e.target.value)} /></Field>
                        <Field label="Nombre de mois"><input type="number" className="tc-input" value={data.credit_months} onChange={(e) => setData('credit_months', e.target.value)} /></Field>
                        <Field label="Avance crédit"><input type="number" className="tc-input" value={data.credit_down_payment} onChange={(e) => setData('credit_down_payment', e.target.value)} /></Field>
                        <Field label="Traite/mois"><input type="number" className="tc-input" value={data.monthly_installment} onChange={(e) => setData('monthly_installment', e.target.value)} /></Field>
                        <Field label="Échéance"><input type="date" className="tc-input" value={data.credit_due_date} onChange={(e) => setData('credit_due_date', e.target.value)} /></Field>
                    </div>
                </section>

                <div className="flex justify-end gap-2"><Link href="/vehicles" className="tc-btn-secondary">Annuler</Link><button className="tc-btn-primary" disabled={processing}><Save className="h-4 w-4" /> Enregistrer</button></div>
            </form>
        </AppLayout>
    );
}
