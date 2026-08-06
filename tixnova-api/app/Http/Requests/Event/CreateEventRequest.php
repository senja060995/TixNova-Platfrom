<?php

namespace App\Http\Requests\Event;

use Illuminate\Foundation\Http\FormRequest;

class CreateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'description' => ['required', 'string'],
            'short_desc' => ['nullable', 'string', 'max:500'],
            'venue' => ['required', 'string', 'max:255'],
            'venue_detail' => ['nullable', 'string'],
            'city' => ['required', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'start_date' => ['required', 'date', 'after:now'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_free' => ['boolean'],
            'min_age' => ['nullable', 'integer', 'min:0', 'max:99'],
            'tags' => ['nullable', 'array'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'translations' => ['nullable', 'array'],
            'translations.*.locale' => ['nullable', 'string', 'max:5'],
            'translations.*.title' => ['nullable', 'string', 'max:255'],
            'translations.*.description' => ['nullable', 'string'],
            'translations.*.short_desc' => ['nullable', 'string', 'max:500'],
            'translations.*.venue_detail' => ['nullable', 'string'],
            'translations.*.meta_title' => ['nullable', 'string', 'max:255'],
            'translations.*.meta_description' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'start_date.after' => 'Tanggal mulai harus setelah hari ini.',
            'end_date.after' => 'Tanggal selesai harus setelah tanggal mulai.',
        ];
    }
}
