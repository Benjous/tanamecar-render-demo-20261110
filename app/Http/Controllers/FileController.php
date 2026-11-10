<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Media;
use App\Services\FileStoreService;

class FileController extends Controller
{
    public function media(Media $media)
    {
        $this->authorizeEntity($media->mediable_type);
        return $this->download($media->path, basename($media->path));
    }

    public function document(Document $document)
    {
        $this->authorizeEntity($document->documentable_type);
        return $this->download($document->path, $document->name ?? basename($document->path));
    }

    private function authorizeEntity(?string $type): void
    {
        if (auth()->user()?->isAdmin()) {
            return;
        }

        $resource = [
            'slv_contrats' => 'slv_contrats',
            'slv_locataires' => 'slv_locataires',
            'slv_vehicules' => 'slv_vehicules',
            'factures' => 'factures',
            'devis' => 'devis',
        ][$type] ?? null;

        abort_unless($resource && auth()->user()?->canDo($resource, 'view'), 403, 'Document non autorisé.');
    }

    private function download(?string $path, string $name)
    {
        abort_unless($path, 404);

        $full = storage_path('app/private/'.$path);
        if (is_file($full)) {
            return response()->download($full, $name);
        }

        $stored = app(FileStoreService::class)->get($path);
        abort_unless($stored, 404, 'Fichier introuvable.');

        return response()->streamDownload(
            function () use ($stored): void {
                echo base64_decode($stored->content, true) ?: '';
            },
            $name,
            ['Content-Type' => $stored->mime ?? 'application/octet-stream'],
        );
    }
}
