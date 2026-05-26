<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::with(['creator:id,name', 'updater:id,name'])->withCount('orders');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%");
            });
        }

        if ($request->city) {
            $query->where('city', $request->city);
        }

        if ($request->province_cities) {
            $cities = explode(',', $request->province_cities);
            $query->whereIn('city', $cities);
        }

        $paginated = $query->orderBy('name')->paginate(20);

        $statsQuery = Customer::withCount('orders');
        if ($request->search) {
            $statsQuery->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%");
            });
        }
        if ($request->city) {
            $statsQuery->where('city', $request->city);
        }
        if ($request->province_cities) {
            $cities = explode(',', $request->province_cities);
            $statsQuery->whereIn('city', $cities);
        }
        $all = $statsQuery->get(['id', 'is_active']);

        $summary = [
            'total_customers'  => $all->count(),
            'active_customers' => $all->where('is_active', true)->count(),
            'with_orders'      => $all->where('orders_count', '>', 0)->count(),
            'no_orders'        => $all->where('orders_count', 0)->count(),
        ];

        return response()->json(array_merge($paginated->toArray(), ['summary' => $summary]));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $customer = Customer::create($data);
        return response()->json($customer, 201);
    }

    public function show(Customer $customer)
    {
        $customer->load(['orders' => fn($q) => $q->orderByDesc('order_date')]);

        $orders       = $customer->orders;
        $totalSpent   = $orders->sum('total');
        $totalOrders  = $orders->count();
        $avgOrder     = $totalOrders ? round($totalSpent / $totalOrders, 2) : 0;
        $lastOrderAt  = $orders->first()?->order_date;

        return response()->json([
            'customer'    => $customer,
            'stats'       => [
                'total_orders'  => $totalOrders,
                'total_spent'   => round($totalSpent, 2),
                'avg_order'     => $avgOrder,
                'last_order_at' => $lastOrderAt,
            ],
            'orders'      => $orders,
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $customer->update($data);
        return response()->json($customer);
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();
        return response()->json(null, 204);
    }

    public function restore(int $id)
    {
        Customer::withTrashed()->findOrFail($id)->restore();
        return response()->json(null, 204);
    }
}
