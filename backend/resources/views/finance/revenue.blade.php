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
  table.data tbody td { padding:12px 14px; font-size:13px; border-bottom:1px solid #e4eedc; }
  table.data tbody td.r { text-align:right; font-weight:bold; }
  .label { color:#555; }
  .grand { background:#3D6827; }
  .grand td { color:#fff; font-weight:bold; font-size:15px; }
  .foot { margin-top:24px; font-size:10px; color:#888; text-align:center; }
</style>
</head>
<body>
<div class="page">
  <table class="head">
    <tr>
      <td style="width:55%;"><img src="{{ $logo }}" style="height:54px;"></td>
      <td style="width:45%;">
        <div class="title">REVENUE</div>
        <div class="sub">Period: {{ $period }}</div>
      </td>
    </tr>
  </table>
  <hr>

  <table class="data">
    <tbody>
      <tr><td class="label">Advance Collected</td><td class="r">Rs. {{ number_format($advance_collected, 0) }}</td></tr>
      <tr><td class="label">COD Received</td><td class="r">Rs. {{ number_format($cod_received, 0) }}</td></tr>
      <tr><td class="label">COD Pending</td><td class="r">Rs. {{ number_format($cod_pending, 0) }}</td></tr>
      <tr class="grand"><td>Total Revenue</td><td class="r">Rs. {{ number_format($total_revenue, 0) }}</td></tr>
    </tbody>
  </table>

  <div class="foot">GamersRig — Generated {{ now()->format('j F, Y H:i') }}</div>
</div>
</body>
</html>
