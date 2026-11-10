<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('charges', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->date('charge_date');
            $table->string('description');
            $table->string('category', 32)->default('autre');
            $table->decimal('amount', 14, 2)->default(0);
            $table->decimal('vat', 14, 2)->nullable();
            $table->string('destination')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
            $table->index(['charge_date', 'category']);
        });

        Schema::create('agenda_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->date('event_date');
            $table->string('start_time', 5)->nullable();
            $table->string('subject');
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('planifie');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
            $table->index(['event_date', 'start_time']);
        });

        Schema::create('client_credits', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->date('credit_date');
            $table->decimal('advance', 14, 2)->default(0);
            $table->decimal('remaining', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
            $table->index(['client_id', 'credit_date']);
        });

        Schema::create('profit_entries', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->date('entry_date');
            $table->string('description');
            $table->string('source')->nullable();
            $table->decimal('amount', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
            $table->index(['entry_date']);
        });

        Schema::create('incidents', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->date('incident_date');
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('description');
            $table->decimal('amount', 14, 2)->nullable();
            $table->string('status', 20)->default('ouvert');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
            $table->index(['incident_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incidents');
        Schema::dropIfExists('profit_entries');
        Schema::dropIfExists('client_credits');
        Schema::dropIfExists('agenda_events');
        Schema::dropIfExists('charges');
    }
};
