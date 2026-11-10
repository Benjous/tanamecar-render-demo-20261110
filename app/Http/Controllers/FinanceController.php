<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FinanceController extends Controller
{
    public function index()
    {
        $contractsTotal = (float) DB::table('contracts')->sum('total_amount');
        $paymentsTotal = (float) DB::table('payments')->sum('amount');
        $invoicesTotal = (float) DB::table('invoices')->sum('total');
        $chargesTotal = (float) DB::table('charges')->sum('amount');
        $vehicleCreditsTotal = (float) DB::table('vehicle_credits')->sum('amount');
        $clientAdvance = (float) DB::table('client_credits')->sum('advance');
        $clientRemaining = (float) DB::table('client_credits')->sum('remaining');
        $installmentsTotal = (float) DB::table('vehicle_installments')->sum('amount_current');
        $profitTotal = (float) DB::table('profit_entries')->sum('amount');

        return Inertia::render('Finance/Overview', [
            'metrics' => [
                'contracts_total' => $contractsTotal,
                'payments_total' => $paymentsTotal,
                'invoices_total' => $invoicesTotal,
                'charges_total' => $chargesTotal,
                'vehicle_credits_total' => $vehicleCreditsTotal,
                'client_advance' => $clientAdvance,
                'client_remaining' => $clientRemaining,
                'installments_total' => $installmentsTotal,
                'profit_total' => $profitTotal,
                'cash_balance' => $paymentsTotal - $chargesTotal,
                'contract_remaining' => $contractsTotal - $paymentsTotal,
            ],
            'counts' => [
                'contracts' => DB::table('contracts')->count(),
                'clients' => DB::table('clients')->count(),
                'vehicles' => DB::table('vehicles')->count(),
                'invoices' => DB::table('invoices')->count(),
            ],
            'recentCharges' => DB::table('charges')->orderByDesc('charge_date')->limit(10)->get(),
            'recentProfits' => DB::table('profit_entries')->orderByDesc('entry_date')->limit(10)->get(),
            'recentCredits' => DB::table('client_credits')
                ->leftJoin('clients', 'clients.id', '=', 'client_credits.client_id')
                ->select('client_credits.*', 'clients.display_name as client_name')
                ->orderByDesc('client_credits.credit_date')
                ->limit(10)
                ->get(),
        ]);
    }
}
