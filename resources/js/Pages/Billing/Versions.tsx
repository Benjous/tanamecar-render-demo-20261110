import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function Versions({ versions, runtime }: { versions: Array<{ date: string; label: string; detail: string }>; runtime: Record<string, string> }) {
    return (
        <AppLayout>
            <Head title="Mise à jour" />
            <table className="al-data-table" style={{ width: '600px' }}>
                <thead><tr><td>PHP</td><td>LARAVEL</td><td>ENVIRONNEMENT</td></tr></thead>
                <tbody>
                    <tr><td>{runtime.php}</td><td>{runtime.laravel}</td><td>{runtime.environment}</td></tr>
                </tbody>
            </table>

            <h3 style={{ font: 'bold 14px Tahoma', margin: '8px 0 4px' }}>Changements livrés</h3>
            <table className="al-data-table">
                <thead><tr><td style={{ width: 110 }}>DATE</td><td style={{ width: 260 }}>TITRE</td><td>DETAIL</td></tr></thead>
                <tbody>
                    {versions.map((version) => (
                        <tr key={`${version.date}-${version.label}`}>
                            <td>{version.date}</td>
                            <td>{version.label}</td>
                            <td>{version.detail}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </AppLayout>
    );
}
