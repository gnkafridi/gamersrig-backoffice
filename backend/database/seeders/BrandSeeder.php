<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            'Ajazz', 'AMD Radeon', 'AMD Ryzen', 'ASRock', 'Attack Shark',
            'EasySMX', 'GameSir', 'Gateron', 'Gigabyte', 'Hikvision',
            'HyperX', 'INNO3D', 'Kingston', 'KZ (Knowledge Zenith)',
            'Loadtek', 'MSI', 'NVIDIA', 'Samsung', 'Sapphire',
            'Thermalright', 'UGREEN', 'Western Digital (WD)', 'Zotac',
        ];

        foreach ($brands as $name) {
            Brand::firstOrCreate(['name' => $name], ['is_active' => true]);
        }

        $this->command->info('✓ ' . count($brands) . ' brands seeded.');
    }
}
