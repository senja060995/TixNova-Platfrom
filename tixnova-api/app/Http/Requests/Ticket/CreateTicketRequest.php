<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

class CreateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:regular,vip,early_bird,free'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'early_bird_price' => ['nullable', 'numeric', 'min:0', 'lte:price'],
            'early_bird_quota' => ['nullable', 'integer', 'min:1'],
            'early_bird_end' => ['nullable', 'date', 'after:sale_start'],
            'quota' => ['required', 'integer', 'min:1'],
            'min_purchase' => ['nullable', 'integer', 'min:1'],
            'max_purchase' => ['nullable', 'integer', 'min:1', 'max:20'],
            'sale_start' => ['nullable', 'date'],
            'sale_end' => ['nullable', 'date', 'after:sale_start'],
            'includes' => ['nullable', 'array'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer'],
        ];
    }
}
