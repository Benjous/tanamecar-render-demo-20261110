<?php

namespace App\Http\Controllers;

use App\Services\ArchiveService;
use App\Services\SearchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ExportController extends Controller
{
    public function index()
    {
        return Inertia::render('Exports/Index', [
            'exports' => [
                ['label' => 'Locations', 'description' => 'Contrats, clients, vehicules, dates et montants.', 'href' => '/exports/contracts.csv'],
                ['label' => 'Clients', 'description' => 'Coordonnees et statut des clients.', 'href' => '/exports/clients.csv'],
                ['label' => 'Vehicules', 'description' => 'Parc, plaques, statut et tarifs.', 'href' => '/exports/vehicles.csv'],
                ['label' => 'Paiements', 'description' => 'Encaissements et moyens de paiement.', 'href' => '/exports/payments.csv'],
                ['label' => 'Factures', 'description' => 'References, dates, statuts et totaux.', 'href' => '/exports/invoices.csv'],
            ],
        ]);
    }

    public function csv(Request $request, string $entity, SearchService $search)
    {
        $map = [
            'contracts' => ['table' => 'contracts', 'columns' => ['id', 'reference', 'client_id', 'vehicle_id', 'departure_at', 'return_at', 'daily_rate', 'days', 'total_amount', 'paid_amount_recorded', 'remaining_recorded', 'returned', 'data_quality_status']],
            'clients' => ['table' => 'clients', 'columns' => ['id', 'display_name', 'client_type', 'status', 'phone', 'email', 'identity_number', 'created_at']],
            'vehicles' => ['table' => 'vehicles', 'columns' => ['id', 'display_name', 'plate_number', 'status', 'operating_mode', 'brand_id', 'model_id', 'km', 'daily_rate']],
            'payments' => ['table' => 'payments', 'columns' => ['id', 'contract_id', 'amount', 'payment_method', 'payment_status', 'created_at']],
            'invoices' => ['table' => 'invoices', 'columns' => ['id', 'reference', 'client_id', 'status', 'issued_at', 'total', 'file_reference']],
        ];
        abort_unless(isset($map[$entity]), 404);
        $config = $map[$entity];
        $resource = [
            'contracts' => 'slv_contrats',
            'clients' => 'slv_locataires',
            'vehicles' => 'slv_vehicules',
            'payments' => 'slv_paiements',
            'invoices' => 'factures',
        ][$entity];
        abort_unless($request->user()?->canDo($resource, 'view'), 403, 'Export non autorisé.');

        $query = ArchiveService::exclude(DB::table($config['table']), $config['table']);
        $q = trim($request->string('q')->toString());

        if ($q !== '') {
            match ($entity) {
                'contracts' => $query->where(function ($sub) use ($q, $search) {
                    $search->apply($sub, ['contracts.reference', 'contracts.id', 'contracts.total_amount', 'contracts.departure_at', 'contracts.return_at', 'contracts.note'], $q);
                    $sub->orWhereIn('contracts.client_id', DB::table('clients')->select('id')->where(function ($clientQuery) use ($q, $search): void {
                        $search->apply($clientQuery, ['display_name', 'phone', 'email'], $q);
                    }));
                    $sub->orWhereIn('contracts.vehicle_id', DB::table('vehicles')->select('id')->where(function ($vehicleQuery) use ($q, $search): void {
                        $search->apply($vehicleQuery, ['display_name', 'plate_number'], $q);
                    }));
                }),
                'clients' => $query->where(function ($sub) use ($q, $search) {
                    $search->apply($sub, ['clients.display_name', 'clients.phone', 'clients.email', 'clients.address', 'clients.identity_number', 'clients.client_type', 'clients.status', 'clients.id'], $q);
                }),
                'vehicles' => $query->where(function ($sub) use ($q, $search) {
                    $search->apply($sub, ['vehicles.display_name', 'vehicles.plate_number', 'vehicles.chassis_number', 'vehicles.cpi_ww', 'vehicles.status', 'vehicles.operating_mode', 'vehicles.km', 'vehicles.daily_rate', 'vehicles.id'], $q);
                }),
                'payments' => $query->where(function ($sub) use ($q, $search) {
                    $search->apply($sub, ['payments.id', 'payments.amount', 'payments.payment_method', 'payments.payment_status', 'payments.created_at'], $q);
                    $sub->orWhereIn('payments.contract_id', DB::table('contracts')->select('id')->where(function ($contractQuery) use ($q, $search): void {
                        $search->apply($contractQuery, ['reference'], $q);
                        $contractQuery->orWhereIn('client_id', DB::table('clients')->select('id')->where(function ($clientQuery) use ($q, $search): void {
                            $search->apply($clientQuery, ['display_name', 'phone', 'email'], $q);
                        }));
                    }));
                }),
                'invoices' => $query->where(function ($sub) use ($q, $search) {
                    $search->apply($sub, ['invoices.reference', 'invoices.file_reference', 'invoices.subject', 'invoices.status', 'invoices.total', 'invoices.issued_at', 'invoices.id'], $q);
                    $sub->orWhereIn('invoices.client_id', DB::table('clients')->select('id')->where(function ($clientQuery) use ($q, $search): void {
                        $search->apply($clientQuery, ['display_name', 'phone', 'email'], $q);
                    }));
                }),
                default => null,
            };
        }

        if ($status = $request->string('status')->toString()) {
            if ($entity === 'contracts') {
                match ($status) {
                    'open' => $query->where('returned', false),
                    'returned' => $query->where('returned', true),
                    'overdue' => $query->where('returned', false)->where('return_at', '<', now()->startOfDay()),
                    default => null,
                };
            } elseif ($entity === 'clients') {
                $query->where('status', $status);
            } elseif ($entity === 'vehicles') {
                $query->where('status', $status);
            } elseif ($entity === 'payments') {
                $query->where('payment_status', $status);
            } elseif ($entity === 'invoices') {
                $query->where('status', $status);
            }
        }

        if ($type = $request->string('type')->toString()) {
            $query->where('client_type', $type);
        }
        if ($mode = $request->string('mode')->toString()) {
            $query->where('operating_mode', $mode);
        }
        if ($brandId = $request->integer('brand_id')) {
            $query->where('brand_id', $brandId);
        }
        if ($categoryId = $request->integer('category_id')) {
            $query->where('category_id', $categoryId);
        }
        if ($method = $request->string('method')->toString()) {
            $query->where('payment_method', $method);
        }
        if ($entity === 'contracts' && ($due = $request->string('due')->toString()) !== '') {
            $today = now()->startOfDay();
            $start = match ($due) {
                'today' => $today,
                'tomorrow' => $today->copy()->addDay(),
                'after_tomorrow' => $today->copy()->addDays(2),
                'month' => $today->copy()->startOfMonth(),
                default => null,
            };
            if ($start) {
                $end = $due === 'month' ? $start->copy()->addMonth() : $start->copy()->addDay();
                $query->where('returned', false)
                    ->whereNotNull('return_at')
                    ->where('return_at', '>=', $start)
                    ->where('return_at', '<', $end);
            }
        }
        if ($from = $request->date('date_from')) {
            $query->where('departure_at', '>=', $from->startOfDay());
        }
        if ($to = $request->date('date_to')) {
            $query->where('departure_at', '<=', $to->endOfDay());
        }
        if ($from = $request->date('from')) {
            $column = $entity === 'invoices' ? 'issued_at' : ($entity === 'payments' ? 'created_at' : null);
            if ($column) {
                $query->where($column, '>=', $from->startOfDay());
            }
        }
        if ($to = $request->date('to')) {
            $column = $entity === 'invoices' ? 'issued_at' : ($entity === 'payments' ? 'created_at' : null);
            if ($column) {
                $query->where($column, '<=', $to->endOfDay());
            }
        }

        return response()->streamDownload(function () use ($query, $config) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $config['columns'], ';');
            $query->orderBy('id')->chunk(500, function ($rows) use ($out, $config) {
                foreach ($rows as $row) {
                    $line = [];
                    foreach ($config['columns'] as $column) {
                        $line[] = $row->{$column} ?? '';
                    }
                    fputcsv($out, $line, ';');
                }
            });
            fclose($out);
        }, "tanamecar-{$entity}-".now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
