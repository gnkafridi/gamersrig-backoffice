<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
@php
  $logoFull  = 'data:image/png;base64,' . base64_encode(file_get_contents(public_path('images/logo-full.png')));
  $shareUrl  = url('/invoice/v/' . $invoice->share_token);
  $qrSvg = (string) \SimpleSoftwareIO\QrCode\Facades\QrCode::size(130)->margin(1)->generate($shareUrl);
  $qrSrc = 'data:image/svg+xml;base64,' . base64_encode($qrSvg);
  /* ── Social icon generator ─────────────────────────────────────────
     Loads from public/images/{fb|ig}-icon.png if present,
     otherwise generates a pixel-accurate GD version at 56×56 (2×).
  ──────────────────────────────────────────────────────────────── */
  $__socialIcon = function (string $type) use (&$__socialIcon): string {
      // Check for user-supplied file first
      $path = public_path("images/{$type}-icon.png");
      if (file_exists($path)) {
          return 'data:image/png;base64,' . base64_encode(file_get_contents($path));
      }

      $sz    = 80; // render at ~1.4× for crispness
      $img   = imagecreatetruecolor($sz, $sz);
      imagesavealpha($img, true);
      $trans = imagecolorallocatealpha($img, 0, 0, 0, 127);
      imagefill($img, 0, 0, $trans);
      $wh = imagecolorallocate($img, 255, 255, 255);

      // ── Helper: punch rounded corners ─────────────────────────
      $roundCorners = function (int $cr) use ($img, $sz, $trans) {
          for ($x = 0; $x < $sz; $x++) {
              for ($y = 0; $y < $sz; $y++) {
                  $nx = ($x < $cr) ? $cr : (($x >= $sz-$cr) ? $sz-$cr-1 : -1);
                  $ny = ($y < $cr) ? $cr : (($y >= $sz-$cr) ? $sz-$cr-1 : -1);
                  if ($nx >= 0 && $ny >= 0 && ($x-$nx)**2+($y-$ny)**2 > $cr*$cr) {
                      imagesetpixel($img, $x, $y, $trans);
                  }
              }
          }
      };

      if ($type === 'fb') {
          // ── Facebook: classic blue #4267B2, rounded square ────
          $bg = imagecolorallocate($img, 66, 103, 178);
          imagefilledrectangle($img, 0, 0, $sz-1, $sz-1, $bg);
          $roundCorners(12);

          // White "f" — stem + hook arc + crossbar
          // Stem: slightly right-of-centre
          imagefilledrectangle($img, 34, 16, 45, 68, $wh);
          // Top hook: thick arc curving right from stem top
          imagesetthickness($img, 6);
          imagearc($img, 45, 28, 28, 24, 190, 355, $wh);
          imagesetthickness($img, 1);
          // Redraw stem over arc to keep it clean
          imagefilledrectangle($img, 34, 16, 45, 68, $wh);
          // Crossbar
          imagefilledrectangle($img, 20, 39, 45, 47, $wh);

      } else {
          // ── Instagram: rainbow gradient + camera outline ───────
          $grad = [];
          // Bilinear: TL=#833AB4, TR=#5B51D8, BL=#FCAF45, BR=#F56040
          for ($y = 0; $y < $sz; $y++) {
              for ($x = 0; $x < $sz; $x++) {
                  $tx = $x/($sz-1); $ty = $y/($sz-1);
                  $c  = imagecolorallocate($img,
                      (int)((1-$tx)*(1-$ty)*131 + $tx*(1-$ty)*91  + (1-$tx)*$ty*252 + $tx*$ty*245),
                      (int)((1-$tx)*(1-$ty)*58  + $tx*(1-$ty)*81  + (1-$tx)*$ty*175 + $tx*$ty*96 ),
                      (int)((1-$tx)*(1-$ty)*180 + $tx*(1-$ty)*216 + (1-$tx)*$ty*69  + $tx*$ty*64 )
                  );
                  imagesetpixel($img, $x, $y, $c);
                  $grad[$y][$x] = $c;
              }
          }
          $roundCorners(16);

          // Camera outer rounded-rect border (fill white, hollow with gradient)
          $bx1=11;$by1=11;$bx2=69;$by2=69;$bw=5;
          imagefilledrectangle($img, $bx1, $by1, $bx2, $by2, $wh);
          // Hollow interior
          for ($y=$by1+$bw; $y<=$by2-$bw; $y++) {
              for ($x=$bx1+$bw; $x<=$bx2-$bw; $x++) {
                  imagesetpixel($img, $x, $y, $grad[$y][$x]);
              }
          }
          // Round the camera-box corners (radius 10)
          $bcr=10;
          foreach ([[$bx1+$bcr,$by1+$bcr],[$bx2-$bcr,$by1+$bcr],
                    [$bx1+$bcr,$by2-$bcr],[$bx2-$bcr,$by2-$bcr]] as [$ocx,$ocy]) {
              for ($x=$ocx-$bcr; $x<=$ocx+$bcr; $x++) {
                  for ($y=$ocy-$bcr; $y<=$ocy+$bcr; $y++) {
                      if (($x-$ocx)**2+($y-$ocy)**2 > $bcr*$bcr
                          && $x>=$bx1 && $x<=$bx2 && $y>=$by1 && $y<=$by2) {
                          imagesetpixel($img, $x, $y, $grad[$y][$x]);
                      }
                  }
              }
          }
          // Inner circle
          imagesetthickness($img, 5);
          imagearc($img, 40, 40, 30, 30, 0, 360, $wh);
          imagesetthickness($img, 1);
          // Viewfinder dot (top-right area)
          imagefilledellipse($img, 58, 22, 9, 9, $wh);
      }

      ob_start(); imagepng($img); $data = ob_get_clean(); imagedestroy($img);
      return 'data:image/png;base64,' . base64_encode($data);
  };

  $fbIconSrc = $__socialIcon('fb');
  $igIconSrc = $__socialIcon('ig');
  $statusLabels = ['paid'=>'PAID','draft'=>'DRAFT','sent'=>'DUE','overdue'=>'OVERDUE','cancelled'=>'CANCELLED'];
  $statusLabel  = $statusLabels[$invoice->status] ?? strtoupper($invoice->status);
  $badgeBg = match($invoice->status) {
      'paid'      => '#EAF4E3',
      'overdue'   => '#FDECEA',
      'cancelled' => '#FFF3E0',
      default     => '#FFF3E0',
  };
  $badgeColor = match($invoice->status) {
      'paid'      => '#2D5419',
      'overdue'   => '#b71c1c',
      'cancelled' => '#8A5A00',
      default     => '#E65100',
  };

  /* ── GD icon generator ─────────────────────────────────────────
     40×40 px PNG (displayed at 20×20).
     Circle uses a radial gradient:
       centre  #32C022  rgb(50, 192, 34)  — bright green
       edge    #154B0C  rgb(21,  75, 12)  — deep forest green
     Icon is white, drawn on top.
  ────────────────────────────────────────────────────────────── */
  $__icon = function (string $type): string {
      $sz  = 80; // 2× render size for crisp display at 20×20
      $cx  = $cy = 40;
      $img = imagecreatetruecolor($sz, $sz);
      imagesavealpha($img, true);
      imagefill($img, 0, 0, imagecolorallocatealpha($img, 0, 0, 0, 127));
      $wh = imagecolorallocate($img, 255, 255, 255);

      // ── Radial gradient circle ──────────────────────────────
      //    centre  #599528  rgb(89,149,40) — bright icon green
      //    edge    #254B10  rgb(37, 75,16) — deep forest green
      $maxR = $sz / 2;
      for ($r = (int)$maxR; $r >= 0; $r--) {
          $t  = $r / $maxR;
          $rr = (int)(89  + $t * (37  -  89));
          $gg = (int)(149 + $t * (75  - 149));
          $bb = (int)(40  + $t * (16  -  40));
          $c  = imagecolorallocate($img, $rr, $gg, $bb);
          imagefilledellipse($img, $cx, $cy, $r * 2, $r * 2, $c);
      }

      if ($type === 'phone') {
          imagefilledellipse($img, 40, 24, 26, 18, $wh);
          imagefilledellipse($img, 40, 56, 26, 18, $wh);
          imagefilledrectangle($img, 34, 24, 46, 56, $wh);
          $centre = imagecolorallocate($img, 89, 149, 40);
          imagefilledellipse($img, 40, 40, 14, 20, $centre);

      } elseif ($type === 'email') {
          $mid = imagecolorat($img, 40, 40);
          imagefilledrectangle($img, 20, 28, 60, 52, $wh);
          imagefilledpolygon($img, [20, 28, 40, 44, 60, 28], 3, $mid);
          imagefilledpolygon($img, [20, 52, 30, 42, 20, 42], 3, $mid);
          imagefilledpolygon($img, [60, 52, 50, 42, 60, 42], 3, $mid);

      } elseif ($type === 'payment') {
          $mid = imagecolorat($img, 40, 40);
          imagefilledrectangle($img, 18, 28, 62, 52, $wh);
          imagefilledrectangle($img, 18, 34, 62, 40, $mid);
          imagefilledrectangle($img, 22, 42, 32, 50, $mid);
          imageline($img, 24, 42, 24, 50, $wh);
          imageline($img, 28, 42, 28, 50, $wh);

      } elseif ($type === 'location') {
          $mid = imagecolorat($img, 40, 40);
          imagefilledellipse($img, 40, 30, 28, 28, $wh);
          imagefilledpolygon($img, [28, 38, 52, 38, 40, 62], 3, $wh);
          imagefilledellipse($img, 40, 30, 12, 12, $mid);
      }

      ob_start();
      imagepng($img);
      $data = ob_get_clean();
      imagedestroy($img);
      return 'data:image/png;base64,' . base64_encode($data);
  };

  $iconPhone    = $__icon('phone');
  $iconEmail    = $__icon('email');
  $iconPayment  = $__icon('payment');
  $iconLocation = $__icon('location');

@endphp
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  /*
   * ── COLOUR PALETTE (exact pixel samples from reference PDF) ──
   *  #4A7530  table-green    — table header bg (sampled rgb 74,117,48)
   *  #3D6827  total-green    — total amount row bg (sampled rgb 61,104,39)
   *  #2D5419  deep-green     — INVOICE word, amount figures (sampled rgb 45,84,25)
   *  #4A7530  bill-badge     — BILL TO badge bg (same as table-green)
   *  #C8DFB8  pale-mint      — dividers, thin bottom strip
   *  #EAF4E3  status-tint    — paid/status badge background
   * ────────────────────────────────────────────────── */

  body { font-family: Helvetica, sans-serif; font-size: 12px; color: #1c1c1c; background: #fff; }
  a { color: inherit !important; text-decoration: none !important; }
  .gly { font-family: 'DejaVu Sans', sans-serif; }
  .page { padding: 30px 42px 90px 42px; }

  /* ── Header ─────────────────────────────────────── */
  .header-table { width: 100%; margin-bottom: 10px; }
  .header-table td { vertical-align: middle; }
  .invoice-word { font-size: 44px; font-weight: bold; color: #2D5419; letter-spacing: 2px; text-align: right; }
  .header-divider { border: none; border-top: 1.5px solid #C8DFB8; margin: 6px 0 18px; }

  /* ── Meta + Bill To ─────────────────────────────── */
  .meta-table { width: 100%; margin-bottom: 22px; }
  .meta-table td { vertical-align: top; }

  .bill-badge {
    display: inline-block; background: #4A7530; color: #fff;
    font-size: 10px; font-weight: bold; letter-spacing: 1px;
    padding: 4px 12px; border-radius: 4px; margin-bottom: 10px;
  }
  .customer-name { font-size: 17px; font-weight: bold; color: #141414; margin-bottom: 9px; }
  .cust-row { font-size: 11px; color: #2a2a2a; padding: 3px 0; }
  .cust-row .lbl { font-weight: bold; }
  .cust-addr { font-size: 11px; color: #2a2a2a; padding-left: 30px; margin-top: 2px; line-height: 1.5; }

  .ico { width: 20px; height: 20px; margin-right: 8px; vertical-align: middle; }

  .meta-right { text-align: right; }
  .meta-line { font-size: 13px; color: #1c1c1c; margin-bottom: 4px; }
  .meta-line strong { font-weight: bold; }
  .meta-rule { border: none; border-top: 1px solid #C8DFB8; margin: 12px 0; }
  .status-wrap { font-size: 12px; color: #444; }
  .status-badge {
    display: inline-block; background: #EAF4E3; color: #2D5419;
    font-size: 13px; font-weight: bold; padding: 5px 16px;
    border-radius: 5px; margin-left: 6px; text-transform: uppercase; letter-spacing: 0.5px;
  }

  /* ── Items Table ────────────────────────────────── */
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  .items-table thead tr { background: #4A7530; }
  .items-table thead th {
    padding: 11px 12px; text-align: left; font-size: 12px;
    font-weight: bold; color: #fff; letter-spacing: 0.3px;
  }
  .items-table thead th.ctr { text-align: center; }
  .items-table thead th.right { text-align: right; }
  .items-table tbody td { padding: 11px 12px; font-size: 12px; vertical-align: top; border-bottom: 1px solid #e4eedc; }
  .items-table tbody td.ctr { text-align: center; }
  .items-table tbody td.right { text-align: right; }
  .item-name { font-weight: bold; color: #141414; }
  .item-sn { font-size: 10px; color: #6a6a6a; padding: 4px 12px 10px; }

  /* ── Totals ─────────────────────────────────────── */
  .totals-wrapper { width: 100%; margin-top: 14px; }
  .totals-spacer { width: 52%; }
  .totals-box { width: 48%; vertical-align: top; }
  .trow { width: 100%; }
  .trow td { padding: 7px 6px; font-size: 12px; border-bottom: 1px solid #e4eedc; }
  .trow td.label { color: #444; }
  .trow td.amount { text-align: right; font-weight: bold; color: #2D5419; }
  .total-final { width: 100%; background: #3D6827; border-radius: 5px; margin-top: 8px; }
  .total-final td { padding: 11px 14px; color: #fff; font-weight: bold; font-size: 14px; }
  .total-final td.amount { text-align: right; font-size: 16px; }

  /* ── Note ───────────────────────────────────────── */
  .note-section { margin-top: 22px; padding-top: 12px; border-top: 1px solid #C8DFB8; }
  .note-text { font-size: 11px; color: #2a2a2a; }
  .note-text strong { font-weight: bold; }

  /* ── Footer ─────────────────────────────────────── */
  .footer-divider { border: none; border-top: 1px solid #C8DFB8; margin: 14px 0; }
  .footer-table { width: 100%; }
  .footer-contacts { width: 58%; vertical-align: top; }
  .footer-decoration { width: 42%; vertical-align: bottom; text-align: right; }
  .frow { padding: 7px 0; font-size: 11px; color: #2a2a2a; border-bottom: 1px solid #e8f0e4; }
  .frow .lbl { font-weight: bold; }
  .thankyou { font-size: 13px; font-weight: bold; color: #141414; margin: 14px 0 8px; }
  .soc {
    display: inline-block; width: 18px; height: 18px; border-radius: 4px;
    text-align: center; line-height: 18px; color: #fff; font-size: 11px;
    font-weight: bold; margin-right: 7px; vertical-align: middle;
  }
  .soc-fb { background: #1877F2; }
  .soc-ig { background: #E1306C; }
  .soc-row { font-size: 11px; color: #2a2a2a; padding: 3px 0; }

  /* Bottom bars */
  .bottom-bar  { position: fixed; bottom: 0; left: 0; right: 0; height: 16px; background: #4A7530; }
  .bottom-bar2 { position: fixed; bottom: 16px; left: 0; right: 0; height: 4px; background: #C8DFB8; }
  .bottom-bar-grad { background-size: cover; background-repeat: no-repeat; }
</style>
</head>
<body>
<div class="page">

  {{-- ── HEADER ─────────────────────────────────── --}}
  <table class="header-table">
    <tr>
      <td style="width:60%; vertical-align:middle;">
        <img src="{{ $logoFull }}" style="height:62px; width:auto;" alt="GamersRig">
      </td>
      <td style="width:40%; text-align:right; vertical-align:middle;">
        <div class="invoice-word">ORDER</div>
      </td>
    </tr>
  </table>
  <hr class="header-divider">

  {{-- ── META + BILL TO ─────────────────────────── --}}
  <table class="meta-table">
    <tr>
      <td style="width:54%;">
        <div class="bill-badge">BILL TO:</div>
        <div class="customer-name">{{ $invoice->customer->name }}</div>
        @if($invoice->customer->phone)
          <div class="cust-row" style="display:table; width:100%; margin-bottom:8px;">
            <div style="display:table-cell; width:28px; vertical-align:middle;">
              <img class="ico" src="{{ $iconPhone }}" alt="">
            </div>
            <div style="display:table-cell; vertical-align:middle;">
              <div style="font-size:9px; color:#999; margin-bottom:1px;">Customer Phone Number</div>
              <div style="font-size:12px; font-weight:bold; color:#141414;">{{ $invoice->customer->phone }}</div>
            </div>
          </div>
        @endif
        @if($invoice->customer->address || $invoice->customer->city)
          <div class="cust-row" style="display:table; width:100%;">
            <div style="display:table-cell; width:28px; vertical-align:top; padding-top:2px;">
              <img class="ico" src="{{ $iconLocation }}" alt="">
            </div>
            <div style="display:table-cell; vertical-align:middle;">
              <div style="font-size:9px; color:#999; margin-bottom:1px;">Customer Billing Address</div>
              <div style="font-size:12px; font-weight:bold; color:#141414;">{{ trim(($invoice->customer->address ?? '') . ', ' . ($invoice->customer->city ?? ''), ', ') }}</div>
            </div>
          </div>
        @endif
      </td>
      <td style="width:46%;">
        <div class="meta-right">
          <div class="meta-line"><strong>Order No:</strong> {{ $invoice->invoice_number }}</div>
          <div class="meta-line"><strong>Date:</strong> {{ $invoice->invoice_date->format('j F, Y') }}</div>
          @if($invoice->due_date)
            <div class="meta-line"><strong>Due:</strong> {{ $invoice->due_date->format('j F, Y') }}</div>
          @endif
          <hr class="meta-rule">
          <div class="status-wrap"><span class="status-badge" style="background: {{ $badgeBg }}; color: {{ $badgeColor }};">{{ $statusLabel }}</span></div>
        </div>
      </td>
    </tr>
  </table>

  {{-- ── ITEMS TABLE ────────────────────────────── --}}
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:44%;">Item</th>
        <th style="width:30%;">Category</th>
        <th class="ctr" style="width:9%;">Qty</th>
        <th class="right" style="width:17%;">Amount</th>
      </tr>
    </thead>
    <tbody>
      @foreach($invoice->items as $item)
      <tr>
        <td><span class="item-name">{{ $item->product_name }}</span></td>
        <td>{{ $item->category ?: ($item->product?->category ?: '—') }}</td>
        <td class="ctr">{{ $item->quantity }}</td>
        <td class="right"><strong>Rs. {{ number_format($item->total, 0) }}</strong></td>
      </tr>
      @if($item->serial_number)
      <tr><td colspan="4" class="item-sn">SN, {{ $item->serial_number }}</td></tr>
      @endif
      @endforeach
    </tbody>
  </table>

  {{-- ── TOTALS ─────────────────────────────────── --}}
  <table class="totals-wrapper">
    <tr>
      <td class="totals-spacer"></td>
      <td class="totals-box">
        <table style="width:100%">
          <tr class="trow">
            <td class="label">Item Cost:</td>
            <td class="amount">Rs. {{ number_format($invoice->subtotal, 0) }}</td>
          </tr>
          @if(floatval($invoice->discount) > 0)
          <tr class="trow">
            <td class="label">Discount:</td>
            <td class="amount" style="color:#c62828;">- Rs. {{ number_format($invoice->discount, 0) }}</td>
          </tr>
          @endif
          @if(floatval($invoice->tax) > 0)
          <tr class="trow">
            <td class="label">Tax:</td>
            <td class="amount">Rs. {{ number_format($invoice->tax, 0) }}</td>
          </tr>
          @endif
          @if(floatval($invoice->delivery_fee) > 0)
          <tr class="trow">
            <td class="label">Delivery Fee:</td>
            <td class="amount">Rs. {{ number_format($invoice->delivery_fee, 0) }}</td>
          </tr>
          @endif
        </table>
        <table class="total-final">
          <tr>
            <td>TOTAL AMOUNT:</td>
            <td class="amount">Rs. {{ number_format($invoice->total, 0) }}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  {{-- ── NOTE ───────────────────────────────────── --}}
  <div class="note-section">
    <span class="note-text"><strong>Note:</strong> {{ $invoice->notes ?: 'No Return and Warranty on any item until the mentioned.' }}</span>
  </div>

  {{-- ── FOOTER ─────────────────────────────────── --}}
  <hr class="footer-divider">
  <table class="footer-table">
    <tr>
      <td class="footer-contacts">
        <div class="frow" style="display:table;width:100%;"><div style="display:table-cell;width:28px;vertical-align:middle;"><img class="ico" src="{{ $iconPhone }}" alt=""></div><div style="display:table-cell;vertical-align:middle;">+92-324-3564474</div></div>
        @if($invoice->payment_method)
        <div class="frow" style="display:table;width:100%;"><div style="display:table-cell;width:28px;vertical-align:middle;"><img class="ico" src="{{ $iconPayment }}" alt=""></div><div style="display:table-cell;vertical-align:middle;"><span class="lbl">Payment Method:</span> {{ $invoice->payment_method }}</div></div>
        @endif
        <div class="frow" style="display:table;width:100%;"><div style="display:table-cell;width:28px;vertical-align:top;padding-top:2px;"><img class="ico" src="{{ $iconEmail }}" alt=""></div><div style="display:table-cell;vertical-align:top;">gamersrig.official@gmail.com<br>www.GamersRig.com</div></div>
        <div class="frow" style="display:table;width:100%;"><div style="display:table-cell;width:28px;vertical-align:middle;"><img class="ico" src="{{ $iconLocation }}" alt=""></div><div style="display:table-cell;vertical-align:middle;">DS Sheet#26 Model Colony Malir, Karachi</div></div>

        <div class="thankyou">Thank you for shopping with GamersRig <span style="color:#27B81D !important; font-family:'DejaVu Sans',sans-serif;">&#10084;</span></div>
        <div class="soc-row">
          <img src="{{ $fbIconSrc }}" style="width:18px;height:18px;vertical-align:middle;border-radius:4px;margin-right:7px;" alt="fb">
          facebook.com/gamersrigpak
        </div>
        <div class="soc-row">
          <img src="{{ $igIconSrc }}" style="width:18px;height:18px;vertical-align:middle;border-radius:4px;margin-right:7px;" alt="ig">
          instagram.com/gamersrig
        </div>
      </td>
      <td class="footer-decoration">
        <div style="text-align:center;">
          <img src="{{ $qrSrc }}" style="width:100px; height:100px; display:block; margin:0 auto 4px;" alt="QR">
          <div style="font-size:9px; color:#666; letter-spacing:0.3px;">Scan to view invoice</div>
        </div>
      </td>
    </tr>
  </table>

</div>

<div class="bottom-bar2"></div>
<div class="bottom-bar"></div>
</body>
</html>
