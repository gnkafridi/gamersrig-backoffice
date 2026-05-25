<?php

namespace App\Models;

use App\Traits\HasUserStamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasUserStamps, SoftDeletes;

    protected $fillable = ['name', 'email', 'phone', 'address', 'city', 'notes', 'created_by', 'updated_by'];

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function getTotalSpentAttribute(): float
    {
        return $this->invoices()->where('status', 'paid')->sum('total');
    }
}
