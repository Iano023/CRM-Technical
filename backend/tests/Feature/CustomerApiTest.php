<?php

namespace Tests\Feature;

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_customers(): void
    {
        Customer::create([
            'first_name' => 'Albert',
            'last_name' => 'Abarquez',
            'email' => 'albert@example.com',
            'contact_number' => '09123456789',
        ]);

        $response = $this->getJson('/api/customers');

        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonFragment([
                     'first_name' => 'Albert',
                     'last_name' => 'Abarquez',
                     'email' => 'albert@example.com',
                 ]);
    }

    public function test_can_filter_customers_by_name_or_email(): void
    {
        Customer::create([
            'first_name' => 'Albert',
            'last_name' => 'Abarquez',
            'email' => 'albert@example.com',
            'contact_number' => '09123456789',
        ]);

        Customer::create([
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'email' => 'maria@example.com',
            'contact_number' => '09987654321',
        ]);

        // Search by first name
        $response = $this->getJson('/api/customers?search=Albert');
        $response->assertStatus(200)->assertJsonCount(1)->assertJsonFragment(['first_name' => 'Albert']);

        // Search by email
        $response = $this->getJson('/api/customers?search=maria@example.com');
        $response->assertStatus(200)->assertJsonCount(1)->assertJsonFragment(['first_name' => 'Maria']);
    }

    public function test_can_create_customer(): void
    {
        $payload = [
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'email' => 'juan@example.com',
            'contact_number' => '09112223333',
        ];

        $response = $this->postJson('/api/customers', $payload);

        $response->assertStatus(201)
                 ->assertJsonFragment([
                     'message' => 'Customer created successfully',
                 ]);

        $this->assertDatabaseHas('customers', [
            'email' => 'juan@example.com',
        ]);
    }

    public function test_cannot_create_customer_with_duplicate_email(): void
    {
        Customer::create([
            'first_name' => 'Albert',
            'last_name' => 'Abarquez',
            'email' => 'albert@example.com',
            'contact_number' => '09123456789',
        ]);

        $payload = [
            'first_name' => 'Duplicate',
            'last_name' => 'User',
            'email' => 'albert@example.com',
            'contact_number' => '09000000000',
        ];

        $response = $this->postJson('/api/customers', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_requires_first_name_and_last_name(): void
    {
        $payload = [
            'email' => 'test@example.com',
        ];

        $response = $this->postJson('/api/customers', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['first_name', 'last_name']);
    }

    public function test_can_show_customer(): void
    {
        $customer = Customer::create([
            'first_name' => 'Albert',
            'last_name' => 'Abarquez',
            'email' => 'albert@example.com',
            'contact_number' => '09123456789',
        ]);

        $response = $this->getJson("/api/customers/{$customer->id}");

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'first_name' => 'Albert',
                 ]);
    }

    public function test_can_update_customer(): void
    {
        $customer = Customer::create([
            'first_name' => 'Albert',
            'last_name' => 'Abarquez',
            'email' => 'albert@example.com',
            'contact_number' => '09123456789',
        ]);

        $payload = [
            'first_name' => 'Albert Updated',
            'last_name' => 'Abarquez',
            'email' => 'albert@example.com', // keeping own email
            'contact_number' => '09999999999',
        ];

        $response = $this->putJson("/api/customers/{$customer->id}", $payload);

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'first_name' => 'Albert Updated',
                 ]);

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'first_name' => 'Albert Updated',
        ]);
    }

    public function test_can_delete_customer(): void
    {
        $customer = Customer::create([
            'first_name' => 'Albert',
            'last_name' => 'Abarquez',
            'email' => 'albert@example.com',
            'contact_number' => '09123456789',
        ]);

        $response = $this->deleteJson("/api/customers/{$customer->id}");

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'message' => 'Customer deleted successfully',
                 ]);

        $this->assertDatabaseMissing('customers', [
            'id' => $customer->id,
        ]);
    }
}
