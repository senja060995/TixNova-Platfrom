<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = [
        'name', 'slug', 'type', 'icon', 'color', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    public function blogs(): HasMany
    {
        return $this->hasMany(Blog::class);
    }

    public function scopeForEvents($query)
    {
        return $query->where('type', 'event')->where('is_active', true);
    }

    public function scopeForBlogs($query)
    {
        return $query->where('type', 'blog')->where('is_active', true);
    }
}
