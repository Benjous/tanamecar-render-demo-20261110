<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ImportTest extends TestCase
{
    use DatabaseTransactions;

    public function test_csv_preview_and_confirmed_import(): void
    {
        Storage::fake('local');
        $admin = User::create([
            'name' => 'Import Admin',
            'email' => 'import-admin-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);

        $csv = "display_name;client_type;status;phone;email\n";
        $csv .= "Client Importé;particulier;actif;+212600009999;import-".Str::random(5)."@example.test\n";

        $this->actingAs($admin)
            ->post('/settings/import/preview', [
                'entity' => 'clients',
                'file' => UploadedFile::fake()->createWithContent('clients.csv', $csv),
            ])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Settings/Import')
                ->where('preview.stats.ok', 1)
                ->where('preview.stats.error', 0)
            );

        Storage::disk('local')->put('imports/testtoken.csv', $csv);

        $this->actingAs($admin)
            ->post('/settings/import', ['entity' => 'clients', 'token' => 'testtoken'])
            ->assertRedirect('/settings/import');

        $this->assertDatabaseHas('clients', ['display_name' => 'Client Importé']);
        $this->assertDatabaseHas('import_batches', ['record_count' => 1]);
    }
}
