<?php

namespace App\Models;

use App\Traits\HasUserStamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasUserStamps, SoftDeletes;

    protected $fillable = ['name', 'email', 'phone', 'address', 'city', 'notes', 'created_by', 'updated_by'];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function getTotalSpentAttribute(): float
    {
        return $this->orders()->where('status', 'delivered')->sum('total');
    }
}
