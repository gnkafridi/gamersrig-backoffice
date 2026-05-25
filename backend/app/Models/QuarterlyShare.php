<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuarterlyShare extends Model
{
    protected $fillable = [
        'partner_id', 'year', 'quarter', 'total_revenue',
        'partner_count', 'share_amount', 'status',
    ];

    protected $casts = [
        'year' => 'integer',
        'quarter' => 'integer',
        'total_revenue' => 'decimal:2',
        'partner_count' => 'integer',
        'share_amount' => 'decimal:2',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }
}
