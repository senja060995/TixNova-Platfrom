<?php

namespace App\Http\Requests\Event;

use Illuminate\Foundation\Http\FormRequest;

class ReviewEventRescheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'approved' => ['required', 'boolean'],
            'review_note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
