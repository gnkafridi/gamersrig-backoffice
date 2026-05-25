<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductPurchase;
use App\Traits\HandlesProofUploads;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Stock Spent = product_purchases (unified stock-spent + inventory line items).
 * Each line links a product, qty, unit cost, who paid; creating/editing/deleting
 * recomputes the product's stock & weighted-average cost.
 */
class StockPurchaseController extends Controller
{
    use HandlesProofUploads;

    public function index(Request $request)
    {
        $q = ProductPurchase::with(['product:id,name,sku', 'payer:id,name', 'vendor:id,name']);

        if ($request->period) {
            [$y, $m] = array_map('intval', explode('-', $request->period));
            $q->whereYear('purchased_at', $y)->whereMonth('purchased_at', $m);
        }
        if ($request->partner_id) {
            $q->where('paid_by_partner_id', $request->partner_id);
        }
        if ($request->product_id) {
            $q->where('product_id', $request->product_id);
        }

        return response()->json($q->orderByDesc('purchased_at')->orderByDesc('id')->get());
    }

    /**
     * Create several product lines in ONE purchase that share a single proof
     * (e.g. 4 products bought together on one payment / screenshot).
     */
    public function storeBatch(Request $request)
    {
        $data = $request->validate([
            'purchased_at'       => 'required|date',
            'for_period'         => ['nullable', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'paid_by_partner_id' => 'nullable|exists:partners,id',
            'vendor_id'          => 'nullable|exists:vendors,id',
            'notes'              => 'nullable|string',
            'proof'              => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
            'items'                 => 'required|array|min:1',
            'items.*.product_id'    => 'required|exists:products,id',
            'items.*.quantity'      => 'required|integer|min:1',
            'items.*.unit_cost'     => 'required|numeric|min:0',
        ]);

        $proof = $this->storeProof($request); // stored once, shared by all lines

        $forPeriod = $data['for_period'] ?? substr($data['purchased_at'], 0, 7);

        DB::transaction(function () use ($data, $proof, $forPeriod) {
            $productIds = [];
            foreach ($data['items'] as $it) {
                ProductPurchase::create([
                    'product_id'         => $it['product_id'],
                    'paid_by_partner_id' => $data['paid_by_partner_id'] ?? null,
                    'vendor_id'          => $data['vendor_id'] ?? null,
                    'quantity'           => $it['quantity'],
                    'unit_cost'          => $it['unit_cost'],
                    'total_cost'         => round($it['quantity'] * $it['unit_cost'], 2),
                    'purchased_at'       => $data['purchased_at'],
                    'for_period'         => $forPeriod,
                    'notes'              => $data['notes'] ?? null,
                    'proof_path'         => $proof,
                ]);
                $productIds[$it['product_id']] = true;
            }
            foreach (array_keys($productIds) as $pid) {
                $this->recompute(Product::find($pid));
            }
        });

        return response()->json(['created' => count($data['items']), 'proof_path' => $proof], 201);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id'         => 'required|exists:products,id',
            'quantity'           => 'required|integer|min:1',
            'unit_cost'          => 'required|numeric|min:0',
            'purchased_at'       => 'required|date',
            'for_period'         => ['nullable', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'paid_by_partner_id' => 'nullable|exists:partners,id',
            'vendor_id'          => 'nullable|exists:vendors,id',
            'notes'              => 'nullable|string',
            'proof'              => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ]);

        $proof = $this->storeProof($request);

        $purchase = DB::transaction(function () use ($data, $proof) {
            $p = ProductPurchase::create([
                'product_id'         => $data['product_id'],
                'paid_by_partner_id' => $data['paid_by_partner_id'] ?? null,
                'vendor_id'          => $data['vendor_id'] ?? null,
                'quantity'           => $data['quantity'],
                'unit_cost'          => $data['unit_cost'],
                'total_cost'         => round($data['quantity'] * $data['unit_cost'], 2),
                'purchased_at'       => $data['purchased_at'],
                'for_period'         => $data['for_period'] ?? substr($data['purchased_at'], 0, 7),
                'notes'              => $data['notes'] ?? null,
                'proof_path'         => $proof,
            ]);
            $this->recompute(Product::find($data['product_id']));
            return $p;
        });

        return response()->json($purchase->load(['product:id,name,sku', 'payer:id,name']), 201);
    }

    public function update(Request $request, ProductPurchase $stockPurchase)
    {
        $data = $request->validate([
            'product_id'         => 'sometimes|exists:products,id',
            'quantity'           => 'sometimes|integer|min:1',
            'unit_cost'          => 'sometimes|numeric|min:0',
            'purchased_at'       => 'sometimes|date',
            'for_period'         => ['nullable', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'paid_by_partner_id' => 'nullable|exists:partners,id',
            'vendor_id'          => 'nullable|exists:vendors,id',
            'notes'              => 'nullable|string',
            'proof'              => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ]);

        if ($path = $this->storeProof($request)) {
            $this->deleteProofIfUnused($stockPurchase->proof_path, $stockPurchase->id);
            $data['proof_path'] = $path;
        }
        unset($data['proof']);

        $oldProductId = $stockPurchase->product_id;

        DB::transaction(function () use ($stockPurchase, $data, $oldProductId) {
            $qty  = $data['quantity']  ?? $stockPurchase->quantity;
            $unit = $data['unit_cost'] ?? $stockPurchase->unit_cost;
            $data['total_cost'] = round($qty * $unit, 2);
            $stockPurchase->update($data);

            $this->recompute(Product::find($stockPurchase->product_id));
            if ($oldProductId !== $stockPurchase->product_id) {
                $this->recompute(Product::find($oldProductId));
            }
        });

        return response()->json($stockPurchase->load(['product:id,name,sku', 'payer:id,name']));
    }

    public function destroy(ProductPurchase $stockPurchase)
    {
        $productId = $stockPurchase->product_id;
        $proof = $stockPurchase->proof_path;
        DB::transaction(function () use ($stockPurchase, $productId, $proof) {
            $stockPurchase->delete();
            $this->deleteProofIfUnused($proof, null);
            $this->recompute(Product::find($productId));
        });
        return response()->json(null, 204);
    }

    /** Delete the proof file only if no other purchase line still references it (shared batch proofs). */
    private function deleteProofIfUnused(?string $path, ?int $exceptId): void
    {
        if (!$path) return;
        $stillUsed = ProductPurchase::where('proof_path', $path)
            ->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
            ->exists();
        if (!$stillUsed) {
            Storage::disk('public')->delete($path);
        }
    }

    /** Recompute a product's stock (= purchased − sold) and weighted-average cost. */
    private function recompute(?Product $product): void
    {
        if (!$product) return;
        $purchases = $product->purchases()->get();
        $qty  = (int) $purchases->sum('quantity');
        $cost = $qty > 0 ? round($purchases->sum('total_cost') / $qty, 2) : (float) $product->cost_price;
        $sold = (int) DB::table('invoice_items')->where('product_id', $product->id)->sum('quantity');
        $latest = $purchases->max('purchased_at');

        $product->update([
            'stock'        => max(0, $qty - $sold),
            'cost_price'   => $cost,
            'purchased_at' => $latest ? Carbon::parse($latest)->toDateString() : $product->purchased_at,
        ]);
    }
}
