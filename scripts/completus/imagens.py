#!/usr/bin/env python3
"""
Imagens da página Completus a partir dos renders em assets/3D_<produto>/ (os originais não vão para o git).

Para cada produto de scripts/completus/angulos.json escreve em site/img/completus/<slug>/:
  capa-640.webp e capa-1200.webp   a imagem do cartão e do topo da página (quadrada)
  recorte.webp                     a embalagem sem fundo (até 720 px), ao lado da ficha do produto
  angulo-1.webp … angulo-N.webp    as vistas para rodar a embalagem (1200×1200), todas com a embalagem
                                   à mesma altura, para não "saltar" de tamanho ao rodar

A embalagem é encontrada pela cor (o fundo do estúdio é cinzento); quando o recorte passa da imagem,
o fundo é prolongado. Escreve também site/img/completus/gama-1000.webp e gama-2000.webp, o topo da página da
gama, a partir da fotografia de família da gama (assets/familia.png, as 12 embalagens sem fundo). Uso: python3 scripts/completus/imagens.py   (precisa do Pillow: pip install pillow)
"""
import json, os, unicodedata
from PIL import Image, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ASSETS = os.path.join(RAIZ, 'assets')
SAIDA = os.path.join(RAIZ, 'site', 'img', 'completus')
CFG = {k: v for k, v in json.load(open(os.path.join(RAIZ, 'scripts', 'completus', 'angulos.json'))).items() if not k.startswith('_')}

nfc = lambda s: unicodedata.normalize('NFC', s)  # o macOS guarda os nomes com acentos decompostos

def caminho(pasta, nome):
    d = next(os.path.join(ASSETS, x) for x in os.listdir(ASSETS) if nfc(x) == nfc(pasta))
    return next(os.path.join(d, f) for f in os.listdir(d) if nfc(f) == nfc(nome))

def caixa(im):
    """Retângulo da embalagem: os píxeis com cor (o fundo e a sombra são cinzentos)."""
    s = im.convert('RGB').resize((im.width // 8, im.height // 8)).convert('HSV').getchannel('S')
    b = s.point(lambda v: 255 if v > 60 else 0).filter(ImageFilter.MinFilter(3)).getbbox()
    return tuple(v * 8 for v in b) if b else (0, 0, im.width, im.height)

def prolonga(im, p):
    """Alarga a imagem p píxeis para cada lado, esticando o fundo (as bordas dos renders têm uma linha escura)."""
    W, H, i = im.width, im.height, 12
    c = Image.new('RGB', (W + 2 * p, H + 2 * p)); c.paste(im, (p, p))
    c.paste(im.crop((0, i, W, i + 1)).resize((W, p + i)), (p, 0))
    c.paste(im.crop((0, H - i - 1, W, H - i)).resize((W, p + i)), (p, H + p - i))
    c.paste(c.crop((p + i, 0, p + i + 1, H + 2 * p)).resize((p + i, H + 2 * p)), (0, 0))
    c.paste(c.crop((W + p - i - 1, 0, W + p - i, H + 2 * p)).resize((p + i, H + 2 * p)), (W + p - i, 0))
    return c

def quadrado(im, cx, cy, lado):
    lado = int(lado); L, T = int(cx - lado / 2), int(cy - lado / 2)
    p = max(0, -L, -T, L + lado - im.width, T + lado - im.height)
    if p: im = prolonga(im, p); L += p; T += p
    return im.crop((L, T, L + lado, T + lado))

for slug, c in CFG.items():
    out = os.path.join(SAIDA, slug); os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        if f.startswith(('capa-', 'angulo-')): os.remove(os.path.join(out, f))
    ims = {n: Image.open(caminho(c['pasta'], n)).convert('RGB') for n in set([c['capa']] + c['angulos'])}
    cx = {n: caixa(im) for n, im in ims.items()}
    # capa: a embalagem ocupa ~66% da altura (ou ~78% da largura, se for larga)
    x0, y0, x1, y1 = cx[c['capa']]
    capa = quadrado(ims[c['capa']], (x0 + x1) / 2, (y0 + y1) / 2, max((y1 - y0) / .66, (x1 - x0) / .78))
    for s in (1200, 640): capa.resize((s, s), Image.LANCZOS).save(f'{out}/capa-{s}.webp', 'WEBP', quality=82, method=6)
    if len(c['angulos']) > 1:
        k = max(max(1 / .66, (b[2] - b[0]) / (b[3] - b[1]) / .8) for b in (cx[n] for n in c['angulos']))
        for i, n in enumerate(c['angulos'], 1):
            b = cx[n]
            quadrado(ims[n], (b[0] + b[2]) / 2, (b[1] + b[3]) / 2, (b[3] - b[1]) * k).resize((1200, 1200), Image.LANCZOS) \
                .save(f'{out}/angulo-{i}.webp', 'WEBP', quality=80, method=6)
    print(f'{slug}: capa + {len(c["angulos"]) if len(c["angulos"]) > 1 else 0} ângulos')

def recorte(slug):
    c = CFG[slug]; r = c['recorte']
    im = Image.open(os.path.join(RAIZ, r) if '/' in r else caminho(c['pasta'], r)).convert('RGBA')
    im.putalpha(im.getchannel('A').point(lambda v: 0 if v < 40 else v))  # limpa o halo quase invisível à volta do recorte
    return im.crop(im.getchannel('A').getbbox())
for slug in CFG:  # a embalagem sem fundo de cada produto, para a página dele
    r = recorte(slug); r.thumbnail((720, 720), Image.LANCZOS)
    r.save(os.path.join(SAIDA, slug, 'recorte.webp'), 'WEBP', quality=86, method=6)
# ---------- topo da gama: a fotografia de família, cortada à volta das embalagens ----------
gama = Image.open(os.path.join(ASSETS, 'familia.png')).convert('RGBA')
gama = gama.crop(gama.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
for s in (2000, 1000):
    g = gama.resize((s, round(gama.height * s / gama.width)), Image.LANCZOS)
    g.save(os.path.join(SAIDA, f'gama-{s}.webp'), 'WEBP', quality=84, method=6)
print(f'gama: {gama.width}x{gama.height} → gama-2000.webp e gama-1000.webp ({round(gama.height * 1000 / gama.width)} px de altura a 1000)')
