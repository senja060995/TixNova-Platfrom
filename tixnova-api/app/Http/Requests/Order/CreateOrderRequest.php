<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.ticket_id' => ['required', 'integer', 'distinct', 'exists:tickets,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:10'],
            'items.*.attendees' => ['nullable', 'array'],
            'items.*.seat_ids' => ['nullable', 'array'],
            'items.*.seat_ids.*' => ['integer', 'distinct', 'exists:seats,id'],
            'items.*.attendees.*.name' => ['nullable', 'string', 'max:255'],
            'items.*.attendees.*.email' => ['nullable', 'email', 'max:255'],
            'items.*.attendees.*.phone' => ['nullable', 'string', 'max:20'],
            'voucher_code' => ['nullable', 'string', 'max:50'],
            'referral_code' => ['nullable', 'string', 'max:20'],
            'community_code' => ['nullable', 'string', 'max:12'],
            'source' => ['nullable', 'string', 'max:40'],
            'payment_method' => ['required', 'in:bank_transfer,ewallet,qris,credit_card,va'],
            'buyer_name' => ['required', 'string', 'max:255'],
            'buyer_email' => ['required', 'email', 'max:255'],
            'buyer_phone' => ['required', 'string', 'max:20'],
        ];
    }
}
