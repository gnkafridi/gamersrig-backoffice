<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Full category hierarchy from GamersRig WooCommerce store.
     * Parents are created first, then children are linked by parent name.
     */
    public function run(): void
    {
        $tree = [
            ['name' => 'Accessories',           'sort' => 1,  'children' => []],
            ['name' => 'Audio',                 'sort' => 2,  'children' => [
                'Headphones',
                'Wired earbuds',
                'Wired headset',
            ]],
            ['name' => 'Cables',                'sort' => 3,  'children' => [
                'Display Port',
                'HDMI',
                'Power Cable',
                'Type C to C',
            ]],
            ['name' => 'Coolers',               'sort' => 4,  'children' => [
                'AIO coolers',
                'Air Coolers',
            ]],
            ['name' => 'CPU',                   'sort' => 5,  'children' => [
                'AMD',
                'Intel',
            ]],
            ['name' => 'FAN',                   'sort' => 6,  'children' => [
                'RGB Controllers',
                'RGB Fans',
            ]],
            ['name' => 'Gamepad Controllers',   'sort' => 7,  'children' => [
                'Mobile gamepad controllers',
                'Wired gamepad controller',
                'Wireless gamepad controllers',
            ]],
            ['name' => 'Gaming Keyboards',      'sort' => 8,  'children' => [
                'Wired keyboards',
                'Wireless Keyboards',
            ]],
            ['name' => 'Gaming Mouse',          'sort' => 9,  'children' => [
                'Wired Mouse',
                'Wireless Mouse',
            ]],
            ['name' => 'Graphics Cards',        'sort' => 10, 'children' => []],
            ['name' => 'Monitors',              'sort' => 11, 'children' => []],
            ['name' => 'Routers',               'sort' => 12, 'children' => [
                'Premium Routers',
            ]],
            ['name' => 'Storage',               'sort' => 13, 'children' => []],
            ['name' => 'Wifi Card',             'sort' => 14, 'children' => [
                'Wifi antenna',
                'Wifi cards',
                'Wifi PCIe adapters',
            ]],
        ];

        $total = 0;

        foreach ($tree as $idx => $node) {
            $parent = Category::firstOrCreate(
                ['name' => $node['name'], 'parent_id' => null],
                ['sort_order' => $node['sort'], 'is_active' => true]
            );
            $total++;

            foreach ($node['children'] as $childIdx => $childName) {
                Category::firstOrCreate(
                    ['name' => $childName, 'parent_id' => $parent->id],
                    ['sort_order' => $childIdx + 1, 'is_active' => true]
                );
                $total++;
            }
        }

        $this->command->info("✓ {$total} categories seeded.");
    }
}
