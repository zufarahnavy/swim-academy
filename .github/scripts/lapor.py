"""Lapor hasil sinkron+deploy ke backend (aksi sync.ack, dilindungi SYNC_SECRET)."""
import json, os, re, sys, urllib.request

teks = open('js/config.js', encoding='utf-8').read()
m = re.search(r"GAS_API_URL:\s*'([^']+)'", teks)
url = m.group(1) if m else ''
rahasia = os.environ.get('SYNC_SECRET', '')
if not url or 'GANTI' in url or not rahasia:
    print('Backend/SYNC_SECRET belum diatur — laporan dilewati.'); sys.exit(0)
ok = os.environ.get('HASIL_SINKRON') == 'success' and os.environ.get('HASIL_DEPLOY') == 'success'
badan = json.dumps({'action': 'sync.ack', 'payload': {'secret': rahasia, 'status': 'success' if ok else 'failure',
                    'pesan': 'Deploy selesai.' if ok else f"Sinkron: {os.environ.get('HASIL_SINKRON')}, deploy: {os.environ.get('HASIL_DEPLOY')}"}}).encode()
req = urllib.request.Request(url, data=badan, headers={'Content-Type': 'text/plain;charset=utf-8'}, method='POST')
with urllib.request.urlopen(req, timeout=60) as r: print(r.read().decode()[:300])
