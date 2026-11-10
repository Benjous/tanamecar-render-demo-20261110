<?php

namespace App\Services;

use App\Models\StoredFile;

class FileStoreService
{
    public function put(string $path, string $contents, ?string $mime = null): StoredFile
    {
        return StoredFile::query()->updateOrCreate(
            ['path' => $path],
            [
                'content' => base64_encode($contents),
                'mime' => $mime,
                'size_bytes' => strlen($contents),
            ],
        );
    }

    public function get(string $path): ?StoredFile
    {
        return StoredFile::query()->where('path', $path)->first();
    }

    public function importLocalFile(string $path, ?string $mime = null): bool
    {
        $full = storage_path('app/private/'.$path);
        if (! is_file($full)) {
            return false;
        }

        $this->put($path, (string) file_get_contents($full), $mime);

        return true;
    }
}
