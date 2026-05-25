<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Product;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $query = Brand::query();

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $brands = $query->orderBy('name')->paginate(50);

        // Attach product counts from products.brand string
        $productCounts = Product::selectRaw('brand, COUNT(*) as cnt')
            ->whereNotNull('brand')
            ->groupBy('brand')
            ->pluck('cnt', 'brand');

        $brands->getCollection()->transform(function ($brand) use ($productCounts) {
            $brand->product_count = $productCounts->get($brand->name, 0);
            return $brand;
        });

        return response()->json($brands);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255|unique:brands,name',
            'is_active' => 'boolean',
        ]);

        $brand = Brand::create($data);
        $brand->product_count = 0;

        return response()->json($brand, 201);
    }

    public function update(Request $request, Brand $brand)
    {
        $data = $request->validate([
            'name'      => 'sometimes|string|max:255|unique:brands,name,' . $brand->id,
            'is_active' => 'boolean',
        ]);

        // If name changed, update products that use the old name
        if (isset($data['name']) && $data['name'] !== $brand->name) {
            Product::where('brand', $brand->name)->update(['brand' => $data['name']]);
        }

        $brand->update($data);
        return response()->json($brand);
    }

    public function destroy(Brand $brand)
    {
        $count = Product::where('brand', $brand->name)->count();
        if ($count > 0) {
            return response()->json(['message' => "Cannot delete '{$brand->name}' — it is used by {$count} product(s). Reassign products first."], 422);
        }

        $brand->delete();
        return response()->json(null, 204);
    }
}
