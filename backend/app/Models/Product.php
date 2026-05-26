<?php

namespace App\Models;

use App\Traits\HasUserStamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasUserStamps, SoftDeletes;

    protected $fillable = [
        'name', 'sku', 'category', 'brand', 'description',
        'cost_price', 'sell_price', 'discount_price', 'stock', 'purchased_at', 'is_active', 'stock_status',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'is_active'    => 'boolean',
        'purchased_at' => 'date:Y-m-d',
    ];

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function purchases()
    {
        return $this->hasMany(ProductPurchase::class);
    }

    public function getMarginAttribute(): float
    {
        if ($this->sell_price == 0) return 0;
        return round((($this->sell_price - $this->cost_price) / $this->sell_price) * 100, 2);
    }
}
