<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_amortizations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('source_credit_id')->unique();
            $table->unsignedInteger('source_row')->nullable();
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->string('match_status', 20)->default('unmatched');
            $table->string('source_vehicle_name');
            $table->string('source_plate', 128)->nullable();
            $table->decimal('revenue_recorded', 20, 8)->nullable();
            $table->decimal('credit_recorded', 20, 8)->nullable();
            $table->decimal('balance_recorded', 20, 8)->nullable();
            $table->decimal('objective_recorded', 20, 8)->nullable();
            $table->decimal('price_per_km_recorded', 20, 8)->nullable();
            $table->decimal('price_recorded', 20, 8)->nullable();
            $table->decimal('real_cost_recorded', 20, 8)->nullable();
            $table->decimal('remaining_recorded', 20, 8)->nullable();
            $table->decimal('net_remaining_recorded', 20, 8)->nullable();
            $table->decimal('balance_current', 20, 8)->nullable();
            $table->jsonb('raw_record')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('modified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('modified_at')->nullable();
            $table->timestampsTz();
            $table->index(['vehicle_id', 'source_credit_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_amortizations');
    }
};
