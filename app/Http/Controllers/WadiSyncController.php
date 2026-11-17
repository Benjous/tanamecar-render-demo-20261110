<?php

namespace App\Http\Controllers;

use App\Models\WadiRecord;
use App\Models\WadiSyncRun;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WadiSyncController extends Controller
{
    public function index()
    {
        $runs = WadiSyncRun::query()->latest('id')->limit(30)->get();
        $lastRun = $runs->first();
        $lastSuccess = WadiSyncRun::query()
            ->where('status', 'success')
            ->latest('finished_at')
            ->first();

        $nextAttempt = null;
        if ((bool) config('wadi.enabled')) {
            $nextAttempt = ($lastRun?->started_at ?? now())
                ->copy()
                ->addMinutes((int) config('wadi.interval_minutes', 15));
        }

        $entities = WadiRecord::query()
            ->select('entity', DB::raw('count(*) as total'), DB::raw('max(last_seen_at) as last_seen_at'))
            ->groupBy('entity')
            ->orderBy('entity')
            ->get()
            ->map(fn ($row) => [
                'entity' => $row->entity,
                'total' => (int) $row->total,
                'last_seen_at' => $row->last_seen_at,
            ]);

        return Inertia::render('Settings/WadiSync', [
            'runs' => $runs,
            'lastRun' => $lastRun,
            'lastSuccess' => $lastSuccess,
            'nextAttempt' => $nextAttempt,
            'entities' => $entities,
            'configuration' => [
                'enabled' => (bool) config('wadi.enabled'),
                'apply' => (bool) config('wadi.apply'),
                'interval' => (int) config('wadi.interval_minutes', 15),
                'credentials_configured' => filled(config('wadi.email')) && filled(config('wadi.password')),
            ],
        ]);
    }

    public function run(Request $request)
    {
        $running = WadiSyncRun::query()
            ->where('status', 'running')
            ->where('started_at', '>', now()->subMinutes(30))
            ->exists();

        if ($running) {
            return back()->with('error', 'Une synchronisation est déjà en cours.');
        }

        if (! filled(config('wadi.email')) || ! filled(config('wadi.password'))) {
            return back()->with('error', 'Identifiants WADI absents du fichier .env local.');
        }

        set_time_limit(1200);

        $run = WadiSyncRun::create([
            'status' => 'running',
            'mode' => (bool) config('wadi.apply') ? 'apply' : 'dry-run',
            'started_at' => now(),
        ]);

        $artisan = base_path('artisan');
        $command = 'start /B "" '.escapeshellarg(PHP_BINARY).' '.escapeshellarg($artisan)
            .' wadi:sync --run-id='.$run->id.' > NUL 2>&1';
        $handle = PHP_OS_FAMILY === 'Windows' ? @popen('cmd /c '.$command, 'r') : null;
        if (PHP_OS_FAMILY !== 'Windows') {
            @exec('nohup '.escapeshellarg(PHP_BINARY).' '.escapeshellarg($artisan).' wadi:sync --run-id='.$run->id.' > /dev/null 2>&1 &');
        }

        if ($handle === false) {
            $run->update([
                'status' => 'failed',
                'finished_at' => now(),
                'message' => 'Impossible de lancer la synchronisation en arrière-plan.',
            ]);

            return back()->with('error', 'Impossible de lancer la synchronisation WADI.');
        }

        if ($handle) {
            pclose($handle);
        }

        return back()->with('success', 'Synchronisation WADI lancée. Le suivi se met à jour dans le tableau ci-dessous.');
    }
}
