<?php

namespace App\Models;

use App\Traits\HasUserStamps;
use Illuminate\Database\Eloquent\Model;

class ProductPurchase extends Model
{
    use HasUserStamps;

    protected $fillable = [
        'product_id', 'vendor_id', 'paid_by_partner_id', 'quantity', 'unit_cost', 'total_cost',
        'purchased_at', 'for_period', 'notes', 'proof_path', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'unit_cost'    => 'decimal:2',
        'total_cost'   => 'decimal:2',
        'purchased_at' => 'date:Y-m-d',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function payer()
    {
        return $this->belongsTo(Partner::class, 'paid_by_partner_id');
    }
}
