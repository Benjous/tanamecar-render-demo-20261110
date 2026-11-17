import { Link } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Inbox, Printer, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
    return (
        <div className="workspace-page-toolbar">
            <div className="workspace-page-heading">
                <h1 className="workspace-page-title">{title}</h1>
                {subtitle && <div className="workspace-page-subtitle">{subtitle}</div>}
            </div>
            {actions && <div className="workspace-page-actions">{actions}</div>}
        </div>
    );
}

export function StatCard({
    label, value, hint, icon, tone = 'brand', href, testId,
}: {
    label: string;
    value: string | number;
    hint?: string;
    icon?: ReactNode;
    tone?: 'brand' | 'emerald' | 'amber' | 'rose' | 'slate';
    href?: string;
    testId?: string;
}) {
    const tones: Record<string, string> = {
        brand: 'workspace-counter-brand',
        emerald: 'workspace-counter-green',
        amber: 'workspace-counter-orange',
        rose: 'workspace-counter-red',
        slate: 'workspace-counter-slate',
    };
    const className = cn('workspace-counter', tones[tone]);
    const content = (
        <>
            {icon && <span className="workspace-counter-icon">{icon}</span>}
            <span className="workspace-counter-label">{label}</span>
            <strong className="workspace-counter-value">{value}</strong>
            {hint && <span className="workspace-counter-hint">{hint}</span>}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={className} aria-label={`Voir ${label}`} data-testid={testId}>
                {content}
            </Link>
        );
    }

    return <div className={className} data-testid={testId}>{content}</div>;
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: string }) {
    return <span className={cn('workspace-badge', tone)}>{children}</span>;
}

export function EmptyState({ title = 'Aucune donnee', description, action }: { title?: string; description?: string; action?: ReactNode }) {
    return (
        <div className="workspace-empty">
            <div className="workspace-empty-icon"><Inbox className="h-5 w-5" /></div>
            <div className="workspace-empty-title">{title}</div>
            {description && <div className="workspace-empty-description">{description}</div>}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}

export function PrintButton({ label = 'Imprimer' }: { label?: string }) {
    return <button type="button" className="tc-btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> {label}</button>;
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
            <div className="relative w-full max-w-lg border border-slate-400 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-300 bg-slate-100 px-4 py-2">
                    <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:bg-slate-200">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="px-4 py-4">{children}</div>
                {footer && <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2">{footer}</div>}
            </div>
        </div>,
        document.body,
    );
}

export function ConfirmButton({ label, onConfirm, variant = 'danger', title = 'Confirmer l\'action', description = 'Cette action est definitive. Voulez-vous continuer ?' }: { label: ReactNode; onConfirm: () => void; variant?: 'danger' | 'secondary'; title?: string; description?: string }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={variant === 'danger' ? 'tc-btn-danger' : 'tc-btn-secondary'}
            >
                {label}
            </button>
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={title}
                footer={
                    <>
                        <button className="tc-btn-secondary" onClick={() => setOpen(false)}>Annuler</button>
                        <button className="tc-btn-danger" onClick={() => { setOpen(false); onConfirm(); }}>Confirmer</button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">{description}</p>
            </Modal>
        </>
    );
}

export function Field({ label, error, children, hint }: { label: string; error?: string; children: ReactNode; hint?: string }) {
    return (
        <label className="block">
            <span className="tc-label">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
            {error && <span className="mt-1 flex items-center gap-1 text-[11px] text-rose-600"><AlertCircle className="h-3 w-3" />{error}</span>}
        </label>
    );
}

export function SuccessBanner({ message }: { message?: string | null }) {
    if (!message) return null;
    return <div className="workspace-flash workspace-flash-success"><CheckCircle2 className="h-4 w-4" />{message}</div>;
}
