<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlogContentTranslation extends Model
{
    protected $fillable = [
        'blog_id', 'locale', 'title', 'content', 'excerpt', 'meta_title',
        'meta_description', 'tags', 'status', 'published_at',
    ];

    protected $casts = [
        'tags' => 'array',
        'published_at' => 'datetime',
    ];

    public function blog(): BelongsTo
    {
        return $this->belongsTo(Blog::class);
    }
}
