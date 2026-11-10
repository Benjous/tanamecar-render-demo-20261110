<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\Payment;
use App\Services\AuditService;
use App\Services\SearchService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request, SearchService $search)
    {
        $query = Payment::query();

        $q = trim($request->string('q')->toString());
        if ($q !== '') {
            $query->where(function ($sub) use ($q, $search) {
                $search->apply($sub, [
                    'payments.id',
                    'payments.amount',
                    'payments.payment_method',
                    'payments.payment_status',
                    'payments.created_at',
                ], $q);
                $sub->orWhereHas('contract', function ($contract) use ($q, $search) {
                    $search->apply($contract, ['reference'], $q);
                    $contract->orWhereHas('client', fn ($client) => $search->apply($client, ['display_name', 'phone', 'email'], $q));
                });
            });
        }
        if ($status = $request->string('status')->toString()) {
            $query->where('payment_status', $status);
        }
        if ($method = $request->string('method')->toString()) {
            $query->where('payment_method', $method);
        }
        if ($from = $request->date('from')) {
            $query->where('created_at', '>=', $from->startOfDay());
        }
        if ($to = $request->date('to')) {
            $query->where('created_at', '<=', $to->endOfDay());
        }

        return Inertia::render('Payments/Index', [
            'payments' => $query
                ->with(['contract:id,reference,client_id', 'contract.client:id,display_name'])
                ->select('id', 'contract_id', 'amount', 'payment_method', 'payment_status', 'created_at')
                ->orderByDesc('created_at')
                ->get(),
            'filters' => $request->only(['q', 'status', 'method', 'from', 'to']),
            'methods' => ['espece', 'tpe', 'virement', 'cheque', 'en_ligne'],
        ]);
    }

    public function create()
    {
        return Inertia::render('Payments/Form', [
            'contracts' => Contract::with('client')->orderByDesc('created_at')->limit(500)->get(['id', 'reference', 'client_id', 'total_amount']),
            'methods' => ['espece', 'tpe', 'virement', 'cheque', 'en_ligne'],
            'statuses' => ['paye', 'impaye', 'echeancier', 'remboursement'],
        ]);
    }

    public function store(Request $request, AuditService $audit)
    {
        $data = $request->validate([
            'contract_id' => ['required', 'exists:contracts,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', 'in:espece,tpe,virement,cheque,en_ligne'],
            'payment_status' => ['required', 'in:paye,impaye,echeancier,remboursement'],
            'remaining_amount' => ['nullable', 'numeric', 'min:0'],
        ]);
        $data['created_by'] = $request->user()->id;
        $payment = Payment::create($data);
        $audit->log('create', 'payments', $payment->id, null, $payment->toArray());
        app(\App\Services\NotificationService::class)->notifyAdmins(
            'payment.created',
            'Nouveau paiement',
            'Paiement de '.number_format((float) $payment->amount, 2, ',', ' ').' MAD enregistré.',
            ['payment_id' => $payment->id, 'contract_id' => $payment->contract_id]
        );

        return redirect()->route('payments.index')->with('success', 'Paiement enregistré.');
    }

    public function destroy(Payment $payment, AuditService $audit)
    {
        $audit->log('delete', 'payments', $payment->id, $payment->toArray());
        $payment->delete();

        return back()->with('success', 'Paiement supprimé.');
    }
}
