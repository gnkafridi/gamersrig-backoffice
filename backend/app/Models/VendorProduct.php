<?php

namespace App\Models;

use App\Traits\HasUserStamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class VendorProduct extends Model
{
    use HasUserStamps, SoftDeletes;

    protected $fillable = [
        'vendor_id', 'name', 'sku', 'category', 'brand', 'condition',
        'sell_price', 'resell_price', 'stock', 'notes', 'is_active',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'sell_price'   => 'decimal:2',
        'resell_price' => 'decimal:2',
        'is_active'    => 'boolean',
    ];

    protected $appends = ['commission', 'commission_pct'];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function getCommissionAttribute(): float
    {
        return round((float) $this->resell_price - (float) $this->sell_price, 2);
    }

    public function getCommissionPctAttribute(): float
    {
        if ((float) $this->resell_price == 0) return 0;
        return round((($this->resell_price - $this->sell_price) / $this->resell_price) * 100, 2);
    }
}
