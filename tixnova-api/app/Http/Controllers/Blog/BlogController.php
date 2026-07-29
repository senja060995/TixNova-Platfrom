<?php

namespace App\Http\Controllers\Blog;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    /**
     * List published blogs (public).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Blog::published()
            ->with(['author', 'category', 'tenant'])
            ->when($request->category, fn ($q, $c) => $q->whereHas('category', fn ($q2) => $q2->where('slug', $c)))
            ->when($request->search, fn ($q, $s) => $q->where(function ($q2) use ($s) {
                $q2->where('title', 'ilike', "%{$s}%")
                   ->orWhere('excerpt', 'ilike', "%{$s}%")
                   ->orWhere('content', 'ilike', "%{$s}%");
            }))
            ->when($request->author, fn ($q, $a) => $q->whereHas('author', fn ($q2) => $q2->where('name', 'ilike', "%{$a}%")))
            ->when($request->tag, fn ($q, $t) => $q->whereJsonContains('tags', $t))
            ->latest('published_at');

        $perPage = $request->per_page ?? 12;
        $blogs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $blogs,
        ]);
    }

    /**
     * Get single blog by slug (public).
     */
    public function show(string $slug): JsonResponse
    {
        $blog = Blog::published()
            ->with(['author', 'category', 'tenant'])
            ->where('slug', $slug)
            ->firstOrFail();

        // Increment view count
        $blog->increment('view_count');

        return response()->json([
            'success' => true,
            'data'    => $blog,
        ]);
    }

    /**
     * List blog categories (public).
     */
    public function categories(): JsonResponse
    {
        $categories = Category::forBlogs()
            ->withCount('blogs')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $categories,
        ]);
    }

    /**
     * Get featured blogs (public).
     */
    public function featured(Request $request): JsonResponse
    {
        $blogs = Blog::published()
            ->with(['author', 'category', 'tenant'])
            ->where('is_featured', true)
            ->latest('published_at')
            ->limit($request->limit ?? 5)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $blogs,
        ]);
    }
}