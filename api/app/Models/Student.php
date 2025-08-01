<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'status',
        'class',
        'uuid',
        'name',
        'time',
        'email'
    ];

    public function logs(): HasMany
    {
        return $this->hasMany(Log::class);
    }

    public function accessCredentials(): HasMany
    {
        return $this->hasMany(AccessCredential::class);
    }
}
