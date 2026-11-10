<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Ne crée aucun compte fictif.
     * Un compte initial ne peut être créé que par une configuration explicite.
     */
    public function run(): void
    {
        $email = trim((string) env('TANAME_BOOTSTRAP_ADMIN_EMAIL', ''));
        $password = (string) env('TANAME_BOOTSTRAP_ADMIN_PASSWORD', '');

        if ($email === '' || $password === '') {
            $this->command?->info('Aucun compte initial créé : TANAME_BOOTSTRAP_ADMIN_EMAIL et TANAME_BOOTSTRAP_ADMIN_PASSWORD ne sont pas définis.');

            return;
        }

        if (app()->environment('production') && ! filter_var(env('TANAME_ALLOW_BOOTSTRAP_SEED', false), FILTER_VALIDATE_BOOLEAN)) {
            $this->command?->warn('Création du compte initial refusée en production sans TANAME_ALLOW_BOOTSTRAP_SEED=true.');

            return;
        }

        User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => env('TANAME_BOOTSTRAP_ADMIN_NAME', 'Administrateur'),
                'password' => Hash::make($password),
                'is_admin' => true,
                'active' => true,
            ],
        );
    }
}
