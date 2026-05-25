<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
@php $logo = 'data:image/png;base64,' . base64_encode(file_get_contents(public_path('images/logo-full.png'))); @endphp
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Helvetica, sans-serif; font-size: 12px; color:#1c1c1c; }
  .page { padding: 36px 42px; }
  .head { width:100%; margin-bottom: 14px; }
  .head td { vertical-align: middle; }
  .title { font-size: 26px; font-weight: bold; color:#2D5419; text-align:right; }
  .sub { font-size: 13px; color:#555; text-align:right; }
  hr { border:none; border-top:1.5px solid #C8DFB8; margin: 10px 0 18px; }
  table.data { width:100%; border-collapse: collapse; }
  table.data thead tr { background:#4A7530; }
  table.data thead th { padding:10px 12px; text-align:left; font-size:11px; color:#fff; text-transform:uppercase; letter-spacing:.3px; }
  table.data thead th.r { text-align:right; }
  table.data tbody td { padding:9px 12px; font-size:12px; border-bottom:1px solid #e4eedc; }
  table.data tbody td.r { text-align:right; }
  .net { font-weight:bold; color:#2D5419; }
  tr.total td { font-weight:bold; border-top:2px solid #C8DFB8; }
  .foot { margin-top:24px; font-size:10px; color:#888; text-align:center; }
</style>
</head>
<body>
<div class="page">
  <table class="head">
    <tr>
      <td style="width:55%;"><img src="{{ $logo }}" style="height:54px;"></td>
      <td style="width:45%;">
        <div class="title">SETTLEMENT</div>
        <div class="sub">Period: {{ $period }}</div>
      </td>
    </tr>
  </table>
  <hr>

  <table class="data">
    <thead>
      <tr>
        <th>Partner</th>
        <th class="r">Investment</th>
        <th class="r">Spillover</th>
        <th class="r">Expenses</th>
        <th class="r">Advance Settled</th>
        <th class="r">Net Settlement</th>
      </tr>
    </thead>
    <tbody>
      @php $totalNet = 0; @endphp
      @foreach($rows as $r)
        @php $totalNet += $r['net_settlement']; @endphp
        <tr>
          <td>{{ $r['partner_name'] }}</td>
          <td class="r">Rs. {{ number_format($r['total_investment'], 0) }}</td>
          <td class="r">Rs. {{ number_format($r['spillover'], 0) }}</td>
          <td class="r">Rs. {{ number_format($r['total_expenses'], 0) }}</td>
          <td class="r">Rs. {{ number_format($r['advance_settled'], 0) }}</td>
          <td class="r net">Rs. {{ number_format($r['net_settlement'], 0) }}</td>
        </tr>
      @endforeach
      <tr class="total">
        <td colspan="5">Total</td>
        <td class="r">Rs. {{ number_format($totalNet, 0) }}</td>
      </tr>
    </tbody>
  </table>

  <div class="foot">GamersRig — Generated {{ now()->format('j F, Y H:i') }}</div>
</div>
</body>
</html>
