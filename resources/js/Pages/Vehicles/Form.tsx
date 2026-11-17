import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

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
            <form onSubmit={submit}>
                <table className="al-form-table">
                    <tbody>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Nom du voiture *</td>
                            <td>
                                <input value={data.display_name} onChange={(e) => setData('display_name', e.target.value)} />
                                {errors.display_name && <div className="al-login-error">{errors.display_name}</div>}
                            </td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Statut *</td>
                            <td><select value={data.status} onChange={(e) => setData('status', e.target.value)}><option value="disponible">Disponible</option><option value="en_location">En location</option><option value="en_reparation">En réparation</option><option value="hors_service">Hors service</option></select></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Mode *</td>
                            <td><select value={data.operating_mode} onChange={(e) => setData('operating_mode', e.target.value)}><option value="location">Location</option><option value="sous_location">Sous-location</option><option value="service">Service</option></select></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Marque</td>
                            <td><select value={data.brand_id} onChange={(e) => setData('brand_id', e.target.value)}><option value="">-</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Modèle</td>
                            <td><select value={data.model_id} onChange={(e) => setData('model_id', e.target.value)}><option value="">-</option>{models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Couleur</td>
                            <td><select value={data.color_id} onChange={(e) => setData('color_id', e.target.value)}><option value="">-</option>{colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Catégorie</td>
                            <td><select value={data.category_id} onChange={(e) => setData('category_id', e.target.value)}><option value="">-</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Matricule</td>
                            <td><input value={data.plate_number} onChange={(e) => setData('plate_number', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>CPI WW</td>
                            <td><input value={data.cpi_ww} onChange={(e) => setData('cpi_ww', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Mise en circulation</td>
                            <td><input type="date" value={data.first_registration_date} onChange={(e) => setData('first_registration_date', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Puissance fiscale</td>
                            <td><input type="number" value={data.fiscal_power} onChange={(e) => setData('fiscal_power', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Carburant</td>
                            <td><select value={data.fuel_type} onChange={(e) => setData('fuel_type', e.target.value)}><option value="">-</option><option value="Diesel">Diesel</option><option value="Essence">Essence</option><option value="Hybrid">Hybrid</option><option value="electrique">Électrique</option></select></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Boîte</td>
                            <td><select value={data.gearbox} onChange={(e) => setData('gearbox', e.target.value)}><option value="">-</option><option value="Automatique">Automatique</option><option value="Manuel">Manuel</option></select></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>N° châssis</td>
                            <td><input value={data.chassis_number} onChange={(e) => setData('chassis_number', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Km</td>
                            <td><input type="number" value={data.km} onChange={(e) => setData('km', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Prix d'achat</td>
                            <td><input type="number" value={data.purchase_price} onChange={(e) => setData('purchase_price', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Prix/jour</td>
                            <td><input type="number" value={data.daily_rate} onChange={(e) => setData('daily_rate', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Nombre de mois</td>
                            <td><input type="number" value={data.credit_months} onChange={(e) => setData('credit_months', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Avance crédit</td>
                            <td><input type="number" value={data.credit_down_payment} onChange={(e) => setData('credit_down_payment', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Traite/mois</td>
                            <td><input type="number" value={data.monthly_installment} onChange={(e) => setData('monthly_installment', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Échéance</td>
                            <td><input type="date" value={data.credit_due_date} onChange={(e) => setData('credit_due_date', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td />
                            <td className="al-form-actions">
                                <button type="submit" className="al-button al-button-primary" disabled={processing}>{processing ? 'Enregistrement...' : 'Valider'}</button>
                                <Link href="/vehicles" className="al-button" style={{ marginLeft: 6 }}>Annuler</Link>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </form>
        </AppLayout>
    );
}
