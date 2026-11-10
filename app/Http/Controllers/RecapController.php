<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\VehicleInstallment;
use App\Services\DeadlineService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class RecapController extends Controller
{
    public function index(DeadlineService $deadlines): JsonResponse
    {
        $today = CarbonImmutable::now('Africa/Casablanca')->startOfDay();
        $soon = $today->addDays(30);
        $unpaid = VehicleInstallment::query()->where('status', 'unpaid')->whereNotNull('due_date');
        $overdueInstallments = (clone $unpaid)->whereDate('due_date', '<', $today->toDateString())->count();
        $soonInstallments = (clone $unpaid)->whereDate('due_date', '>=', $today->toDateString())->whereDate('due_date', '<=', $soon->toDateString())->count();
        $contractOverdue = Contract::query()->overdue()->count();
        $contractMonth = Contract::query()->dueBucket('month')->count();

        $items = [
            ['key' => 'installments_overdue', 'label' => 'Traites dépassées', 'count' => $overdueInstallments, 'tone' => 'rose', 'href' => '/vehicle-installments?due=overdue&status=unpaid'],
            ['key' => 'installments_soon', 'label' => 'Traites proches, 30 jours', 'count' => $soonInstallments, 'tone' => 'amber', 'href' => '/vehicle-installments?due=soon&status=unpaid'],
            ['key' => 'contracts_overdue', 'label' => 'Retours dépassés', 'count' => $contractOverdue, 'tone' => 'rose', 'href' => '/contracts?status=overdue'],
            ['key' => 'contracts_month', 'label' => 'Retours du mois', 'count' => $contractMonth, 'tone' => 'amber', 'href' => '/contracts?due=month'],
        ];

        $deadlineRecap = $deadlines->recap(10);
        foreach ($deadlineRecap['items'] as &$item) {
            $item['can_complete'] = auth()->user()?->canDo('deadlines', 'update') ?? false;
        }
        unset($item);

        return response()->json([
            'items' => $items,
            'deadlines' => $deadlineRecap,
            'total' => array_sum(array_column($items, 'count')),
            'refreshed_at' => now('Africa/Casablanca')->toIso8601String(),
            'threshold_days' => 30,
        ]);
    }
}
