"""Ambil snapshot publik dari Apps Script, validasi, tulis config/app-config.json + logo/favicon.
Gagal (exit 1) bila nama kunci JSON memuat kata terlarang atau skema tidak valid (PRD 4.6 & K2)."""
import base64, json, os, re, sys, urllib.request

KUNCI = {'versi', 'nama_app', 'tagline', 'logo', 'favicon', 'kontak_admin', 'tema', 'jenis_paket', 'paket', 'form'}
TERLARANG = re.compile(r'(rekening|harga|tarif|nominal|honor)', re.I)
HEX = re.compile(r'^#[0-9A-Fa-f]{6}$')
EKSTENSI = {'image/png': 'png', 'image/svg+xml': 'svg', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico', 'image/jpeg': 'jpg'}

def keluaran(**kv):
    with open(os.environ.get('GITHUB_OUTPUT', os.devnull), 'a') as f:
        for k, v in kv.items(): f.write(f'{k}={v}\n')

def url_backend():
    teks = open('js/config.js', encoding='utf-8').read()
    m = re.search(r"GAS_API_URL:\s*'([^']+)'", teks)
    url = (m.group(1) if m else '').strip()
    return '' if (not url or 'GANTI' in url) else url

def ambil(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'swimacademy-sync'})
    with urllib.request.urlopen(req, timeout=60) as r: return json.loads(r.read().decode('utf-8'))

def periksa_kunci(o, jalur=''):
    if isinstance(o, dict):
        for k, v in o.items():
            if TERLARANG.search(k): sys.exit(f'GAGAL: nama kunci terlarang "{jalur}{k}" — tidak ada commit.')
            periksa_kunci(v, f'{jalur}{k}.')
    elif isinstance(o, list):
        for i, v in enumerate(o): periksa_kunci(v, f'{jalur}{i}.')

def main():
    url = url_backend()
    if not url:
        print('GAS_API_URL di js/config.js belum diisi — sinkron dilewati (mode demo).'); keluaran(lewati='ya', versi='0'); return
    res = ambil(url + '?action=publicSettings')
    if not res.get('ok'): sys.exit('GAGAL: backend menolak snapshot — ' + json.dumps(res.get('error'), ensure_ascii=False))
    d = res['data']
    luar = set(d) - KUNCI
    if luar: sys.exit('GAGAL: kunci di luar whitelist: ' + ', '.join(sorted(luar)))
    periksa_kunci(d)
    if not isinstance(d.get('nama_app'), str) or not d['nama_app'].strip(): sys.exit('GAGAL: nama_app kosong.')
    warna = (d.get('tema') or {}).get('warna') or {}
    salah = [k for k, v in warna.items() if not HEX.match(str(v))]
    if salah: sys.exit('GAGAL: warna tidak valid: ' + ', '.join(salah))
    if not isinstance((d.get('form') or {}).get('skema'), list): sys.exit('GAGAL: skema form tidak valid.')
    if not isinstance(d.get('paket'), list): sys.exit('GAGAL: daftar paket tidak valid.')
    os.makedirs('assets/brand', exist_ok=True)
    for jenis in ('logo', 'favicon'):
        if not d.get(jenis): continue
        a = ambil(url + '?action=publicAset&jenis=' + jenis)
        if not a.get('ok'): print(f'Peringatan: {jenis} tidak dapat diambil, memakai bawaan.'); d[jenis] = ''; continue
        ext = EKSTENSI.get(a['data']['mime'], 'png')
        jalur = f'assets/brand/{jenis}-kustom.{ext}'
        with open(jalur, 'wb') as f: f.write(base64.b64decode(a['data']['base64']))
        d[jenis] = jalur
    with open('config/app-config.json', 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2, sort_keys=True); f.write('\n')
    print(f'Snapshot v{d.get("versi")} valid dan ditulis.')
    keluaran(lewati='tidak', versi=str(d.get('versi', 0)))

if __name__ == '__main__':
    main()
