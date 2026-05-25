<?php

namespace Database\Seeders;

use App\Models\Partner;
use App\Models\Product;
use App\Models\ProductPurchase;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Re-import "stock spent" from the owner's Excel (Jan–Jun 2026) — the authoritative
 * per-product, who-paid record. Each line becomes a product_purchase that feeds
 * inventory; products' stock & weighted-avg cost are recomputed. Idempotent.
 */
class StockSpentSeeder extends Seeder
{
    public function run(): void
    {
        $uid    = User::min('id');
        $partners = Partner::pluck('id', 'name'); // name => id
        $GNK  = Partner::where('name', 'like', 'GNK%')->value('id');
        $NAQI = Partner::where('name', 'like', '%Naqi%')->value('id');

        // [sku, qty, unit_cost, 'YYYY-MM-DD', payer]
        $N = $NAQI; $G = $GNK;
        $lines = [
            // Jan 2026 (initial stock-up) — Naqi
            ['GS-T3L-GRY', 1, 3800, '2026-01-15', $N],
            ['GS-T3L-SWH', 1, 3800, '2026-01-15', $N],
            ['GS-X5L-BLK', 1, 3800, '2026-01-15', $N],
            ['GS-X5L-WSB', 1, 3800, '2026-01-15', $N],
            ['KZ-CPRO-SWM', 1, 2500, '2026-01-15', $N],
            ['KZ-ZSN2-SLV', 1, 2500, '2026-01-15', $N],
            ['ES-M05', 2, 5000, '2026-01-15', $N],
            ['ES-M15', 5, 6800, '2026-01-15', $N],
            ['GT-V2-YLW', 9, 667, '2026-01-15', $N],
            ['UG-65W-3P', 1, 6000, '2026-01-15', $N],
            // Feb 2026 (reorder) — Naqi
            ['GS-X5L-WSB', 3, 4075, '2026-02-15', $N],
            // March 2026 — Naqi
            ['GS-T3L-GRY', 1, 3900, '2026-03-15', $N],
            ['GS-T3L-SWH', 2, 3900, '2026-03-15', $N],
            ['AJ-AK820-LBK', 1, 6900, '2026-03-15', $N],
            ['AJ-AK820-WGR', 1, 7900, '2026-03-15', $N],
            ['AJ-NK104-BLS', 1, 6950, '2026-03-15', $N],
            ['AJ-NK61-BLK', 1, 4750, '2026-03-15', $N],
            ['AJ-NK61-WHT', 1, 4700, '2026-03-15', $N],
            ['HX-CE2-RED', 2, 6800, '2026-03-15', $N],
            ['HX-CE2-BLK', 2, 6760, '2026-03-15', $N],
            // April 2026
            ['GS-X5L-BLK', 3, 4205, '2026-04-15', $G],   // GNK paid
            ['GS-X5L-WSB', 5, 4355, '2026-04-15', $N],
            ['GS-X5L-ZZZR', 2, 13478, '2026-04-15', $N],
            ['GS-X3P-DPL', 1, 24000, '2026-04-15', $N],
            ['GS-X5L-ZZZ', 4, 6657, '2026-04-15', $N],
            // June 2026 — Naqi
            ['ES-M15', 5, 7580, '2026-06-15', $N],
            ['GS-KAL-RGB', 1, 14800, '2026-06-15', $N],
            ['GS-KAL-FLX', 1, 15200, '2026-06-15', $N],
        ];

        DB::transaction(function () use ($lines, $uid) {
            // Idempotent: rebuild all purchases from the sheet.
            ProductPurchase::query()->delete();

            $skuToId = Product::pluck('id', 'sku');
            $touched = [];

            foreach ($lines as [$sku, $qty, $unit, $date, $payer]) {
                $pid = $skuToId[$sku] ?? null;
                if (!$pid) { $this->command->warn("No product for SKU {$sku}"); continue; }
                ProductPurchase::create([
                    'product_id'         => $pid,
                    'paid_by_partner_id' => $payer,
                    'quantity'           => $qty,
                    'unit_cost'          => $unit,
                    'total_cost'         => round($qty * $unit, 2),
                    'purchased_at'       => $date,
                    'created_by'         => $uid,
                    'updated_by'         => $uid,
                ]);
                $touched[$pid] = true;
            }

            // Recompute stock & weighted-avg cost for every product.
            foreach (Product::all() as $product) {
                $this->recompute($product);
            }
        });

        // Summary
        $total = ProductPurchase::sum('total_cost');
        $this->command->info('Stock spent re-imported: ' . ProductPurchase::count() . ' lines, total ' . number_format($total));
        $this->command->info('GNK: ' . number_format(ProductPurchase::where('paid_by_partner_id', Partner::where('name','like','GNK%')->value('id'))->sum('total_cost'))
            . ' | Naqi: ' . number_format(ProductPurchase::where('paid_by_partner_id', Partner::where('name','like','%Naqi%')->value('id'))->sum('total_cost')));
    }

    private function recompute(Product $product): void
    {
        $purchases = $product->purchases()->get();
        $qty  = (int) $purchases->sum('quantity');
        $cost = $qty > 0 ? round($purchases->sum('total_cost') / $qty, 2) : (float) $product->cost_price;
        $sold = (int) DB::table('invoice_items')->where('product_id', $product->id)->sum('quantity');
        $latest = $purchases->max('purchased_at');

        $product->update([
            'stock'        => max(0, $qty - $sold),
            'cost_price'   => $cost,
            'purchased_at' => $latest ? \Illuminate\Support\Carbon::parse($latest)->toDateString() : $product->purchased_at,
        ]);
    }
}
