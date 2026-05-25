<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VendorProduct;
use Illuminate\Http\Request;

class VendorProductController extends Controller
{
    public function index(Request $request)
    {
        $query = VendorProduct::with('vendor:id,name');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%");
            });
        }

        if ($request->vendor_id) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->condition) {
            $query->where('condition', $request->condition);
        }

        $categories = array_filter(array_merge(
            $request->category   ? [$request->category]   : [],
            $request->categories ? (array) $request->categories : []
        ));
        if ($categories) {
            $query->whereIn('category', $categories);
        }

        $sortable = ['name', 'category', 'condition', 'sell_price', 'resell_price', 'stock', 'created_at', 'updated_at'];
        $sortBy   = in_array($request->sort_by, $sortable) ? $request->sort_by : 'name';
        $sortDir  = $request->sort_dir === 'desc' ? 'desc' : 'asc';
        $paginated = $query->orderBy($sortBy, $sortDir)->orderBy('id', $sortDir)->paginate(20);

        // Summary across ALL matching rows (same filters, no pagination)
        $statsQuery = VendorProduct::query();
        if ($request->search) {
            $statsQuery->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%");
            });
        }
        if ($request->vendor_id) $statsQuery->where('vendor_id', $request->vendor_id);
        if ($request->condition) $statsQuery->where('condition', $request->condition);
        if ($categories)         $statsQuery->whereIn('category', $categories);

        $agg = $statsQuery->selectRaw('COUNT(*) as total_products, COALESCE(SUM(sell_price),0) as total_payable, COALESCE(SUM(resell_price),0) as total_resell')->first();

        $summary = [
            'total_products'   => (int) $agg->total_products,
            'total_payable'    => round((float) $agg->total_payable, 2),
            'total_resell'     => round((float) $agg->total_resell, 2),
            'total_commission' => round((float) $agg->total_resell - (float) $agg->total_payable, 2),
        ];

        return response()->json(array_merge($paginated->toArray(), ['summary' => $summary]));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vendor_id'    => 'required|exists:vendors,id',
            'name'         => 'required|string|max:255',
            'sku'          => 'nullable|string|max:255',
            'category'     => 'nullable|string',
            'brand'        => 'nullable|string',
            'condition'    => 'required|in:New,Used,Pulled',
            'sell_price'   => 'required|numeric|min:0',
            'resell_price' => 'required|numeric|min:0',
            'stock'        => 'integer|min:0',
            'notes'        => 'nullable|string',
            'is_active'    => 'boolean',
        ]);

        $product = VendorProduct::create($data);
        return response()->json($product->load('vendor:id,name'), 201);
    }

    public function show(VendorProduct $vendorProduct)
    {
        return response()->json($vendorProduct->load('vendor:id,name'));
    }

    public function update(Request $request, VendorProduct $vendorProduct)
    {
        $data = $request->validate([
            'vendor_id'    => 'sometimes|exists:vendors,id',
            'name'         => 'sometimes|string|max:255',
            'sku'          => 'nullable|string|max:255',
            'category'     => 'nullable|string',
            'brand'        => 'nullable|string',
            'condition'    => 'sometimes|in:New,Used,Pulled',
            'sell_price'   => 'sometimes|numeric|min:0',
            'resell_price' => 'sometimes|numeric|min:0',
            'stock'        => 'integer|min:0',
            'notes'        => 'nullable|string',
            'is_active'    => 'boolean',
        ]);

        $vendorProduct->update($data);
        return response()->json($vendorProduct->load('vendor:id,name'));
    }

    public function destroy(VendorProduct $vendorProduct)
    {
        $vendorProduct->delete();
        return response()->json(null, 204);
    }

    public function restore(int $id)
    {
        VendorProduct::withTrashed()->findOrFail($id)->restore();
        return response()->json(null, 204);
    }
}
