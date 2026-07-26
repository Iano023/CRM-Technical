<?php

namespace App\Services;

use App\Models\Customer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ElasticsearchService
{
    protected string $baseUrl;
    protected string $indexName = 'customers';

    public function __construct()
    {
        $host = config('services.elasticsearch.host', 'localhost');
        $port = config('services.elasticsearch.port', '9200');
        $scheme = config('services.elasticsearch.scheme', 'http');

        $this->baseUrl = "{$scheme}://{$host}:{$port}";
    }

    /**
     * Get base URL of Elasticsearch service
     */
    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * Index or update a customer document in Elasticsearch.
     * Endpoint: PUT /customers/_doc/{id}
     */
    public function indexCustomer(Customer $customer): bool
    {
        try {
            $url = "{$this->baseUrl}/{$this->indexName}/_doc/{$customer->id}";

            $response = Http::timeout(2)->put($url, [
                'id' => $customer->id,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'email' => $customer->email,
                'contact_number' => $customer->contact_number,
                'updated_at' => $customer->updated_at ? $customer->updated_at->toIso8601String() : null,
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::warning("Elasticsearch indexCustomer failed for ID {$customer->id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete a customer document from Elasticsearch.
     * Endpoint: DELETE /customers/_doc/{id}
     */
    public function deleteCustomer(int $id): bool
    {
        try {
            $url = "{$this->baseUrl}/{$this->indexName}/_doc/{$id}";
            $response = Http::timeout(2)->delete($url);

            return $response->successful() || $response->status() === 404;
        } catch (\Throwable $e) {
            Log::warning("Elasticsearch deleteCustomer failed for ID {$id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Search customers in Elasticsearch by name or email address.
     * Endpoint: POST /customers/_search
     * Returns null if Elasticsearch service is unreachable (enables graceful fallback to MySQL).
     */
    public function searchCustomers(string $query): ?array
    {
        try {
            $url = "{$this->baseUrl}/{$this->indexName}/_search";

            $response = Http::timeout(2)->post($url, [
                'query' => [
                    'multi_match' => [
                        'query' => $query,
                        'fields' => ['first_name^2', 'last_name^2', 'email^3', 'contact_number'],
                        'fuzziness' => 'AUTO',
                    ],
                ],
            ]);

            if ($response->successful()) {
                $hits = $response->json('hits.hits', []);
                return array_map(function ($hit) {
                    return $hit['_source'];
                }, $hits);
            }

            return null;
        } catch (\Throwable $e) {
            Log::warning("Elasticsearch searchCustomers failed for query '{$query}': " . $e->getMessage());
            return null;
        }
    }
}
