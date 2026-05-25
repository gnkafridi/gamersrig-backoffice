<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::with('parent:id,name')
            ->withCount('children');

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->filled('parent_id')) {
            $query->where('parent_id', $request->parent_id ?: null);
        }

        $categories = $query->orderBy('parent_id')->orderBy('sort_order')->orderBy('name')->paginate(50);

        // Attach product counts
        $productCounts = Product::selectRaw('category, COUNT(*) as cnt')
            ->whereNotNull('category')
            ->groupBy('category')
            ->pluck('cnt', 'category');

        $categories->getCollection()->transform(function ($cat) use ($productCounts) {
            $cat->product_count = $productCounts->get($cat->name, 0);
            return $cat;
        });

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'sort_order'=> 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        $category = Category::create($data);
        $category->load('parent:id,name');
        $category->children_count = 0;
        $category->product_count  = 0;

        return response()->json($category, 201);
    }

    public function show(Category $category)
    {
        $category->load('parent:id,name', 'children');
        return response()->json($category);
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'sort_order'=> 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        // Prevent setting a category as its own parent or child as parent
        if (!empty($data['parent_id'])) {
            if ($data['parent_id'] == $category->id) {
                return response()->json(['message' => 'A category cannot be its own parent.'], 422);
            }
        }

        $category->update($data);
        $category->load('parent:id,name');
        $category->children_count = $category->children()->count();

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        if ($category->children()->count() > 0) {
            return response()->json(['message' => 'Cannot delete a category that has sub-categories. Delete or move sub-categories first.'], 422);
        }

        $category->delete();
        return response()->json(null, 204);
    }

    public function parents()
    {
        return response()->json(
            Category::whereNull('parent_id')->orderBy('sort_order')->orderBy('name')->get(['id', 'name'])
        );
    }

    /**
     * All active categories ordered for filter dropdowns:
     * parents first (sorted by sort_order/name), then each parent's children immediately after.
     * Returns lightweight fields: id, name, parent_id.
     */
    public function allForFilter()
    {
        $all = Category::where('is_active', true)
            ->orderByRaw('COALESCE(parent_id, id)')
            ->orderBy('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id']);

        // Re-order: parents first, then each parent's children immediately after
        $parents  = $all->whereNull('parent_id')->values();
        $children = $all->whereNotNull('parent_id')->groupBy('parent_id');

        $ordered = collect();
        foreach ($parents as $parent) {
            $ordered->push($parent);
            if ($children->has($parent->id)) {
                foreach ($children->get($parent->id) as $child) {
                    $ordered->push($child);
                }
            }
        }

        return response()->json($ordered->values());
    }
}
