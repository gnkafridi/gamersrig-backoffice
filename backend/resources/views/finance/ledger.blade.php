<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
@php $logo = 'data:image/png;base64,' . base64_encode(file_get_contents(public_path('images/logo-full.png'))); @endphp
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Helvetica, sans-serif; font-size: 11px; color:#1c1c1c; }
  .page { padding: 30px 34px; }
  .head { width:100%; margin-bottom: 12px; }
  .head td { vertical-align: middle; }
  .title { font-size: 24px; font-weight: bold; color:#2D5419; text-align:right; }
  .sub { font-size: 12px; color:#555; text-align:right; }
  hr { border:none; border-top:1.5px solid #C8DFB8; margin: 8px 0 14px; }
  .owe { font-size: 14px; font-weight:bold; color:#b45309; margin-bottom: 12px; }
  .owe.settled { color:#15803d; }
  h3 { font-size:12px; color:#2D5419; margin: 14px 0 6px; text-transform:uppercase; letter-spacing:.3px; }
  table.data { width:100%; border-collapse: collapse; margin-bottom: 8px; }
  table.data thead tr { background:#4A7530; }
  table.data thead th { padding:7px 9px; text-align:left; font-size:10px; color:#fff; text-transform:uppercase; }
  table.data thead th.r { text-align:right; }
  table.data tbody td { padding:6px 9px; font-size:11px; border-bottom:1px solid #e4eedc; }
  table.data tbody td.r { text-align:right; }
  .owes { color:#b91c1c; font-weight:bold; }
  .owed { color:#15803d; font-weight:bold; }
  .foot { margin-top:18px; font-size:10px; color:#888; text-align:center; }
</style>
</head>
<body>
<div class="page">
  <table class="head">
    <tr>
      <td style="width:55%;"><img src="{{ $logo }}" style="height:50px;"></td>
      <td style="width:45%;">
        <div class="title">PARTNER LEDGER</div>
        <div class="sub">{{ $summary['period'] ?? 'All periods' }} &middot; Generated {{ now()->format('j M Y') }}</div>
      </td>
    </tr>
  </table>
  <hr>

  <div class="owe {{ $who_owes_whom['settled'] ? 'settled' : '' }}">
    @if($who_owes_whom['settled']) All settled — nobody owes anyone
    @else {{ $who_owes_whom['text'] }} Rs. {{ number_format($who_owes_whom['amount'], 0) }} @endif
  </div>

  <h3>Partner Summary</h3>
  <table class="data">
    <thead>
      <tr>
        <th>Partner</th><th class="r">Total Paid</th><th class="r">Total Owed</th>
        <th class="r">Reimb. Paid</th><th class="r">Reimb. Recv</th><th class="r">Outstanding</th>
      </tr>
    </thead>
    <tbody>
      @foreach($summary['partners'] as $p)
        <tr>
          <td>{{ $p['partner_name'] }}</td>
          <td class="r">Rs. {{ number_format($p['total_paid'], 0) }}</td>
          <td class="r">Rs. {{ number_format($p['total_owed'], 0) }}</td>
          <td class="r">Rs. {{ number_format($p['reimbursed_paid'], 0) }}</td>
          <td class="r">Rs. {{ number_format($p['reimbursed_received'], 0) }}</td>
          <td class="r {{ $p['balance'] < 0 ? 'owes' : ($p['balance'] > 0 ? 'owed' : '') }}">
            @if($p['balance'] < 0) owes Rs. {{ number_format(-$p['balance'], 0) }}
            @elseif($p['balance'] > 0) owed Rs. {{ number_format($p['balance'], 0) }}
            @else settled @endif
          </td>
        </tr>
      @endforeach
    </tbody>
  </table>

  <h3>Transactions</h3>
  <table class="data">
    <thead>
      <tr>
        <th>Date</th><th>Who</th><th>Module</th><th>Settles</th>
        <th class="r">Amount</th><th class="r">Balance After</th>
      </tr>
    </thead>
    <tbody>
      @php $ref = $ref_partner['name'] ?? 'P1'; @endphp
      @foreach($transactions as $t)
        <tr>
          <td>{{ $t['date'] }}</td>
          <td>{{ $t['who'] }}</td>
          <td>{{ $t['module'] }}</td>
          <td>{{ $t['settles_month'] ?? '—' }}</td>
          <td class="r">Rs. {{ number_format($t['amount'], 0) }}</td>
          <td class="r">
            @if($t['balance_after'] < 0) {{ $ref }} owes Rs. {{ number_format(-$t['balance_after'], 0) }}
            @elseif($t['balance_after'] > 0) {{ $ref }} owed Rs. {{ number_format($t['balance_after'], 0) }}
            @else settled @endif
          </td>
        </tr>
      @endforeach
    </tbody>
  </table>

  <div class="foot">GamersRig — Partner Ledger</div>
</div>
</body>
</html>
