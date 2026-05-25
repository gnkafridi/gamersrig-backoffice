<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductPurchase;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * One-time backfill of the full purchase history from the user's sales sheet.
 *
 * Logs every purchase batch (qty, unit cost, date) per product, recomputes the
 * weighted-average cost, and sets stock to net on-hand (purchased - sold).
 * Idempotent: existing purchase rows for these products are cleared and rebuilt.
 *
 * Run: php artisan db:seed --class=PurchaseHistorySeeder
 */
class PurchaseHistorySeeder extends Seeder
{
    /**
     * Dates are cost-neutral (weighted average is order-independent); they only
     * drive the history-log display.
     */
    private const D_JAN = '2026-01-15'; // Q1 table 1
    private const D_FEB = '2026-02-15'; // Table 2 (reorders / Ajazz / HyperX)
    private const D_MAR = '2026-03-15'; // Table 3 (X5 shipped / onway)
    private const D_APR = '2026-04-15'; // April-26
    private const D_JUN = '2026-06-15'; // June-26

    public function run(): void
    {
        // Dataset keyed by SKU. Each batch: [qty, unit_cost, date, notes|null]
        $data = [
            'GS-T3L-GRY'  => [[1, 3800, self::D_JAN, null], [1, 3900, self::D_FEB, null]],
            'GS-T3L-SWH'  => [[1, 3800, self::D_JAN, null], [2, 3900, self::D_FEB, null]],
            'GS-X5L-BLK'  => [[1, 3800, self::D_JAN, null], [3, 4205, self::D_MAR, null]],
            'GS-X5L-WSB'  => [[1, 3800, self::D_JAN, null], [3, 4075, self::D_JAN, null], [5, 4355, self::D_MAR, 'Shipped / Onway']],
            'KZ-CPRO-SWM' => [[1, 2500, self::D_JAN, null]],
            'KZ-ZSN2-SLV' => [[1, 2500, self::D_JAN, null]],
            'ES-M05'      => [[2, 5000, self::D_JAN, null]],
            'ES-M15'      => [[5, 6800, self::D_JAN, null], [5, 7580, self::D_JUN, null]],
            'GT-V2-YLW'   => [[9, 667,  self::D_JAN, null]],
            'UG-65W-3P'   => [[1, 6000, self::D_JAN, null]],
            'AJ-AK820-LBK' => [[1, 6900, self::D_FEB, null]],
            'AJ-AK820-WGR' => [[1, 7900, self::D_FEB, null]],
            'AJ-NK104-BLS' => [[1, 6950, self::D_FEB, null]],
            'AJ-NK61-BLK'  => [[1, 4750, self::D_FEB, null]],
            'AJ-NK61-WHT'  => [[1, 4700, self::D_FEB, null]], // sheet: "Ajazz NK81 White"
            'HX-CE2-RED'   => [[2, 6800, self::D_FEB, null]],
            'HX-CE2-BLK'   => [[2, 6760, self::D_FEB, null]],
            'GS-X5L-ZZZR'  => [[2, 13478, self::D_MAR, 'Shipped / Onway']],
            'GS-X3P-DPL'   => [[1, 24000, self::D_APR, null]],
            'GS-X5L-ZZZ'   => [[4, 6657, self::D_APR, null]],
            'GS-KAL-RGB'   => [[1, 14800, self::D_JUN, null]],
            'GS-KAL-FLX'   => [[1, 15200, self::D_JUN, null]],
        ];

        $adminId = User::where('email', 'admin@gamersrig.com')->value('id');

        DB::transaction(function () use ($data, $adminId) {
            $products = Product::whereIn('sku', array_keys($data))->get()->keyBy('sku');

            // Idempotency: clear any existing purchase rows for these products.
            ProductPurchase::whereIn('product_id', $products->pluck('id'))->delete();

            $rows    = [];
            $missing = [];

            foreach ($data as $sku => $batches) {
                $product = $products->get($sku);
                if (!$product) { $missing[] = $sku; continue; }

                $totalQty  = 0;
                $totalCost = 0.0;
                $lastDate  = null;

                foreach ($batches as [$qty, $unitCost, $date, $notes]) {
                    ProductPurchase::create([
                        'product_id'   => $product->id,
                        'vendor_id'    => null,
                        'quantity'     => $qty,
                        'unit_cost'    => $unitCost,
                        'total_cost'   => round($qty * $unitCost, 2),
                        'purchased_at' => $date,
                        'notes'        => $notes,
                        'created_by'   => $adminId,
                        'updated_by'   => $adminId,
                    ]);

                    $totalQty  += $qty;
                    $totalCost += $qty * $unitCost;
                    if ($lastDate === null || $date > $lastDate) $lastDate = $date;
                }

                $avgCost = $totalQty > 0 ? round($totalCost / $totalQty, 2) : 0;
                $sold    = (int) DB::table('invoice_items')->where('product_id', $product->id)->sum('quantity');
                $stock   = max($totalQty - $sold, 0);

                $product->update([
                    'cost_price'   => $avgCost,
                    'stock'        => $stock,
                    'purchased_at' => $lastDate,
                ]);

                $rows[] = sprintf(
                    '%-14s  batches:%d  purch:%-3d  sold:%-3d  stock:%-3d  avg:%s',
                    $sku, count($batches), $totalQty, $sold, $stock, number_format($avgCost, 2)
                );
            }

            $this->command->info('Purchase history backfill complete:');
            foreach ($rows as $r) $this->command->line('  ' . $r);
            $this->command->info('Total purchase rows: ' . ProductPurchase::count());
            if ($missing) {
                $this->command->warn('SKUs not found (skipped): ' . implode(', ', $missing));
            }
        });
    }
}
