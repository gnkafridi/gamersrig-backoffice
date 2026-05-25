<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductPurchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['creator:id,name', 'updater:id,name']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%")
                  ->orWhere('category', 'like', "%{$request->search}%");
            });
        }

        // Accept both single value (category=X) and array (categories[]=X&categories[]=Y)
        $categories = array_filter(array_merge(
            $request->category  ? [$request->category]  : [],
            $request->categories ? (array) $request->categories : []
        ));
        if ($categories) {
            $query->whereIn('category', $categories);
        }

        $brands = array_filter(array_merge(
            $request->brand  ? [$request->brand]  : [],
            $request->brands ? (array) $request->brands : []
        ));
        if ($brands) {
            $query->whereIn('brand', $brands);
        }

        $sortable = ['name', 'category', 'brand', 'cost_price', 'sell_price', 'discount_price', 'stock', 'created_at', 'updated_at'];
        $sortBy  = in_array($request->sort_by, $sortable) ? $request->sort_by : 'name';
        $sortDir = $request->sort_dir === 'desc' ? 'desc' : 'asc';
        $paginated = $query->orderBy($sortBy, $sortDir)->orderBy('id', $sortDir)->paginate(20);

        // Summary across ALL matching rows (same filters, no pagination)
        $statsQuery = Product::query();
        if ($request->search) {
            $statsQuery->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%")
                  ->orWhere('category', 'like', "%{$request->search}%");
            });
        }
        if ($categories) $statsQuery->whereIn('category', $categories);
        if ($brands)     $statsQuery->whereIn('brand', $brands);

        $all = $statsQuery->get(['stock', 'sell_price', 'discount_price', 'cost_price', 'is_active']);

        $summary = [
            'total_products'   => $all->count(),
            'total_stock'      => $all->sum('stock'),
            'out_of_stock'     => $all->where('stock', 0)->count(),
            'low_stock'        => $all->where('stock', '>', 0)->where('stock', '<=', 5)->count(),
            'total_sell_value' => round($all->sum(fn($p) => $p->stock * ($p->discount_price > 0 ? $p->discount_price : $p->sell_price)), 2),
            'total_cost_value' => round($all->sum(fn($p) => $p->stock * $p->cost_price), 2),
        ];

        return response()->json(array_merge($paginated->toArray(), ['summary' => $summary]));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|unique:products',
            'category' => 'nullable|string',
            'brand' => 'nullable|string',
            'description' => 'nullable|string',
            'cost_price' => 'required|numeric|min:0',
            'sell_price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'stock'        => 'integer|min:0',
            'purchased_at' => 'nullable|date',
            'is_active'    => 'boolean',
            'stock_status' => 'nullable|in:in_stock,shipped,pre_order',
        ]);

        $product = Product::create($data);
        return response()->json($product, 201);
    }

    public function show(Product $product)
    {
        return response()->json($product);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sku' => 'nullable|string|unique:products,sku,' . $product->id,
            'category' => 'nullable|string',
            'brand' => 'nullable|string',
            'description' => 'nullable|string',
            'cost_price' => 'sometimes|numeric|min:0',
            'sell_price' => 'sometimes|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'stock'        => 'integer|min:0',
            'purchased_at' => 'nullable|date',
            'is_active'    => 'boolean',
            'stock_status' => 'nullable|in:in_stock,shipped,pre_order',
        ]);

        $product->update($data);
        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(null, 204);
    }

    public function restore(int $id)
    {
        Product::withTrashed()->findOrFail($id)->restore();
        return response()->json(null, 204);
    }

    /**
     * Add stock at a given unit cost and recompute the weighted-average cost.
     * Also logs the purchase for history.
     */
    public function restock(Request $request, Product $product)
    {
        $data = $request->validate([
            'quantity'           => 'required|integer|min:1',
            'unit_cost'          => 'required|numeric|min:0',
            'purchased_at'       => 'nullable|date',
            'vendor_id'          => 'nullable|exists:vendors,id',
            'paid_by_partner_id' => 'nullable|exists:partners,id',
            'stock_status'       => 'nullable|in:in_stock,shipped,pre_order',
            'notes'              => 'nullable|string',
            'proof'              => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ]);

        $proofPath = $request->hasFile('proof')
            ? $request->file('proof')->store('proofs', 'public')
            : null;

        return DB::transaction(function () use ($data, $product, $proofPath) {
            $oldStock = (int) $product->stock;
            $oldCost  = (float) $product->cost_price;
            $qty      = (int) $data['quantity'];
            $unitCost = (float) $data['unit_cost'];
            $date     = $data['purchased_at'] ?? now()->toDateString();

            $newStock = $oldStock + $qty;
            $newCost  = $newStock > 0
                ? round((($oldStock * $oldCost) + ($qty * $unitCost)) / $newStock, 2)
                : $unitCost;

            $updateData = [
                'stock'        => $newStock,
                'cost_price'   => $newCost,
                'purchased_at' => $date,
            ];
            if (!empty($data['stock_status'])) {
                $updateData['stock_status'] = $data['stock_status'];
            }

            $product->update($updateData);

            // Auto-populate notes for shipped/pre-order
            $notes = $data['notes'] ?? null;
            if (empty($notes) && !empty($data['stock_status']) && $data['stock_status'] !== 'in_stock') {
                $notes = $data['stock_status'] === 'shipped' ? 'Shipped / Onway' : 'Pre Order';
            }

            $purchase = ProductPurchase::create([
                'product_id'         => $product->id,
                'vendor_id'          => $data['vendor_id'] ?? null,
                'paid_by_partner_id' => $data['paid_by_partner_id'] ?? null,
                'quantity'           => $qty,
                'unit_cost'          => $unitCost,
                'total_cost'         => round($qty * $unitCost, 2),
                'purchased_at'       => $date,
                'notes'              => $notes,
                'proof_path'         => $proofPath,
            ]);

            return response()->json([
                'product'  => $product->fresh(),
                'purchase' => $purchase->load(['vendor:id,name', 'payer:id,name']),
            ]);
        });
    }

    public function markReceived(Product $product)
    {
        ProductPurchase::where('product_id', $product->id)
            ->where(function ($q) {
                $q->where('notes', 'like', '%Shipped%')
                  ->orWhere('notes', 'like', '%Onway%');
            })
            ->update(['notes' => null]);

        $product->update(['stock_status' => 'in_stock']);

        return response()->json(null, 204);
    }

    public function purchases(Product $product)
    {
        $rows = $product->purchases()
            ->with(['vendor:id,name', 'payer:id,name'])
            ->orderByDesc('purchased_at')
            ->orderByDesc('id')
            ->get();

        return response()->json($rows);
    }

    public function categories()
    {
        $cats = Product::distinct()->whereNotNull('category')->pluck('category');
        return response()->json($cats);
    }

    public function brands()
    {
        $brands = Product::distinct()->whereNotNull('brand')->pluck('brand');
        return response()->json($brands);
    }

    public function categoryStats()
    {
        // Product stats keyed by category name
        $stats = Product::selectRaw('category, COUNT(*) as product_count, SUM(stock) as total_stock, MIN(sell_price) as min_price, MAX(sell_price) as max_price')
            ->whereNotNull('category')
            ->groupBy('category')
            ->get()
            ->keyBy('category');

        // All categories from master list (with parent)
        $categories = \App\Models\Category::with('parent')
            ->orderBy('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function ($cat) use ($stats) {
                $s = $stats->get($cat->name);
                return [
                    'id'            => $cat->id,
                    'category'      => $cat->name,
                    'parent'        => $cat->parent?->name,
                    'parent_id'     => $cat->parent_id,
                    'product_count' => (int) ($s?->product_count ?? 0),
                    'total_stock'   => (int) ($s?->total_stock ?? 0),
                    'min_price'     => $s?->min_price,
                    'max_price'     => $s?->max_price,
                ];
            });

        return response()->json($categories);
    }

    public function brandStats()
    {
        $rows = Product::selectRaw('brand, COUNT(*) as product_count, SUM(stock) as total_stock, MIN(sell_price) as min_price, MAX(sell_price) as max_price')
            ->whereNotNull('brand')
            ->groupBy('brand')
            ->orderBy('brand')
            ->get();
        return response()->json($rows);
    }
}
