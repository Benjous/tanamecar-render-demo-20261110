<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Symfony\Component\Process\Process;

class BackupController extends Controller
{
    public function index()
    {
        $directory = config('backup.directory');
        File::ensureDirectoryExists($directory);

        $files = collect(File::files($directory))
            ->map(fn ($file) => [
                'name' => $file->getFilename(),
                'size' => $file->getSize(),
                'modified_at' => date(DATE_ATOM, $file->getMTime()),
            ])
            ->sortByDesc('modified_at')
            ->values();

        return Inertia::render('Settings/Backups', [
            'runs' => DB::table('backup_runs')->orderByDesc('started_at')->limit(50)->get(),
            'files' => $files,
        ]);
    }

    public function run(Request $request)
    {
        $directory = config('backup.directory');
        File::ensureDirectoryExists($directory);
        $name = 'tanamecar-'.now()->format('Ymd-His').'.dump';
        $path = $directory.DIRECTORY_SEPARATOR.$name;
        $started = now();

        $process = new Process([
            config('backup.binary'),
            '-h', (string) config('database.connections.pgsql.host'),
            '-p', (string) config('database.connections.pgsql.port'),
            '-U', (string) config('database.connections.pgsql.username'),
            '-Fc',
            '-d', (string) config('database.connections.pgsql.database'),
            '-f', $path,
        ]);
        $previousPassword = getenv('PGPASSWORD');
        putenv('PGPASSWORD='.(string) config('database.connections.pgsql.password'));
        $process->setTimeout(300);
        try {
            $process->run();
        } finally {
            putenv($previousPassword === false ? 'PGPASSWORD' : 'PGPASSWORD='.$previousPassword);
        }

        $status = $process->isSuccessful() && File::exists($path) ? 'success' : 'failed';
        $id = DB::table('backup_runs')->insertGetId([
            'type' => 'database',
            'started_at' => $started,
            'finished_at' => now(),
            'size_bytes' => File::exists($path) ? File::size($path) : null,
            'sha256' => File::exists($path) ? hash_file('sha256', $path) : null,
            'encrypted' => false,
            'status' => $status,
            'notes' => $status === 'success' ? $name : mb_substr(mb_convert_encoding($process->getErrorOutput(), 'UTF-8', 'Windows-1252'), 0, 1000),
        ]);

        if ($status !== 'success') {
            return back()->with('error', 'Sauvegarde échouée.');
        }

        return back()->with('success', 'Sauvegarde créée.');
    }
}
