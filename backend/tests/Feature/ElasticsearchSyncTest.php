<?php

namespace Tests\Feature;

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ElasticsearchSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_creation_syncs_to_elasticsearch(): void
    {
        Http::fake([
            'http://localhost:9200/customers/_doc/*' => Http::response(['result' => 'created'], 201),
        ]);

        $payload = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'contact_number' => '09123456789',
        ];

        $response = $this->postJson('/api/customers', $payload);

        $response->assertStatus(201);

        Http::assertSent(function ($request) {
            return $request->method() === 'PUT' &&
                   str_contains($request->url(), '/customers/_doc/') &&
                   $request['first_name'] === 'John' &&
                   $request['email'] === 'john.doe@example.com';
        });
    }

    public function test_customer_update_syncs_to_elasticsearch(): void
    {
        Http::fake([
            'http://localhost:9200/customers/_doc/*' => Http::response(['result' => 'updated'], 200),
        ]);

        $customer = Customer::create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'contact_number' => '09123456789',
        ]);

        $payload = [
            'first_name' => 'John Updated',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'contact_number' => '09999999999',
        ];

        $response = $this->putJson("/api/customers/{$customer->id}", $payload);

        $response->assertStatus(200);

        Http::assertSent(function ($request) use ($customer) {
            return $request->method() === 'PUT' &&
                   str_contains($request->url(), "/customers/_doc/{$customer->id}") &&
                   $request['first_name'] === 'John Updated';
        });
    }

    public function test_customer_deletion_removes_from_elasticsearch(): void
    {
        Http::fake([
            'http://localhost:9200/customers/_doc/*' => Http::response(['result' => 'deleted'], 200),
        ]);

        $customer = Customer::create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'contact_number' => '09123456789',
        ]);

        $response = $this->deleteJson("/api/customers/{$customer->id}");

        $response->assertStatus(200);

        Http::assertSent(function ($request) use ($customer) {
            return $request->method() === 'DELETE' &&
                   str_contains($request->url(), "/customers/_doc/{$customer->id}");
        });
    }

    public function test_customer_search_queries_elasticsearch(): void
    {
        Http::fake([
            'http://localhost:9200/customers/_search' => Http::response([
                'hits' => [
                    'hits' => [
                        [
                            '_source' => [
                                'id' => 1,
                                'first_name' => 'John',
                                'last_name' => 'Doe',
                                'email' => 'john.doe@example.com',
                                'contact_number' => '09123456789',
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/customers?search=John');

        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonFragment([
                     'first_name' => 'John',
                     'email' => 'john.doe@example.com',
                 ]);

        Http::assertSent(function ($request) {
            return $request->method() === 'POST' &&
                   str_contains($request->url(), '/customers/_search') &&
                   $request['query']['multi_match']['query'] === 'John';
        });
    }
}
