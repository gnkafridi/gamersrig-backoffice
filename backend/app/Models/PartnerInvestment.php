<?php

namespace App\Models;

use App\Traits\HasUserStamps;
use Illuminate\Database\Eloquent\Model;

class PartnerInvestment extends Model
{
    use HasUserStamps;

    protected $fillable = [
        'partner_id', 'period', 'amount', 'spillover_adjust', 'notes',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'spillover_adjust' => 'decimal:2',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function getEffectiveAmountAttribute(): float
    {
        return (float) $this->amount + (float) $this->spillover_adjust;
    }
}
