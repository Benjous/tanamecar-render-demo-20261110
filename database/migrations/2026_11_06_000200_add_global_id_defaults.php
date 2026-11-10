<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("CREATE SEQUENCE IF NOT EXISTS global_id_seq START WITH 500000");
        $tables = [
            'organizations','roles','teams','countries','brands','vehicle_models','colors','vehicle_categories',
            'lead_sources','lessors','credit_houses','maintenance_types','services','employees','clients',
            'client_documents','vehicles','contracts','payments','invoices','invoice_lines','quotes','quote_lines',
            'contract_templates','invoice_templates','quote_templates','configurations','communications',
            'whatsapp_campaigns','reservations','maintenance_events','vehicle_credits','follow_ups','media','documents',
            'import_batches',
        ];
        foreach ($tables as $table) {
            DB::statement("ALTER TABLE {$table} ALTER COLUMN id SET DEFAULT nextval('global_id_seq')");
        }
    }

    public function down(): void
    {
        DB::statement('DROP SEQUENCE IF EXISTS global_id_seq CASCADE');
    }
};
