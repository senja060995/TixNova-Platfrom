<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\WebhookSubscription;
use App\Services\CommunityService;
use App\Services\FeatureStoreService;
use App\Services\LedgerService;
use App\Services\TrustScoreService;
use App\Services\WebhookService;

class OrderObserver
{
    public function __construct(
        private LedgerService $ledger,
        private TrustScoreService $trust,
        private FeatureStoreService $features,
        private WebhookService $webhooks,
        private CommunityService $community,
    ) {}

    public function updated(Order $order): void
    {
        if (! $order->wasChanged('status')) {
            return;
        }

        $previous = $order->getOriginal('status');

        if ($previous === 'pending' && $order->status === 'paid') {
            $this->ledger->recordSale($order);
            $this->trust->refreshScore($order->tenant);
            $this->features->recordOrder($order);
            $this->webhooks->dispatchOrder($order, WebhookSubscription::EVENT_ORDER_PAID);
            $this->community->recordPaidOrder($order);
        }

        if ($order->status === 'refunded') {
            $this->ledger->recordRefund($order);
            $this->trust->refreshScore($order->tenant);
            $this->features->recordRefund($order);
            $this->webhooks->dispatchOrder($order, WebhookSubscription::EVENT_ORDER_REFUNDED);
            $this->community->reversePayout($order);
        }
    }
}
