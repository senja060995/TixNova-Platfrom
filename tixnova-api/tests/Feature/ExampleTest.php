<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_register_promotor_with_tenant_name_fallback(): void
    {
        $response = $this->postJson('/api/auth/register/promotor', [
            'name' => 'Promotor Test',
            'email' => 'promotor_test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'tenant_name' => 'Organisasi Sukses Indonesia',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.tenant.name', 'Organisasi Sukses Indonesia');
    }
}
