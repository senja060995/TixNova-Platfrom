<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * Upload an image file and return public URL.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
            'file'  => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
        ]);

        $uploadedFile = $request->file('image') ?? $request->file('file');

        if (!$uploadedFile) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada file gambar yang diunggah.',
            ], 422);
        }

        $extension = $uploadedFile->getClientOriginalExtension();
        $filename  = Str::random(20) . '_' . time() . '.' . $extension;

        $path = $uploadedFile->storeAs('uploads', $filename, 'public');

        $url = asset('storage/' . $path);

        return response()->json([
            'success' => true,
            'message' => 'Gambar berhasil diunggah!',
            'url'     => $url,
            'data'    => [
                'url'      => $url,
                'path'     => $path,
                'filename' => $filename,
            ],
        ]);
    }
}
