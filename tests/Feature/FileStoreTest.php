<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Media;
use App\Models\User;
use App\Services\FileStoreService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class FileStoreTest extends TestCase
{
    use DatabaseTransactions;

    public function test_file_can_be_served_from_database_when_local_file_is_absent(): void
    {
        $admin = User::create([
            'name' => 'Fichier Admin',
            'email' => 'fichier-'.Str::random(8).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);
        $client = Client::create([
            'display_name' => 'Client Fichier',
            'client_type' => 'particulier',
            'status' => 'actif',
            'created_by' => $admin->id,
        ]);
        $path = 'tests/fallback-'.Str::random(10).'.txt';
        app(FileStoreService::class)->put($path, 'contenu-depuis-la-base', 'text/plain');

        $media = Media::create([
            'mediable_type' => 'slv_locataires',
            'mediable_id' => $client->id,
            'collection' => 'document_identite',
            'path' => $path,
            'mime' => 'text/plain',
            'size_bytes' => 21,
        ]);

        $response = $this->actingAs($admin)->get('/media/'.$media->id);
        $response->assertOk();
        $this->assertStringContainsString('contenu-depuis-la-base', $response->streamedContent());
    }
}
