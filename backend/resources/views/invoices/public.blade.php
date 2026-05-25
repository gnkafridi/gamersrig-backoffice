<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Order {{ $invoice->invoice_number }} – GamersRig</title>
<link rel="icon" type="image/png" href="{{ asset('images/logo-icon.png') }}">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f0f4f0;
    color: #1c1c1c;
    min-height: 100vh;
    padding: 32px 16px 64px;
  }

  .card {
    max-width: 780px;
    margin: 0 auto;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,.10);
    overflow: hidden;
  }

  /* ── Header ── */
  .header {
    background: #fff;
    padding: 32px 40px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .header img.logo { height: 56px; width: auto; }
  .invoice-word {
    font-size: 38px;
    font-weight: 800;
    color: #2D5419;
    letter-spacing: 3px;
  }
  .header-divider {
    border: none;
    border-top: 2px solid #C8DFB8;
    margin: 20px 40px 0;
  }

  /* ── Meta row ── */
  .meta {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px 40px;
    gap: 24px;
  }
  .bill-badge {
    display: inline-block;
    background: #4A7530;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    padding: 4px 14px;
    border-radius: 4px;
    margin-bottom: 10px;
    text-transform: uppercase;
  }
  .customer-name { font-size: 20px; font-weight: 700; margin-bottom: 10px; }
  .cust-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #444;
    margin-bottom: 5px;
  }
  .ico-circle {
    display: inline-flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border-radius: 50%;
    background: #4A7530; color: #fff; font-size: 12px;
    flex-shrink: 0;
  }

  .meta-right { text-align: right; }
  .meta-line { font-size: 14px; color: #333; margin-bottom: 5px; }
  .meta-line strong { font-weight: 700; }
  .meta-rule { border: none; border-top: 1px solid #C8DFB8; margin: 14px 0; }
  .status-badge {
    display: inline-block;
    font-size: 13px;
    font-weight: 700;
    padding: 6px 18px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ── Items table ── */
  .items-wrap { padding: 0 40px; }
  table.items {
    width: 100%;
    border-collapse: collapse;
    border-radius: 8px;
    overflow: hidden;
  }
  table.items thead tr { background: #4A7530; }
  table.items thead th {
    padding: 12px 14px;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  table.items thead th.ctr { text-align: center; }
  table.items thead th.right { text-align: right; }
  table.items tbody td {
    padding: 12px 14px;
    font-size: 13px;
    border-bottom: 1px solid #e4eedc;
    vertical-align: top;
  }
  table.items tbody td.ctr { text-align: center; }
  table.items tbody td.right { text-align: right; }
  table.items tbody tr:last-child td { border-bottom: none; }
  .item-name { font-weight: 700; color: #141414; }
  .item-sn { font-size: 11px; color: #888; margin-top: 3px; }

  /* ── Totals ── */
  .totals-section {
    display: flex;
    justify-content: flex-end;
    padding: 16px 40px 28px;
  }
  .totals-box { width: 260px; }
  .trow {
    display: flex;
    justify-content: space-between;
    padding: 7px 0;
    font-size: 13px;
    border-bottom: 1px solid #e4eedc;
  }
  .trow .label { color: #555; }
  .trow .amount { font-weight: 700; color: #2D5419; }
  .trow .amount.discount { color: #c62828; }
  .total-final {
    background: #3D6827;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 13px 16px;
    margin-top: 10px;
    color: #fff;
    font-weight: 700;
    font-size: 15px;
  }
  .total-final .amount { font-size: 18px; }

  /* ── Notes ── */
  .notes {
    margin: 0 40px 24px;
    padding: 12px 16px;
    background: #f5faf2;
    border-left: 3px solid #4A7530;
    border-radius: 4px;
    font-size: 13px;
    color: #333;
  }
  .notes strong { font-weight: 700; }

  /* ── Footer ── */
  .footer-divider { border: none; border-top: 1px solid #C8DFB8; margin: 0 40px; }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 20px 40px 28px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .footer-left { font-size: 12px; color: #444; }
  .frow { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #e8f0e4; }
  .frow:last-of-type { border-bottom: none; }
  .frow .ico-circle { margin-right: 0; }
  .thankyou { font-size: 14px; font-weight: 700; color: #141414; margin: 12px 0 8px; }
  .soc-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #444; margin-bottom: 5px; }
  .soc-icon {
    width: 20px; height: 20px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .soc-fb { background: #4267B2; font-size:13px; font-weight:800; letter-spacing:-0.5px; }
  .soc-ig { background: linear-gradient(135deg,#833AB4 0%,#C13584 40%,#F77737 80%,#FCAF45 100%); font-size:12px; }

  .footer-right { text-align: right; }
  .footer-right img { width: 180px; opacity: .9; }

  /* ── Bottom bar ── */
  .bottom-bar-wrap { display: flex; flex-direction: column; }
  .bar-mint { height: 4px; background: #C8DFB8; }
  .bar-green { height: 14px; background: #4A7530; }

  /* Print button */
  .print-btn {
    display: block;
    width: fit-content;
    margin: 20px auto 0;
    background: #4A7530;
    color: #fff;
    border: none;
    padding: 10px 28px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.3px;
  }
  .print-btn:hover { background: #3D6827; }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { background: #fff !important; padding: 0 !important; margin: 0 !important; }
    .print-btn { display: none !important; }
    .card {
      box-shadow: none !important;
      border-radius: 0 !important;
      max-width: 100% !important;
      margin: 0 !important;
    }
  }
  @media (max-width: 600px) {
    .header, .meta, .items-wrap, .totals-section, .footer, .footer-divider, .notes { padding-left: 20px; padding-right: 20px; }
    .header { flex-direction: column; gap: 12px; text-align: center; }
    .header-divider { margin-left: 20px; margin-right: 20px; }
    .meta { flex-direction: column; }
    .meta-right { text-align: left; }
    .totals-box { width: 100%; }
    .footer { flex-direction: column; }
    .footer-right { display: none; }
  }
</style>
</head>
<body>

<div class="card">

  {{-- Header --}}
  <div class="header">
    <div>
      <img class="logo" src="{{ asset('images/logo-full.png') }}" alt="GamersRig">
      <div style="text-align:center;font-size:11px;color:#4A7530;font-weight:600;letter-spacing:0.5px;margin-top:4px;">www.GamersRig.com</div>
    </div>
    <div class="invoice-word">INVOICE</div>
  </div>
  <hr class="header-divider">

  {{-- Meta --}}
  <div class="meta">
    <div class="bill-to">
      <div class="bill-badge">Bill To:</div>
      <div class="customer-name">{{ $invoice->customer->name }}</div>
      @php
        $phone   = $invoice->customer->phone ?? null;
        $address = trim(($invoice->customer->address ?? '') . ($invoice->customer->city ? ', ' . $invoice->customer->city : ''), ', ');
      @endphp
      <div class="cust-row">
        <span class="ico-circle"><i class="fa-solid fa-phone"></i></span>
        <div>
          <div style="font-size:10px;color:#999;margin-bottom:2px;">Phone</div>
          @if($phone)
            <span>{{ $phone }}</span>
          @else
            <div style="color:#aaa;">N/A</div>
          @endif
        </div>
      </div>
      <div class="cust-row">
        <span class="ico-circle"><i class="fa-solid fa-location-dot"></i></span>
        <div>
          <div style="font-size:10px;color:#999;margin-bottom:2px;">Address</div>
          <div @if(!$address) style="color:#aaa;" @endif>{{ $address ?: 'N/A' }}</div>
        </div>
      </div>
    </div>
    <div class="meta-right">
      <div class="meta-line"><strong>Order No:</strong> {{ $invoice->invoice_number }}</div>
      <div class="meta-line"><strong>Date:</strong> {{ $invoice->invoice_date->format('j F, Y') }}</div>
      @if($invoice->due_date)
        <div class="meta-line"><strong>Due:</strong> {{ $invoice->due_date->format('j F, Y') }}</div>
      @endif
      @if($invoice->payment_method)
        <div class="meta-line"><strong>Payment Method:</strong> {{ $invoice->payment_method }}</div>
      @endif
      <hr class="meta-rule">
      @php
        $statusLabels = ['paid'=>'PAID','draft'=>'Draft','sent'=>'DUE','overdue'=>'OVERDUE','cancelled'=>'Cancelled'];
        $statusLabel  = $statusLabels[$invoice->status] ?? strtoupper($invoice->status);
        $isPaid       = $invoice->status === 'paid';
        $badgeBg      = match($invoice->status) {
            'paid'      => '#EAF4E3',
            'overdue'   => '#FDECEA',
            'cancelled' => '#FFF3E0',
            default     => '#FFF3E0',
        };
        $badgeColor   = match($invoice->status) {
            'paid'      => '#2D5419',
            'overdue'   => '#b71c1c',
            'cancelled' => '#8A5A00',
            default     => '#E65100',
        };
      @endphp
      <span class="status-badge" style="background:{{ $badgeBg }};color:{{ $badgeColor }};">{{ $statusLabel }}</span>
    </div>
  </div>

  {{-- Items --}}
  <div class="items-wrap">
    <table class="items">
      <thead>
        <tr>
          <th style="width:42%">Item</th>
          <th style="width:28%">Category</th>
          <th class="ctr" style="width:10%">Qty</th>
          <th class="right" style="width:20%">Amount</th>
        </tr>
      </thead>
      <tbody>
        @foreach($invoice->items as $item)
        <tr>
          <td>
            <div class="item-name">{{ $item->product_name }}</div>
            @if($item->serial_number)
              <div class="item-sn">S/N: {{ $item->serial_number }}</div>
            @endif
          </td>
          <td>{{ $item->category ?: ($item->product?->category ?: '—') }}</td>
          <td class="ctr">{{ $item->quantity }}</td>
          <td class="right"><strong>Rs. {{ number_format($item->total, 0) }}</strong></td>
        </tr>
        @endforeach
      </tbody>
    </table>
  </div>

  {{-- Totals --}}
  <div class="totals-section">
    <div class="totals-box">
      <div class="trow">
        <span class="label">Item Cost</span>
        <span class="amount">Rs. {{ number_format($invoice->subtotal, 0) }}</span>
      </div>
      @if(floatval($invoice->discount) > 0)
      <div class="trow">
        <span class="label">Discount</span>
        <span class="amount discount">− Rs. {{ number_format($invoice->discount, 0) }}</span>
      </div>
      @endif
      @if(floatval($invoice->tax) > 0)
      <div class="trow">
        <span class="label">Tax</span>
        <span class="amount">Rs. {{ number_format($invoice->tax, 0) }}</span>
      </div>
      @endif
      @if(floatval($invoice->delivery_fee) > 0)
      <div class="trow">
        <span class="label">Delivery Fee</span>
        <span class="amount">Rs. {{ number_format($invoice->delivery_fee, 0) }}</span>
      </div>
      @endif
      <div class="total-final">
        <span>Total Amount</span>
        <span class="amount">Rs. {{ number_format($invoice->total, 0) }}</span>
      </div>
    </div>
  </div>

  {{-- Notes --}}
  @php $noteText = $invoice->notes ?: 'No Return and Warranty on any item until the mentioned.'; @endphp
  <div class="notes"><strong>Note:</strong> {{ $noteText }}</div>

  {{-- Footer --}}
  <hr class="footer-divider">
  <div class="footer">
    <div class="footer-left">
      <div class="frow"><span class="ico-circle"><i class="fa-solid fa-phone"></i></span>+92-324-3564474</div>
      <div class="frow">
        <span class="ico-circle"><i class="fa-solid fa-envelope"></i></span>
        <div>
          <div>gamersrig.official@gmail.com</div>
          <div>www.GamersRig.com</div>
        </div>
      </div>
      <div class="frow"><span class="ico-circle"><i class="fa-solid fa-location-dot"></i></span>DS Sheet#26 Model Colony Malir, Karachi</div>
      <div class="thankyou">Thank you for shopping with GamersRig <i class="fa-solid fa-heart" style="color:#27B81D;"></i></div>
      <div class="soc-row">
        <span class="soc-icon soc-fb">f</span>facebook.com/gamersrigpak
      </div>
      <div class="soc-row">
        <span class="soc-icon soc-ig" style="font-size:13px;">◎</span>instagram.com/gamersrig
      </div>
    </div>
    <div class="footer-right">
      @php
        $shareUrl = url('/invoice/v/' . $invoice->share_token);
        $qrSvg = (string) \SimpleSoftwareIO\QrCode\Facades\QrCode::size(130)->margin(1)->generate($shareUrl);
        $qrSrc = 'data:image/svg+xml;base64,' . base64_encode($qrSvg);
      @endphp
      <img src="{{ $qrSrc }}" style="width:110px;height:110px;display:block;margin:0 auto 6px;" alt="QR Code">
      <div style="font-size:11px;color:#666;text-align:center;">Scan to view invoice</div>
    </div>
  </div>

  <div class="bar-mint"></div>
  <div class="bar-green"></div>
</div>

<button class="print-btn" onclick="window.print()">
  <i class="fa-solid fa-file-arrow-down" style="margin-right:8px;"></i>Print / Save PDF
</button>

</body>
</html>
