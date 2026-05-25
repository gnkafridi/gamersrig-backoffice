<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Products sourced from the GamersRig stock sheet (Q1-2026 through June-2026).
     * Uses updateOrCreate on 'name' so existing records get corrected names/prices.
     * Cost price = latest purchase batch price.
     * Stock = quantity from most recent entry for that product.
     */
    public function run(): void
    {
        // Categories match the GamersRig WooCommerce store hierarchy.
        // Sub-category names used where the product fits a specific sub-type.
        $products = [
            // ── GameSir — Mobile Gamepad Controllers ──────────────────
            // T3 Lite & X5 Lite are clip-on / Bluetooth mobile controllers
            [
                'name'       => 'GameSir T3 Lite Grey',
                'sku'        => 'GS-T3L-GRY',
                'brand'      => 'GameSir',
                'category'   => 'Mobile gamepad controllers',
                'cost_price' => 3900.00,
                'sell_price' => 6000.00,
                'stock'      => 1,
            ],
            [
                'name'       => 'GameSir T3 Lite Serene White',
                'sku'        => 'GS-T3L-SWH',
                'brand'      => 'GameSir',
                'category'   => 'Mobile gamepad controllers',
                'cost_price' => 3900.00,
                'sell_price' => 6000.00,
                'stock'      => 2,
            ],
            [
                'name'       => 'GameSir X5 Lite Black',
                'sku'        => 'GS-X5L-BLK',
                'brand'      => 'GameSir',
                'category'   => 'Mobile gamepad controllers',
                'cost_price' => 4205.00,
                'sell_price' => 7500.00,
                'stock'      => 3,
            ],
            [
                'name'       => 'GameSir X5 Lite Wasabi',
                'sku'        => 'GS-X5L-WSB',
                'brand'      => 'GameSir',
                'category'   => 'Mobile gamepad controllers',
                'cost_price' => 4355.00,
                'sell_price' => 7500.00,
                'stock'      => 5,
            ],
            [
                'name'       => 'GameSir X5 Lite ZZZ Edition',
                'sku'        => 'GS-X5L-ZZZ',
                'brand'      => 'GameSir',
                'category'   => 'Mobile gamepad controllers',
                'cost_price' => 6657.00,
                'sell_price' => 9000.00,
                'stock'      => 4,
            ],
            [
                'name'       => 'GameSir X5 Lite ZZZ Edition with Radiator',
                'sku'        => 'GS-X5L-ZZZR',
                'brand'      => 'GameSir',
                'category'   => 'Mobile gamepad controllers',
                'cost_price' => 13478.00,
                'sell_price' => 18000.00,
                'stock'      => 2,
            ],

            // ── GameSir — Wired Gamepad Controller ────────────────────
            // X3 Pro is a wired Xbox-layout controller
            [
                'name'       => 'GameSir X3 Pro DeadPool Edition',
                'sku'        => 'GS-X3P-DPL',
                'brand'      => 'GameSir',
                'category'   => 'Wired gamepad controller',
                'cost_price' => 24000.00,
                'sell_price' => 35000.00,
                'stock'      => 1,
            ],

            // ── GameSir — Wired Keyboards ──────────────────────────────
            [
                'name'       => 'GameSir Kaleid RGB',
                'sku'        => 'GS-KAL-RGB',
                'brand'      => 'GameSir',
                'category'   => 'Wired keyboards',
                'cost_price' => 14800.00,
                'sell_price' => 17500.00,
                'stock'      => 1,
            ],
            [
                'name'       => 'GameSir Kaleid Flux',
                'sku'        => 'GS-KAL-FLX',
                'brand'      => 'GameSir',
                'category'   => 'Wired keyboards',
                'cost_price' => 15200.00,
                'sell_price' => 16500.00,
                'stock'      => 1,
            ],

            // ── KZ — Wired Earbuds (IEM) ───────────────────────────────
            [
                'name'       => 'KZ Castor Pro Silver with Mic',
                'sku'        => 'KZ-CPRO-SWM',
                'brand'      => 'KZ (Knowledge Zenith)',
                'category'   => 'Wired earbuds',
                'cost_price' => 2500.00,
                'sell_price' => 5000.00,
                'stock'      => 1,
            ],
            [
                'name'       => 'KZ ZSN Pro 2 Silver',
                'sku'        => 'KZ-ZSN2-SLV',
                'brand'      => 'KZ (Knowledge Zenith)',
                'category'   => 'Wired earbuds',
                'cost_price' => 2500.00,
                'sell_price' => 5000.00,
                'stock'      => 1,
            ],

            // ── EasySMX — Wireless Gamepad Controllers ─────────────────
            [
                'name'       => 'EasySMX M05',
                'sku'        => 'ES-M05',
                'brand'      => 'EasySMX',
                'category'   => 'Wireless gamepad controllers',
                'cost_price' => 5000.00,
                'sell_price' => 11000.00,
                'stock'      => 2,
            ],
            [
                'name'       => 'EasySMX M15',
                'sku'        => 'ES-M15',
                'brand'      => 'EasySMX',
                'category'   => 'Wireless gamepad controllers',
                'cost_price' => 7580.00,
                'sell_price' => 15000.00,
                'stock'      => 5,
            ],

            // ── Gateron — Accessories ──────────────────────────────────
            [
                'name'       => 'Gateron V2 Yellow Switches',
                'sku'        => 'GT-V2-YLW',
                'brand'      => 'Gateron',
                'category'   => 'Accessories',
                'cost_price' => 667.00,
                'sell_price' => 1200.00,
                'stock'      => 9,
            ],

            // ── UGREEN — Accessories ───────────────────────────────────
            [
                'name'       => 'UGREEN 65W Fast Multi Charger 3-Port',
                'sku'        => 'UG-65W-3P',
                'brand'      => 'UGREEN',
                'category'   => 'Accessories',
                'cost_price' => 6000.00,
                'sell_price' => 8000.00,
                'stock'      => 1,
            ],

            // ── Ajazz — Wired Keyboards ────────────────────────────────
            [
                'name'       => 'Ajazz AK820 Limited Edition - Black',
                'sku'        => 'AJ-AK820-LBK',
                'brand'      => 'Ajazz',
                'category'   => 'Wired keyboards',
                'cost_price' => 6900.00,
                'sell_price' => 10000.00,
                'stock'      => 1,
            ],
            [
                'name'       => 'Ajazz AK820 White Grey',
                'sku'        => 'AJ-AK820-WGR',
                'brand'      => 'Ajazz',
                'category'   => 'Wired keyboards',
                'cost_price' => 7900.00,
                'sell_price' => 10000.00,
                'stock'      => 1,
            ],
            [
                'name'       => 'Ajazz NK104 Blue Switches',
                'sku'        => 'AJ-NK104-BLS',
                'brand'      => 'Ajazz',
                'category'   => 'Wired keyboards',
                'cost_price' => 6950.00,
                'sell_price' => 12000.00,
                'stock'      => 1,
            ],
            [
                'name'       => 'Ajazz NK61 Black',
                'sku'        => 'AJ-NK61-BLK',
                'brand'      => 'Ajazz',
                'category'   => 'Wired keyboards',
                'cost_price' => 4750.00,
                'sell_price' => 10000.00,
                'stock'      => 1,
            ],
            [
                'name'       => 'Ajazz NK61 White',
                'sku'        => 'AJ-NK61-WHT',
                'brand'      => 'Ajazz',
                'category'   => 'Wired keyboards',
                'cost_price' => 4700.00,
                'sell_price' => 10000.00,
                'stock'      => 1,
            ],

            // ── HyperX — Wired Earbuds ─────────────────────────────────
            [
                'name'       => 'HyperX Cloud Earbuds II Red',
                'sku'        => 'HX-CE2-RED',
                'brand'      => 'HyperX',
                'category'   => 'Wired earbuds',
                'cost_price' => 6800.00,
                'sell_price' => 8500.00,
                'stock'      => 2,
            ],
            [
                'name'       => 'HyperX Cloud Earbuds II Black',
                'sku'        => 'HX-CE2-BLK',
                'brand'      => 'HyperX',
                'category'   => 'Wired earbuds',
                'cost_price' => 6760.00,
                'sell_price' => 8000.00,
                'stock'      => 2,
            ],
        ];

        foreach ($products as $data) {
            Product::updateOrCreate(
                ['name' => $data['name']],
                array_merge($data, ['is_active' => true])
            );
        }

        $this->command->info('✓ ' . count($products) . ' products seeded / updated.');
    }
}
