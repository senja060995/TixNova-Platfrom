<?php

namespace App\Http\Requests\Refund;

use Illuminate\Foundation\Http\FormRequest;

class ReviewRefundRequest extends FormRequest
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
