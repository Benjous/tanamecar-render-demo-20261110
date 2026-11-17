<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReconciliationTest extends TestCase
{
    use DatabaseTransactions;

    public function test_source_volumes_and_sums_are_preserved(): void
    {
        $this->assertSame(1127, DB::table('contracts')->count());
        $this->assertSame(2078, DB::table('clients')->count());
        $this->assertSame(81, DB::table('vehicles')->count());
        $this->assertSame(72, DB::table('payments')->count());
        $this->assertSame(313, DB::table('invoices')->count());
        $this->assertSame(346, DB::table('invoice_lines')->count());

        $this->assertEquals(2223449.00, (float) DB::table('contracts')->sum('total_amount'));
        $this->assertEquals(95268.00, (float) DB::table('payments')->sum('amount'));
        $this->assertEquals(600076.50, (float) DB::table('invoices')->sum('total'));

        $this->assertSame(306, DB::table('contracts')->whereNull('vehicle_id')->count());
        $this->assertSame(18, DB::table('payments')->where('amount', 0)->count());
        $this->assertSame(8, DB::table('v_contract_financials')->where('has_mismatch', true)->count());
        $this->assertSame(407, DB::table('documents')->where('id', '<', 1000000)->count());
        $this->assertSame(5, DB::table('media')->count());
    }
}
