<?php

namespace App\Models;

use App\Traits\HasUserStamps;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasUserStamps;

    protected $fillable = [
        'name', 'email', 'phone', 'notes', 'is_active',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function products()
    {
        return $this->hasMany(VendorProduct::class);
    }
}
