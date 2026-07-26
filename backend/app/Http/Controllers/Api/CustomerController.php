<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Display a listing of all customers.
     * Supports filtering by name (first_name, last_name, full name) and email address.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query();

        // Support 'search' or 'query' query parameters
        $searchTerm = $request->query('search') ?? $request->query('query');

        if (!empty($searchTerm)) {
            $searchTerm = trim($searchTerm);

            $query->where(function ($q) use ($searchTerm) {
                $q->where('first_name', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('last_name', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('email', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('contact_number', 'LIKE', "%{$searchTerm}%");

                // Handle full name search like "Albert Abarquez"
                $keywords = preg_split('/\s+/', $searchTerm);
                if (count($keywords) > 1) {
                    $q->orWhere(function ($nameQuery) use ($keywords) {
                        $nameQuery->where('first_name', 'LIKE', "%{$keywords[0]}%")
                                  ->where('last_name', 'LIKE', "%{$keywords[1]}%");
                    });
                }
            });
        }

        $customers = $query->orderBy('id', 'desc')->get();

        return response()->json($customers, 200);
    }

    /**
     * Store a newly created customer in storage.
     */
    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = Customer::create($request->validated());

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
     * Update the specified customer in storage.
     */
    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        $customer->update($request->validated());

        return response()->json([
            'message' => 'Customer updated successfully',
            'data' => $customer
        ], 200);
    }

    /**
     * Remove the specified customer from storage.
     */
    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();

        return response()->json([
            'message' => 'Customer deleted successfully'
        ], 200);
    }
}
