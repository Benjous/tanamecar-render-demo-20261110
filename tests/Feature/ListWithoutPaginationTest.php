<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class ListWithoutPaginationTest extends TestCase
{
    use DatabaseTransactions;

    public function test_core_lists_return_all_records_without_pagination(): void
    {
        $admin = User::create([
            'name' => 'List Admin',
            'email' => 'list-admin-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);

        $expectations = [
            '/clients' => ['clients', 2078],
            '/contracts' => ['contracts', 1127],
            '/vehicles' => ['vehicles', 81],
            '/payments' => ['payments', 72],
            '/invoices' => ['invoices', 313],
            '/data/slv_marques' => ['rows', 11],
        ];

        foreach ($expectations as $url => [$key, $count]) {
            $response = $this->actingAs($admin)->get($url);
            $response->assertOk();
            $page = $response->viewData('page');
            $this->assertArrayHasKey($key, $page['props']);
            $this->assertCount($count, $page['props'][$key], $url);
            $this->assertArrayNotHasKey('links', $page['props'][$key], $url);
        }
    }
}
