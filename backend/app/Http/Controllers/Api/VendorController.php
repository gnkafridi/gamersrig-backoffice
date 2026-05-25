<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use App\Models\VendorProduct;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    public function index(Request $request)
    {
        $query = Vendor::withCount('products');

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->orderBy('name')->paginate(50));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255|unique:vendors,name',
            'email'     => 'nullable|email|max:255',
            'phone'     => 'nullable|string|max:50',
            'notes'     => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $vendor = Vendor::create($data);
        $vendor->products_count = 0;

        return response()->json($vendor, 201);
    }

    public function show(Vendor $vendor)
    {
        return response()->json($vendor->loadCount('products'));
    }

    public function update(Request $request, Vendor $vendor)
    {
        $data = $request->validate([
            'name'      => 'sometimes|string|max:255|unique:vendors,name,' . $vendor->id,
            'email'     => 'nullable|email|max:255',
            'phone'     => 'nullable|string|max:50',
            'notes'     => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $vendor->update($data);
        return response()->json($vendor->loadCount('products'));
    }

    public function destroy(Vendor $vendor)
    {
        $count = $vendor->products()->count();
        if ($count > 0) {
            return response()->json(['message' => "Cannot delete '{$vendor->name}' — it has {$count} product(s). Reassign or remove them first."], 422);
        }

        $vendor->delete();
        return response()->json(null, 204);
    }

    // Lightweight list for dropdowns
    public function list()
    {
        return response()->json(
            Vendor::where('is_active', true)->orderBy('name')->get(['id', 'name'])
        );
    }

    // Per-vendor commission report (catalog-level / potential commission)
    public function commissionReport()
    {
        $rows = Vendor::withCount('products')
            ->orderBy('name')
            ->get()
            ->map(function ($vendor) {
                $agg = VendorProduct::where('vendor_id', $vendor->id)
                    ->selectRaw('COUNT(*) as product_count, COALESCE(SUM(sell_price),0) as total_payable, COALESCE(SUM(resell_price),0) as total_resell')
                    ->first();

                $payable    = (float) $agg->total_payable;
                $resell     = (float) $agg->total_resell;
                $commission = round($resell - $payable, 2);
                $avgPct     = $resell > 0 ? round(($commission / $resell) * 100, 2) : 0;

                return [
                    'id'                 => $vendor->id,
                    'vendor'             => $vendor->name,
                    'product_count'      => (int) $agg->product_count,
                    'total_payable'      => $payable,
                    'total_resell'       => $resell,
                    'total_commission'   => $commission,
                    'avg_commission_pct' => $avgPct,
                ];
            });

        $totals = [
            'product_count'      => (int) $rows->sum('product_count'),
            'total_payable'      => round($rows->sum('total_payable'), 2),
            'total_resell'       => round($rows->sum('total_resell'), 2),
            'total_commission'   => round($rows->sum('total_commission'), 2),
            'avg_commission_pct' => $rows->sum('total_resell') > 0
                ? round(($rows->sum('total_commission') / $rows->sum('total_resell')) * 100, 2)
                : 0,
        ];

        return response()->json(['vendors' => $rows, 'totals' => $totals]);
    }
}
