<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index()
    {
        $notifications = AppNotification::where('user_id', auth()->id())
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function read(int $id)
    {
        AppNotification::where('user_id', auth()->id())
            ->whereKey($id)
            ->update(['read_at' => now()]);

        return back();
    }

    public function readAll()
    {
        AppNotification::where('user_id', auth()->id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return back()->with('success', 'Notifications marquées comme lues.');
    }
}

