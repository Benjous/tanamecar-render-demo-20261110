import { Head } from '@inertiajs/react';
import { Download, FileText } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { PageHeader } from '@/components/ui';

type ExportItem = {
    label: string;
    description: string;
    href: string;
};

export default function ExportsIndex({ exports }: { exports: ExportItem[] }) {
    return (
        <AppLayout>
            <Head title="Exports" />
            <PageHeader title="Exports" />
            <div className="workspace-table-shell" data-testid="exports-table">
                <div className="workspace-table-toolbar">
                    <span className="workspace-table-total">Exports disponibles</span>
                    <span>{exports.length} formats</span>
                </div>
                <table className="tc-table w-full">
                    <thead>
                        <tr>
                            <th>Export</th>
                            <th>Contenu</th>
                            <th>Format</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exports.map((item) => (
                            <tr key={item.href}>
                                <td className="font-bold text-brand-800"><FileText className="mr-1 inline h-3.5 w-3.5" />{item.label}</td>
                                <td>{item.description}</td>
                                <td>CSV UTF-8</td>
                                <td className="text-right">
                                    <a href={item.href} className="tc-btn-primary inline-flex">
                                        <Download className="h-3.5 w-3.5" /> Télécharger
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
