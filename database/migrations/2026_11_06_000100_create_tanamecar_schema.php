<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(file_get_contents(database_path('schema/tanamecar.sql')));
    }

    public function down(): void
    {
        $views = ['v_vehicle_status', 'v_invoice_totals', 'v_dashboard_counters', 'v_contract_financials'];
        foreach ($views as $view) {
            DB::statement("DROP VIEW IF EXISTS {$view} CASCADE");
        }

        $tables = [
            'backup_runs', 'settings', 'sequences', 'activity_log',
            'potential_duplicate_members', 'potential_duplicate_groups', 'data_quality_flags', 'import_batches',
            'quote_lines', 'invoice_lines', 'documents', 'media',
            'whatsapp_campaigns', 'configurations', 'communications', 'follow_ups',
            'vehicle_credits', 'maintenance_events', 'reservations',
            'quote_templates', 'invoice_templates', 'contract_templates',
            'quotes', 'invoices', 'payments', 'contracts', 'vehicles', 'client_documents', 'clients',
            'services', 'maintenance_types', 'credit_houses', 'lessors', 'lead_sources', 'vehicle_categories',
            'colors', 'vehicle_models', 'brands', 'countries', 'employees',
            'team_user', 'teams', 'role_permissions', 'permissions', 'roles', 'organizations',
        ];
        foreach ($tables as $table) {
            DB::statement("DROP TABLE IF EXISTS {$table} CASCADE");
        }

        DB::statement('ALTER TABLE users DROP COLUMN IF EXISTS organization_id');
        DB::statement('ALTER TABLE users DROP COLUMN IF EXISTS role_id');
        DB::statement('ALTER TABLE users DROP COLUMN IF EXISTS is_admin');
        DB::statement('ALTER TABLE users DROP COLUMN IF EXISTS active');
        DB::statement('ALTER TABLE users DROP COLUMN IF EXISTS confirmed_at');
        DB::statement('ALTER TABLE users DROP COLUMN IF EXISTS last_login_at');
        DB::statement('ALTER TABLE users DROP COLUMN IF EXISTS legacy_uid');
        DB::statement('ALTER TABLE users DROP COLUMN IF EXISTS legacy_payload');
    }
};
