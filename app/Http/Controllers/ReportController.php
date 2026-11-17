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
        $user = $request->user();
        $isAdmin = (bool) $user?->is_admin;

        $query = DB::table('activity_log')
            ->leftJoin('users', 'users.id', '=', 'activity_log.user_id')
            ->select(
                'activity_log.id',
                'activity_log.user_id',
                'activity_log.action',
                'activity_log.entity_type',
                'activity_log.entity_id',
                'activity_log.before',
                'activity_log.after',
                'activity_log.impersonator_id',
                'activity_log.impersonator_name',
                'activity_log.created_at',
                'users.name as user_name',
                'users.email as user_email',
            );

        if (! $isAdmin) {
            $query->where(function ($scope) use ($user) {
                $scope->where('activity_log.user_id', $user->id)
                    ->orWhere(function ($impersonation) use ($user) {
                        $impersonation
                            ->whereIn('activity_log.action', ['impersonation_start', 'impersonation_stop'])
                            ->where('activity_log.entity_id', $user->id);
                    });
            });
        }

        if ($isAdmin && ($userId = $request->integer('user_id'))) {
            $query->where('activity_log.user_id', $userId);
        }

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

        if ($action = trim($request->string('action')->toString())) {
            $query->where('activity_log.action', $action);
        }

        if ($module = trim($request->string('module')->toString())) {
            $query->where('activity_log.entity_type', $module);
        }

        if ($date = $request->date('date')) {
            $query->whereDate('activity_log.created_at', $date->toDateString());
        }

        if ($heure = trim($request->string('heure')->toString())) {
            $query->whereRaw("to_char(activity_log.created_at, 'HH24:MI') like ?", ["{$heure}%"]);
        }

        if ($domaine = trim($request->string('domaine')->toString())) {
            $query->where('activity_log.entity_type', 'ilike', "%{$domaine}%");
        }

        if ($from = $request->date('from')) {
            $query->where('activity_log.created_at', '>=', $from->startOfDay());
        }

        if ($to = $request->date('to')) {
            $query->where('activity_log.created_at', '<=', $to->endOfDay());
        }

        $rows = $query->orderByDesc('activity_log.created_at')->limit(5000)->get()
            ->map(function ($row) {
                $row->before = $row->before ? json_decode($row->before, true) : null;
                $row->after = $row->after ? json_decode($row->after, true) : null;

                return $row;
            });

        $users = $isAdmin
            ? DB::table('users')->orderBy('name')->get(['id', 'name', 'email'])
            : DB::table('users')->where('id', $user->id)->get(['id', 'name', 'email']);

        return Inertia::render('Reports/Index', [
            'rows' => $rows,
            'filters' => $request->only(['q', 'action', 'module', 'user_id', 'from', 'to', 'date', 'heure', 'domaine']),
            'actions' => DB::table('activity_log')->distinct()->orderBy('action')->pluck('action'),
            'modules' => DB::table('activity_log')
                ->whereNotNull('entity_type')
                ->distinct()
                ->orderBy('entity_type')
                ->pluck('entity_type'),
            'users' => $users,
            'canViewAll' => $isAdmin,
            'count' => $rows->count(),
        ]);
    }
}
