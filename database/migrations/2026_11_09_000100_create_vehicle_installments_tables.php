<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('autoloc_traite_summaries', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('source_vehicle_id')->unique();
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->string('match_status', 20)->default('unmatched');
            $table->string('source_vehicle_name');
            $table->string('source_plate', 128)->nullable();
            $table->string('credit_house', 128)->nullable();
            $table->decimal('monthly_amount_recorded', 18, 6)->nullable();
            $table->unsignedInteger('total_months_recorded')->nullable();
            $table->unsignedInteger('paid_months_recorded')->nullable();
            $table->unsignedInteger('remaining_months_recorded')->nullable();
            $table->decimal('total_amount_recorded', 20, 8)->nullable();
            $table->decimal('paid_amount_recorded', 20, 8)->nullable();
            $table->decimal('remaining_amount_recorded', 20, 8)->nullable();
            $table->jsonb('raw_record')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('modified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('modified_at')->nullable();
            $table->timestampsTz();
            $table->index(['vehicle_id', 'source_vehicle_id']);
        });

        Schema::create('vehicle_installments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignId('summary_id')->nullable()->constrained('autoloc_traite_summaries')->nullOnDelete();
            $table->unsignedBigInteger('source_vehicle_id')->nullable();
            $table->unsignedInteger('source_row_number')->nullable();
            $table->string('source_key', 128)->nullable()->unique();
            $table->string('origin', 20)->default('manual');
            $table->decimal('amount_recorded', 18, 6)->nullable();
            $table->decimal('amount_current', 18, 6);
            $table->string('amount_text', 64)->nullable();
            $table->date('due_date');
            $table->date('date_recorded')->nullable();
            $table->text('description')->nullable();
            $table->text('description_recorded')->nullable();
            $table->string('status', 20)->default('unpaid');
            $table->string('status_recorded', 20)->nullable();
            $table->jsonb('raw_record')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('modified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('modified_at')->nullable();
            $table->timestampsTz();
            $table->index(['due_date', 'status']);
            $table->index(['vehicle_id', 'due_date']);
            $table->index(['source_vehicle_id', 'source_row_number']);
        });
        DB::statement("ALTER TABLE vehicle_installments ADD CONSTRAINT vehicle_installments_status_check CHECK (status in ('paid', 'unpaid'))");
        DB::statement("ALTER TABLE vehicle_installments ADD CONSTRAINT vehicle_installments_origin_check CHECK (origin in ('autoloc', 'manual'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_installments');
        Schema::dropIfExists('autoloc_traite_summaries');
    }
};
