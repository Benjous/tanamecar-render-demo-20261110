<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('autoloc_driver_candidates', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('source_row')->unique();
            $table->string('display_name');
            $table->string('phone', 64)->nullable();
            $table->text('address')->nullable();
            $table->string('status', 20)->default('pending');
            $table->foreignId('matched_client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->jsonb('raw_record')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('modified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('modified_at')->nullable();
            $table->timestampsTz();
            $table->index(['status', 'display_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('autoloc_driver_candidates');
    }
};
