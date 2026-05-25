<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonthlySettlement extends Model
{
    protected $fillable = [
        'partner_id', 'period', 'total_investment', 'spillover',
        'total_expenses', 'advance_settled', 'net_settlement',
        'status', 'finalized_at', 'notes',
    ];

    protected $casts = [
        'total_investment' => 'decimal:2',
        'spillover' => 'decimal:2',
        'total_expenses' => 'decimal:2',
        'advance_settled' => 'decimal:2',
        'net_settlement' => 'decimal:2',
        'finalized_at' => 'datetime',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }
}
