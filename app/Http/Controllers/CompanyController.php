<?php

namespace App\Http\Controllers;

use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CompanyController extends Controller
{
    public function edit()
    {
        $settings = DB::table('settings')->get()->mapWithKeys(
            fn ($row) => [$row->key => json_decode($row->value, true)]
        );

        return Inertia::render('Settings/Company', ['settings' => $settings]);
    }

    public function update(Request $request, AuditService $audit)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'brand_name' => ['nullable', 'string', 'max:255'],
            'currency' => ['required', 'string', 'max:8'],
            'timezone' => ['required', 'string', 'max:64'],
            'date_format' => ['required', 'string', 'max:16'],
            'theme_primary' => ['nullable', 'string', 'max:7'],
            'theme_accent' => ['nullable', 'string', 'max:7'],
        ]);

        $map = [
            'company.name' => $data['name'],
            'company.brand_name' => $data['brand_name'] ?? null,
            'company.currency' => $data['currency'],
            'company.timezone' => $data['timezone'],
            'company.date_format' => $data['date_format'],
            'theme.primary' => $data['theme_primary'] ?? '#0B1F3A',
            'theme.accent' => $data['theme_accent'] ?? '#1E6FD9',
        ];
        foreach ($map as $key => $value) {
            DB::table('settings')->updateOrInsert(['key' => $key], ['value' => json_encode($value), 'updated_at' => now()]);
        }
        $audit->log('update', 'settings', null, null, $map);

        return back()->with('success', 'Paramètres enregistrés.');
    }
}
