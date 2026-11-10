<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Quote;
use Inertia\Inertia;

class BillingController extends Controller
{
    public function index()
    {
        return Inertia::render('Billing/Index', [
            'counts' => [
                'contracts' => Contract::count(),
                'invoices' => Invoice::count(),
                'quotes' => Quote::count(),
            ],
        ]);
    }

    public function versions()
    {
        return Inertia::render('Billing/Versions', [
            'versions' => $this->versionHistory(),
            'runtime' => [
                'php' => PHP_VERSION,
                'laravel' => app()->version(),
                'environment' => app()->environment(),
            ],
        ]);
    }

    private function versionHistory(): array
    {
        return [
            ['date' => '2026-11-09', 'label' => 'Traites, amortissement, récapitulatif et rapport', 'detail' => 'Import des données métier, écrans Finance et contrôle des valeurs.'],
            ['date' => '2026-11-09', 'label' => 'Listes virtualisées et filtres par colonne', 'detail' => 'Texte 15 px, tri, total collant, restauration du défilement.'],
            ['date' => '2026-11-09', 'label' => 'Serveur Caddy et surveillance', 'detail' => 'Pool php-cgi, caches de production, watchdog et tâche utilisateur.'],
            ['date' => '2026-11-08', 'label' => 'Navigation supérieure et retours du mois', 'detail' => 'Menus groupés, renommage Voitures, adresse de résidence.'],
        ];
    }
}
