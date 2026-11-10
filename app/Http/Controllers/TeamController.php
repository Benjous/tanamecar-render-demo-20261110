<?php

namespace App\Http\Controllers;

use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TeamController extends Controller
{
    public function index()
    {
        $teams = DB::table('teams')->orderBy('name')->get()->map(function ($team) {
            $team->member_ids = DB::table('team_user')->where('team_id', $team->id)->pluck('user_id')->all();
            return $team;
        });

        return Inertia::render('Settings/Teams', [
            'teams' => $teams,
            'users' => DB::table('users')->where('active', true)->orderBy('name')->get(['id', 'name', 'email']),
        ]);
    }

    public function store(Request $request, AuditService $audit)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'member_ids' => ['array'],
            'member_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $id = DB::transaction(function () use ($data) {
            $id = DB::table('teams')->insertGetId(['name' => $data['name'], 'created_at' => now(), 'updated_at' => now()]);
            foreach ($data['member_ids'] ?? [] as $userId) {
                DB::table('team_user')->insert(['team_id' => $id, 'user_id' => $userId]);
            }
            return $id;
        });
        $audit->log('create', 'teams', $id, null, $data);

        return back()->with('success', 'Équipe créée.');
    }

    public function update(Request $request, int $team, AuditService $audit)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'member_ids' => ['array'],
            'member_ids.*' => ['integer', 'exists:users,id'],
        ]);
        $before = DB::table('teams')->where('id', $team)->first();
        abort_unless($before, 404);

        DB::transaction(function () use ($team, $data) {
            DB::table('teams')->where('id', $team)->update(['name' => $data['name'], 'updated_at' => now()]);
            DB::table('team_user')->where('team_id', $team)->delete();
            foreach ($data['member_ids'] ?? [] as $userId) {
                DB::table('team_user')->insert(['team_id' => $team, 'user_id' => $userId]);
            }
        });
        $audit->log('update', 'teams', $team, (array) $before, $data);

        return back()->with('success', 'Équipe mise à jour.');
    }

    public function destroy(Request $request, int $team, AuditService $audit)
    {
        $before = DB::table('teams')->where('id', $team)->first();
        abort_unless($before, 404);
        DB::transaction(function () use ($team) {
            DB::table('team_user')->where('team_id', $team)->delete();
            DB::table('teams')->where('id', $team)->delete();
        });
        $audit->log('delete', 'teams', $team, (array) $before);

        return back()->with('success', 'Équipe supprimée.');
    }
}
