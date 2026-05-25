<?php

namespace Database\Seeders;

use App\Models\Vendor;
use App\Models\VendorProduct;
use Illuminate\Database\Seeder;

class VendorProductSeeder extends Seeder
{
    /**
     * Products consigned by vendors (transcribed from the supplied sheet).
     * Columns: [name, category, condition, sell_price (vendor cost), resell_price (our price)]
     * condition '' => auto-derived from the name (Pulled / Used / New).
     */
    public function run(): void
    {
        $data = [
            'HB Tech' => [
                ['ThermalRight TL-M12W-S Fans',                'Cooling',       'New',  1500,   1800],
                ['Attack Shark VXE R1 Pro',                    'Mouse',         'New',  11500,  12000],
                ['Gigabyte GS25F2 EK 24.5" Gaming Monitor',    'Monitor',       'New',  40500,  43000],
                ['Hikvision E100 256GB',                       'Storage',       'New',  8000,   11000],
                ['KINGSTON NV3 PCIe 4.0 1TB NVMe SSD',         'Storage',       'New',  42000,  43000],
                ['Gigabyte Eagle OC 16G 5060Ti',              'Graphics Card', 'New',  210000, 215000],
                ['Zotac Twin Edge 3060Ti 8GB',                'Graphics Card', 'Used', 82000,  86000],
                ['Zotac Gaming GeForce RTX 5070 Solid OC 12GB Graphics Card', 'Graphics Card', 'New', 0, 240000], // sell price TBD
            ],
            'Optimus Computers' => [
                ['Nvidia RTX2080 Super 8GB Omen Pulled',                'Graphics Card', '', 75000,  78000],
                ['Nvidia RTX4070 Super 12GB Omen Pulled',               'Graphics Card', '', 155000, 160000],
                ['Nvidia RTX3070Ti 8GB Omen Pulled',                    'Graphics Card', '', 95000,  100000],
                ['Nvidia RTX3080 10GB Omen Pulled',                     'Graphics Card', '', 108000, 112000],
                ['Nvidia RTX4070Ti 12GB Omen Pulled',                   'Graphics Card', '', 165000, 170000],
                ['Nvidia RTX4070Ti Super 16GB Omen Pulled',             'Graphics Card', '', 225000, 232000],
                ['MSI RTX5060 8GB White OC',                            'Graphics Card', '', 130000, 135000],
                ['Nvidia RTX5070 12GB INNO3D White OC',                 'Graphics Card', '', 220000, 228000],
                ['Nvidia RTX5060Ti 8GB Leadtek Black',                  'Graphics Card', '', 145000, 146000],
                ['Nvidia RTX5080 16GB LeadTek Hurricane',               'Graphics Card', '', 430000, 440000],
                ['Nvidia RTX5070 12GB LeadTek Hurricane',               'Graphics Card', '', 210000, 218000],
                ['Nvidia RTX5050 8GB Zotac TwinEdge Black',             'Graphics Card', '', 105000, 110000],
                ['Nvidia RTX3080Ti 12GB Zotac AMP Holo OC',             'Graphics Card', '', 215000, 222000],
                ['Nvidia RTX5060Ti 8GB Zotac TwinEdge Black',           'Graphics Card', '', 147000, 152000],
                ['Nvidia RTX5060Ti 16GB Zotac TwinEdge White OC',       'Graphics Card', '', 190000, 198000],
                ['Nvidia RTX5060 8GB Zotac TwinEdge White',             'Graphics Card', '', 127000, 132000],
                ['NVIDIA RTX5080 16GB Zotac AMP Infinity Extreme OC',   'Graphics Card', '', 470000, 485000],
                ['AMD RX6900XT 16GB Sapphire Toxic Liquid',             'Graphics Card', '', 225000, 235000],
                ['AMD RX9060XT 8GB ASRock Challenger OC',               'Graphics Card', '', 112000, 116000],
                ['AMD RX5080 16GB Gigabyte Windforce OC',               'Graphics Card', '', 440000, 455000],
                ['Amd Radeon Rx6700XT 12GB Sapphire Radeon New With Box',                'Graphics Card', '', 78000, 82000],
                ['Amd Rx6700 10GB Sapphire Radeon DualFans Graphics Card New With Box',  'Graphics Card', '', 68000, 72000],
            ],
        ];

        $count = 0;
        foreach ($data as $vendorName => $rows) {
            $vendor = Vendor::firstOrCreate(['name' => $vendorName], ['is_active' => true]);

            foreach ($rows as [$name, $category, $condition, $sell, $resell]) {
                if ($condition === '') {
                    $condition = $this->deriveCondition($name);
                }

                VendorProduct::updateOrCreate(
                    ['vendor_id' => $vendor->id, 'name' => $name],
                    [
                        'category'     => $category,
                        'condition'    => $condition,
                        'sell_price'   => $sell,
                        'resell_price' => $resell,
                        'stock'        => 1,
                        'is_active'    => true,
                    ]
                );
                $count++;
            }
        }

        $this->command->info("✓ {$count} vendor products seeded.");
    }

    private function deriveCondition(string $name): string
    {
        $lower = strtolower($name);
        if (str_contains($lower, 'pulled')) return 'Pulled';
        if (str_contains($lower, 'used'))   return 'Used';
        return 'New';
    }
}
