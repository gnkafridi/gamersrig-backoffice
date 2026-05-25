<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $q = trim($request->get('q', ''));

        if (strlen($q) < 2) {
            return response()->json(['orders' => [], 'customers' => [], 'products' => []]);
        }

        $orders = Invoice::with('customer:id,name')
            ->where(function ($query) use ($q) {
                $query->where('invoice_number', 'like', "%{$q}%")
                      ->orWhereHas('customer', fn($c) => $c->where('name', 'like', "%{$q}%"));
            })
            ->orderBy('invoice_date', 'desc')
            ->limit(5)
            ->get(['id', 'invoice_number', 'status', 'total', 'customer_id', 'invoice_date'])
            ->map(fn($o) => [
                'id'             => $o->id,
                'label'          => $o->invoice_number,
                'sub'            => $o->customer?->name ?? '—',
                'status'         => $o->status,
                'total'          => $o->total,
                'url'            => "/orders/{$o->id}",
            ]);

        $customers = Customer::where('name', 'like', "%{$q}%")
            ->orWhere('email', 'like', "%{$q}%")
            ->orWhere('phone', 'like', "%{$q}%")
            ->orderBy('name')
            ->limit(5)
            ->get(['id', 'name', 'email', 'phone', 'city'])
            ->map(fn($c) => [
                'id'    => $c->id,
                'label' => $c->name,
                'sub'   => $c->city ?? $c->email ?? '—',
                'url'   => "/customers/{$c->id}",
            ]);

        $products = Product::where('name', 'like', "%{$q}%")
            ->orWhere('sku', 'like', "%{$q}%")
            ->orWhere('brand', 'like', "%{$q}%")
            ->orderBy('name')
            ->limit(5)
            ->get(['id', 'name', 'sku', 'sell_price', 'category'])
            ->map(fn($p) => [
                'id'    => $p->id,
                'label' => $p->name,
                'sub'   => $p->sku ?? $p->category ?? '—',
                'price' => $p->sell_price,
                'url'   => "/products/{$p->id}",
            ]);

        return response()->json([
            'orders'    => $orders,
            'customers' => $customers,
            'products'  => $products,
        ]);
    }
}
