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
  .summary { background:#EAF4E3; border-radius:6px; padding:12px 16px; margin-bottom:18px; font-size:13px; }
  .summary strong { color:#2D5419; }
  table.data { width:100%; border-collapse: collapse; }
  table.data thead tr { background:#4A7530; }
  table.data thead th { padding:10px 12px; text-align:left; font-size:11px; color:#fff; text-transform:uppercase; }
  table.data thead th.r { text-align:right; }
  table.data tbody td { padding:9px 12px; font-size:12px; border-bottom:1px solid #e4eedc; }
  table.data tbody td.r { text-align:right; }
  .share { font-weight:bold; color:#2D5419; }
  .foot { margin-top:24px; font-size:10px; color:#888; text-align:center; }
</style>
</head>
<body>
<div class="page">
  <table class="head">
    <tr>
      <td style="width:55%;"><img src="{{ $logo }}" style="height:54px;"></td>
      <td style="width:45%;">
        <div class="title">QUARTERLY SHARE</div>
        <div class="sub">{{ $year }} — Q{{ $quarter }}</div>
      </td>
    </tr>
  </table>
  <hr>

  <div class="summary">
    Total Quarterly Revenue: <strong>Rs. {{ number_format($total_revenue, 0) }}</strong>
    &nbsp;|&nbsp; Partners: <strong>{{ $partner_count }}</strong>
    &nbsp;|&nbsp; Share each: <strong>Rs. {{ number_format($share_amount, 0) }}</strong>
  </div>

  <table class="data">
    <thead>
      <tr>
        <th>Partner</th>
        <th class="r">Total Revenue</th>
        <th class="r">Partners</th>
        <th class="r">Share Amount</th>
      </tr>
    </thead>
    <tbody>
      @foreach($rows as $r)
        <tr>
          <td>{{ $r['partner_name'] }}</td>
          <td class="r">Rs. {{ number_format($r['total_revenue'], 0) }}</td>
          <td class="r">{{ $r['partner_count'] }}</td>
          <td class="r share">Rs. {{ number_format($r['share_amount'], 0) }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>

  <div class="foot">GamersRig — Generated {{ now()->format('j F, Y H:i') }}</div>
</div>
</body>
</html>
