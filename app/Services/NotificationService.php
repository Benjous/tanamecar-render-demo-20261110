<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\User;

class NotificationService
{
    public function notifyAdmins(string $type, string $title, string $body, array $data = []): void
    {
        User::query()
            ->where('active', true)
            ->where('is_admin', true)
            ->pluck('id')
            ->each(function (int $userId) use ($type, $title, $body, $data) {
                AppNotification::create([
                    'user_id' => $userId,
                    'type' => $type,
                    'title' => $title,
                    'body' => $body,
                    'data' => $data,
                    'created_at' => now(),
                ]);
            });
    }
}
