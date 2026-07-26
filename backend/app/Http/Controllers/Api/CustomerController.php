<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use App\Services\ElasticsearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    protected ElasticsearchService $elasticsearchService;

    public function __construct(ElasticsearchService $elasticsearchService)
    {
        $this->elasticsearchService = $elasticsearchService;
    }

    /**
     * Display a listing of all customers.
     * Searches Elasticsearch when search query is provided, with graceful fallback to MySQL.
     */
    public function index(Request $request): JsonResponse
    {
        $searchTerm = $request->query('search') ?? $request->query('query');

        if (!empty($searchTerm)) {
            $searchTerm = trim($searchTerm);

            // Attempt to search via Elasticsearch first
            $esResults = $this->elasticsearchService->searchCustomers($searchTerm);
            if ($esResults !== null) {
                return response()->json($esResults, 200);
            }

            // Fallback to MySQL query if Elasticsearch is unavailable
            $query = Customer::query();
            $query->where(function ($q) use ($searchTerm) {
                $q->where('first_name', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('last_name', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('email', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('contact_number', 'LIKE', "%{$searchTerm}%");

                $keywords = preg_split('/\s+/', $searchTerm);
                if (count($keywords) > 1) {
                    $q->orWhere(function ($nameQuery) use ($keywords) {
                        foreach ($keywords as $kw) {
                            $nameQuery->where(function ($sub) use ($kw) {
                                $sub->where('first_name', 'LIKE', "%{$kw}%")
                                   ->orWhere('last_name', 'LIKE', "%{$kw}%");
                            });
                        }
                    });
                }
            });

            $customers = $query->orderBy('id', 'desc')->get();
            return response()->json($customers, 200);
        }

        $customers = Customer::orderBy('id', 'desc')->get();
        return response()->json($customers, 200);
    }

    /**
     * Store a newly created customer in MySQL and sync to Elasticsearch.
     */
    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = Customer::create($request->validated());

        // Sync to Elasticsearch
        $this->elasticsearchService->indexCustomer($customer);

        return response()->json([
            'message' => 'Customer created successfully',
            'data' => $customer
        ], 201);
    }

    /**
     * Display the specified customer by ID.
     */
    public function show(Customer $customer): JsonResponse
    {
        return response()->json([
            'data' => $customer
        ], 200);
    }

    /**
     * Update the specified customer in MySQL and sync to Elasticsearch.
     */
    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        $customer->update($request->validated());

        // Sync updated record to Elasticsearch
        $this->elasticsearchService->indexCustomer($customer);

        return response()->json([
            'message' => 'Customer updated successfully',
            'data' => $customer
        ], 200);
    }

    /**
     * Remove the specified customer from MySQL and delete from Elasticsearch.
     */
    public function destroy(Customer $customer): JsonResponse
    {
        $customerId = $customer->id;
        $customer->delete();

        // Delete record from Elasticsearch
        $this->elasticsearchService->deleteCustomer($customerId);

        return response()->json([
            'message' => 'Customer deleted successfully'
        ], 200);
    }
}
