<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    /**
     * List all platform blogs.
     */
    public function index(Request $request): JsonResponse
    {
        $blogs = Blog::withoutGlobalScopes()
            ->with(['author', 'category', 'tenant'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->search, fn ($q, $s) => $q->where(function ($qq) use ($s) {
                $qq->where('title', 'like', "%{$s}%")
                    ->orWhere('excerpt', 'like', "%{$s}%")
                    ->orWhere('location', 'like', "%{$s}%");
            }))
            ->latest()
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data'    => $blogs,
        ]);
    }

    /**
     * Store a new blog post.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title'            => 'required|string|max:255',
            'category_id'      => 'nullable|exists:categories,id',
            'excerpt'          => 'required|string|max:500',
            'content'          => 'required|string',
            'banner'           => 'nullable|string',
            'location'         => 'nullable|string|max:255',
            'tags'             => 'nullable',
            'meta_title'       => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'status'           => 'required|in:draft,published',
        ]);

        $slug = Str::slug($request->title);
        $originalSlug = $slug;
        $count = 1;
        while (Blog::withoutGlobalScopes()->where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-" . $count++;
        }

        // Process tags if string
        $tags = $request->tags;
        if (is_string($tags)) {
            $tags = array_filter(array_map('trim', explode(',', $tags)));
        }

        $blog = Blog::create([
            'tenant_id'        => null, // Platform official blog
            'user_id'          => auth()->id(),
            'category_id'      => $request->category_id,
            'title'            => $request->title,
            'slug'             => $slug,
            'excerpt'          => $request->excerpt,
            'content'          => $request->content,
            'banner'           => $request->banner,
            'location'         => $request->location,
            'tags'             => $tags,
            'meta_title'       => $request->meta_title ?: $request->title,
            'meta_description' => $request->meta_description ?: $request->excerpt,
            'status'           => $request->status,
            'published_at'     => $request->status === 'published' ? now() : null,
            'view_count'       => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Artikel blog berhasil dibuat!',
            'data'    => $blog->load(['author', 'category']),
        ], 201);
    }

    /**
     * Display single blog post.
     */
    public function show($id): JsonResponse
    {
        $blog = Blog::withoutGlobalScopes()
            ->with(['author', 'category'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $blog,
        ]);
    }

    /**
     * Update a blog post.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $blog = Blog::withoutGlobalScopes()->findOrFail($id);

        $request->validate([
            'title'            => 'required|string|max:255',
            'category_id'      => 'nullable|exists:categories,id',
            'excerpt'          => 'required|string|max:500',
            'content'          => 'required|string',
            'banner'           => 'nullable|string',
            'location'         => 'nullable|string|max:255',
            'tags'             => 'nullable',
            'meta_title'       => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'status'           => 'required|in:draft,published',
        ]);

        // Process tags if string
        $tags = $request->tags;
        if (is_string($tags)) {
            $tags = array_filter(array_map('trim', explode(',', $tags)));
        }

        $data = [
            'category_id'      => $request->category_id,
            'title'            => $request->title,
            'excerpt'          => $request->excerpt,
            'content'          => $request->content,
            'banner'           => $request->banner,
            'location'         => $request->location,
            'tags'             => $tags,
            'meta_title'       => $request->meta_title ?: $request->title,
            'meta_description' => $request->meta_description ?: $request->excerpt,
            'status'           => $request->status,
        ];

        if ($request->status === 'published' && !$blog->published_at) {
            $data['published_at'] = now();
        }

        $blog->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Artikel blog berhasil diperbarui!',
            'data'    => $blog->fresh(['author', 'category']),
        ]);
    }

    /**
     * Delete a blog post.
     */
    public function destroy($id): JsonResponse
    {
        $blog = Blog::withoutGlobalScopes()->findOrFail($id);
        $blog->delete();

        return response()->json([
            'success' => true,
            'message' => 'Artikel blog berhasil dihapus.',
        ]);
    }

    /**
     * Toggle publish status.
     */
    public function togglePublish($id): JsonResponse
    {
        $blog = Blog::withoutGlobalScopes()->findOrFail($id);
        $newStatus = $blog->status === 'published' ? 'draft' : 'published';

        $blog->update([
            'status'       => $newStatus,
            'published_at' => $newStatus === 'published' ? ($blog->published_at ?? now()) : $blog->published_at,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status publikasi artikel berhasil diubah.',
            'data'    => ['status' => $blog->status],
        ]);
    }
}
