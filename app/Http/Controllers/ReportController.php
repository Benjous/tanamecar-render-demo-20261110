<?php

namespace App\Http\Controllers;

use App\Services\SearchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request, SearchService $search)
    {
        $query = DB::table('activity_log')
            ->leftJoin('users', 'users.id', '=', 'activity_log.user_id')
            ->select('activity_log.id', 'activity_log.action', 'activity_log.entity_type', 'activity_log.entity_id', 'activity_log.created_at', 'users.name as user_name')
            ->whereIn('activity_log.entity_type', [
                'clients', 'contracts', 'payments', 'invoices', 'quotes', 'vehicles',
                'vehicle_installments', 'vehicle_amortizations', 'roles', 'users',
            ]);
        $q = trim($request->string('q')->toString());
        if ($q !== '') {
            $search->apply($query, [
                'users.name',
                'users.email',
                'activity_log.entity_type',
                'activity_log.action',
                'activity_log.entity_id',
                'activity_log.created_at',
            ], $q);
        }
        if ($action = $request->string('action')->toString()) {
            $query->where('activity_log.action', $action);
        }
        if ($from = $request->date('from')) {
            $query->where('activity_log.created_at', '>=', $from->startOfDay());
        }
        if ($to = $request->date('to')) {
            $query->where('activity_log.created_at', '<=', $to->endOfDay());
        }
        $rows = $query->orderByDesc('activity_log.created_at')->limit(5000)->get();

        return Inertia::render('Reports/Index', [
            'rows' => $rows,
            'filters' => $request->only(['q', 'action', 'from', 'to']),
            'actions' => DB::table('activity_log')->distinct()->orderBy('action')->pluck('action'),
            'count' => $rows->count(),
        ]);
    }
}
