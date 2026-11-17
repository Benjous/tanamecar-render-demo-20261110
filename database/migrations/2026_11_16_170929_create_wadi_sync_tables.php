<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wadi_sync_runs', function (Blueprint $table) {
            $table->id();
            $table->string('status', 32)->default('running');
            $table->string('mode', 32)->default('apply');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->string('snapshot_path')->nullable();
            $table->timestamp('snapshot_at')->nullable();
            $table->unsignedInteger('entities_total')->default(0);
            $table->unsignedInteger('records_fetched')->default(0);
            $table->unsignedInteger('created_count')->default(0);
            $table->unsignedInteger('updated_count')->default(0);
            $table->unsignedInteger('unchanged_count')->default(0);
            $table->unsignedInteger('conflict_count')->default(0);
            $table->unsignedInteger('pending_count')->default(0);
            $table->unsignedInteger('error_count')->default(0);
            $table->jsonb('summary')->nullable();
            $table->jsonb('errors')->nullable();
            $table->text('message')->nullable();
            $table->timestamps();
            $table->index(['status', 'started_at']);
        });

        Schema::create('wadi_records', function (Blueprint $table) {
            $table->id();
            $table->string('entity', 128);
            $table->string('wadi_id', 128);
            $table->string('reference', 255)->nullable();
            $table->string('content_hash', 64);
            $table->jsonb('payload');
            $table->timestamp('first_seen_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('last_changed_at')->nullable();
            $table->timestamps();
            $table->unique(['entity', 'wadi_id']);
            $table->index(['entity', 'reference']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wadi_records');
        Schema::dropIfExists('wadi_sync_runs');
    }
};
