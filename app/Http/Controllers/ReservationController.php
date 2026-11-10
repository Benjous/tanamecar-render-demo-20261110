<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\Vehicle;
use App\Services\AuditService;
use App\Services\NotificationService;
use App\Services\SequenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReservationController extends Controller
{
    public function convert(Request $request, int $reservation, SequenceService $sequences, AuditService $audit, NotificationService $notifications)
    {
        $row = DB::table('reservations')->where('id', $reservation)->first();
        abort_unless($row, 404);
        abort_unless($request->user()?->canAccessRecord('slv_reservations', 'update', $row), 403, 'Action non autorisée.');

        if (Schema::hasColumn('reservations', 'converted_contract_id') && $row->converted_contract_id) {
            return back()->with('error', 'Réservation déjà convertie.');
        }
        if ($row->status === 'convertie') {
            return back()->with('error', 'Réservation déjà convertie.');
        }

        $contract = DB::transaction(function () use ($row, $request, $sequences) {
            $reference = $sequences->next('contracts');
            $contract = Contract::create([
                'reference' => $reference,
                'reference_format' => 'native_6',
                'reference_normalized' => strtoupper(preg_replace('/[^A-Z0-9]/i', '', $reference)),
                'client_id' => $row->client_id,
                'vehicle_id' => $row->vehicle_id,
                'employee_id' => $row->employee_id,
                'departure_at' => $row->departure_at,
                'return_at' => $row->return_at,
                'days' => $row->days,
                'daily_rate' => $row->daily_rate,
                'total_amount' => $row->total_amount,
                'note' => $row->description,
                'returned' => false,
                'data_quality_status' => 'ok',
                'created_by' => $request->user()->id,
            ]);

            if ($contract->vehicle_id) {
                Vehicle::whereKey($contract->vehicle_id)->update(['status' => 'en_location']);
            }

            $update = ['status' => 'convertie', 'updated_at' => now()];
            if (Schema::hasColumn('reservations', 'converted_contract_id')) {
                $update['converted_contract_id'] = $contract->id;
                $update['converted_at'] = now();
            }
            DB::table('reservations')->where('id', $row->id)->update($update);

            return $contract;
        });

        $audit->log('convert', 'reservations', $row->id, (array) $row, ['contract_id' => $contract->id]);
        $audit->log('create', 'contracts', $contract->id, null, $contract->toArray());
        $notifications->notifyAdmins('contract.created', 'Nouvelle location', $contract->reference, ['contract_id' => $contract->id]);

        return redirect()->route('contracts.show', $contract)->with('success', 'Réservation convertie.');
    }
}
