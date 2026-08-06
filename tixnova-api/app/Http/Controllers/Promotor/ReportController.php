<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(private ReportService $reports) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->reports->promotorReport($request->user()->tenant_id, $request->all()),
        ]);
    }

    public function eventReport(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEvent($request, $event);

        $report = $this->reports->promotorReport($request->user()->tenant_id, [
            ...$request->all(),
            'event_id' => $event->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                ...$report,
                'event' => [
                    'id' => $event->id,
                    'title' => $event->title,
                    'status' => $event->status,
                ],
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse|Response
    {
        $format = $request->validate(['format' => ['required', 'in:csv,pdf']])['format'];
        $tenantId = $request->user()->tenant_id;
        $report = $this->reports->promotorReport($tenantId, $request->all());
        $filename = 'laporan-promotor-'.$report['filters']['start_date'].'-'.$report['filters']['end_date'];

        if ($format === 'pdf') {
            return Pdf::loadView('reports.promotor', $report)
                ->setPaper('a4', 'portrait')
                ->download("{$filename}.pdf");
        }

        $rows = $this->reports->exportRows($tenantId, $request->all());

        return response()->streamDownload(function () use ($rows) {
            $output = fopen('php://output', 'w');
            fputcsv($output, array_keys($rows->first() ?? [
                'Kode Order' => '',
                'Event' => '',
                'Promotor' => '',
                'Tanggal Pembayaran' => '',
                'Subtotal Tiket' => '',
                'Diskon' => '',
                'Biaya Admin' => '',
                'GMV' => '',
                'Komisi Platform' => '',
                'Payout Promotor' => '',
            ]));

            foreach ($rows as $row) {
                fputcsv($output, $row);
            }

            fclose($output);
        }, "{$filename}.csv", ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function authorizeEvent(Request $request, Event $event): void
    {
        if ($event->tenant_id !== $request->user()->tenant_id) {
            abort(404);
        }
    }
}
