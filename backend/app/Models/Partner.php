<?php

namespace App\Models;

use App\Traits\HasUserStamps;
use Illuminate\Database\Eloquent\Model;

class Partner extends Model
{
    use HasUserStamps;

    protected $fillable = [
        'name', 'email', 'phone', 'share_percentage', 'is_active', 'notes',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'share_percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function investments()
    {
        return $this->hasMany(PartnerInvestment::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function settlements()
    {
        return $this->hasMany(MonthlySettlement::class);
    }

    public function getCurrentMonthInvestmentAttribute(): float
    {
        $period = now()->format('Y-m');
        return (float) $this->investments()->where('period', $period)->sum('amount');
    }
}
