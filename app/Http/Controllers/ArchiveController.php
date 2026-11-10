<?php

namespace App\Http\Controllers;

use App\Services\ArchiveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ArchiveController extends Controller
{
    public function index(ArchiveService $service)
    {
        return Inertia::render('Settings/Archive', [
            'dryRun' => $service->dryRun(),
            'batches' => DB::table('archived_records')
                ->select('batch_id', DB::raw('count(*) as total'), DB::raw('min(created_at) as created_at'))
                ->groupBy('batch_id')->orderByDesc('created_at')->get(),
            'includeArchives' => (bool) session('include_archives', false),
        ]);
    }

    public function dryRun(ArchiveService $service)
    {
        return response()->json(['rows' => $service->dryRun()]);
    }

    public function apply(Request $request, ArchiveService $service)
    {
        $result = $service->apply($request->user()->id);
        return back()->with('success', "Archivage simulé et appliqué : {$result['records']} ligne(s), lot {$result['batch']}. Aucune suppression.");
    }

    public function restore(Request $request, ArchiveService $service)
    {
        $data = $request->validate(['batch' => ['required', 'string']]);
        $count = $service->restore($data['batch']);
        return back()->with('success', "Restauration du lot : {$count} ligne(s) réactivée(s).");
    }

    public function toggle(Request $request)
    {
        $request->session()->put('include_archives', $request->boolean('include'));
        return back();
    }
}
