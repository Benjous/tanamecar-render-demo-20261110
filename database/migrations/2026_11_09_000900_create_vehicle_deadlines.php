<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deadline_rules', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('maintenance_type_id')->unique()->constrained('maintenance_types')->cascadeOnDelete();
            $table->unsignedInteger('alert_days')->default(30);
            $table->decimal('alert_km', 14, 2)->default(500);
            $table->timestampsTz();
        });

        Schema::create('vehicle_deadlines', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->foreignId('maintenance_type_id')->nullable()->constrained('maintenance_types')->nullOnDelete();
            $table->string('title');
            $table->date('due_date')->nullable();
            $table->decimal('due_km', 14, 2)->nullable();
            $table->string('legacy_status', 20)->nullable();
            $table->string('legacy_key', 120)->nullable()->unique();
            $table->string('source', 20)->default('manual');
            $table->text('source_label')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('completion_note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
            $table->index(['vehicle_id', 'completed_at']);
            $table->index(['due_date']);
            $table->index(['due_km']);
        });

        foreach (DB::table('maintenance_types')->get() as $type) {
            $name = mb_strtolower((string) $type->name);
            DB::table('deadline_rules')->insert([
                'maintenance_type_id' => $type->id,
                'alert_days' => str_contains($name, 'vidange') ? 15 : 30,
                'alert_km' => str_contains($name, 'vidange') ? 500 : 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $roles = DB::table('roles')->where('name', 'Gestion de contrat')->get();
        foreach ($roles as $role) {
            $permissions = json_decode($role->permissions ?? '{}', true) ?: [];
            foreach (['view' => 'yes', 'read' => 'all', 'create' => 'yes', 'update' => 'own', 'delete' => 'no', 'log' => 'own'] as $action => $scope) {
                $permissions["entity_deadlines_{$action}"] = $scope;
            }
            DB::table('roles')->where('id', $role->id)->update(['permissions' => json_encode($permissions), 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_deadlines');
        Schema::dropIfExists('deadline_rules');
    }
};
