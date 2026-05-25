<?php

namespace Database\Seeders;

use App\Models\Vendor;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = [
            ['name' => 'HB Tech',          'phone' => null, 'email' => null],
            ['name' => 'Optimus Computers', 'phone' => null, 'email' => null],
        ];

        foreach ($vendors as $v) {
            Vendor::firstOrCreate(['name' => $v['name']], [
                'email'     => $v['email'],
                'phone'     => $v['phone'],
                'is_active' => true,
            ]);
        }

        $this->command->info('✓ ' . count($vendors) . ' vendors seeded.');
    }
}
