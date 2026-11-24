#!/usr/bin/env node
/*
 * Dados de EXEMPLO para a página farmacias/ (o mapa), enquanto o site não está ligado à API do Portal.
 * Escreve site/farmacias/farmacias-exemplo.json com ~400 farmácias fictícias, sempre as mesmas (o sorteio tem semente fixa).
 *
 * As localidades e as coordenadas aproximadas são reais; os nomes, as moradas e os contactos são inventados:
 *  - telefones +351 200 …  (não é um indicativo em uso)
 *  - emails em @exemplo.nossafarmacia.pt
 * A página mostra o aviso "dados de exemplo" enquanto o atributo data-api do mapa estiver vazio.
 *
 * Cada registo tem a forma que a página espera da API (ver README, "Farmácias"):
 *   { id, nome, latitude, longitude, morada, codigoPostal, localidade, distrito, telefone, email, horario }
 * horario: um campo por dia (seg, ter, qua, qui, sex, sab, dom) com os períodos em que a farmácia está aberta,
 *   ex. "seg": ["09:00-13:00", "14:30-19:30"] (fecha das 13:00 às 14:30); [] = encerrado nesse dia.
 *
 * Uso: npm run farmacias:exemplo
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'site', 'farmacias', 'farmacias-exemplo.json');
const TOTAL = 412;

// [localidade, distrito, latitude, longitude, código postal (4 dígitos), farmácias, raio em graus]
// O centro das localidades à beira-mar está um pouco para dentro de terra, para os pontos não caírem no mar.
const LOCAIS = [
  ['Lisboa', 'Lisboa', 38.7400, -9.1450, 1000, 0, .026],
  ['Porto', 'Porto', 41.1600, -8.6150, 4000, 24, .016],
  ['Vila Nova de Gaia', 'Porto', 41.1150, -8.5950, 4400, 14, .025],
  ['Matosinhos', 'Porto', 41.1900, -8.6700, 4450, 9, .012],
  ['Maia', 'Porto', 41.2357, -8.6199, 4470, 8, .018],
  ['Gondomar', 'Porto', 41.1440, -8.5322, 4420, 7, .018],
  ['Valongo', 'Porto', 41.1887, -8.4986, 4440, 5, .015],
  ['Póvoa de Varzim', 'Porto', 41.3830, -8.7450, 4490, 4, .008],
  ['Vila do Conde', 'Porto', 41.3530, -8.7250, 4480, 4, .008],
  ['Santo Tirso', 'Porto', 41.3426, -8.4775, 4780, 3, .012],
  ['Amarante', 'Porto', 41.2717, -8.0826, 4600, 3, .012],
  ['Penafiel', 'Porto', 41.2083, -8.2833, 4560, 3, .012],
  ['Paredes', 'Porto', 41.2050, -8.3300, 4580, 3, .012],
  ['Felgueiras', 'Porto', 41.3640, -8.1980, 4610, 2, .01],
  ['Paços de Ferreira', 'Porto', 41.2770, -8.3760, 4590, 2, .01],
  ['Braga', 'Braga', 41.5454, -8.4265, 4700, 12, .022],
  ['Guimarães', 'Braga', 41.4425, -8.2918, 4800, 8, .018],
  ['Barcelos', 'Braga', 41.5388, -8.6151, 4750, 5, .015],
  ['Vila Nova de Famalicão', 'Braga', 41.4085, -8.5198, 4760, 6, .016],
  ['Viana do Castelo', 'Viana do Castelo', 41.6960, -8.8200, 4900, 5, .01],
  ['Ponte de Lima', 'Viana do Castelo', 41.7672, -8.5836, 4990, 2, .01],
  ['Vila Real', 'Vila Real', 41.3006, -7.7441, 5000, 4, .014],
  ['Chaves', 'Vila Real', 41.7400, -7.4700, 5400, 3, .012],
  ['Bragança', 'Bragança', 41.8061, -6.7567, 5300, 3, .012],
  ['Mirandela', 'Bragança', 41.4850, -7.1820, 5370, 2, .01],
  ['Espinho', 'Aveiro', 41.0076, -8.6320, 4500, 2, .006],
  ['Santa Maria da Feira', 'Aveiro', 40.9255, -8.5435, 4520, 5, .016],
  ['São João da Madeira', 'Aveiro', 40.9000, -8.4900, 3700, 2, .008],
  ['Oliveira de Azeméis', 'Aveiro', 40.8390, -8.4770, 3720, 3, .012],
  ['Ovar', 'Aveiro', 40.8596, -8.6153, 3880, 3, .01],
  ['Aveiro', 'Aveiro', 40.6405, -8.6438, 3800, 7, .014],
  ['Ílhavo', 'Aveiro', 40.6000, -8.6680, 3830, 2, .008],
  ['Águeda', 'Aveiro', 40.5744, -8.4481, 3750, 3, .012],
  ['Coimbra', 'Coimbra', 40.2033, -8.4103, 3000, 11, .025],
  ['Figueira da Foz', 'Coimbra', 40.1550, -8.8500, 3080, 3, .008],
  ['Cantanhede', 'Coimbra', 40.3460, -8.5940, 3060, 2, .01],
  ['Viseu', 'Viseu', 40.6566, -7.9125, 3500, 7, .022],
  ['Lamego', 'Viseu', 41.0970, -7.8100, 5100, 2, .01],
  ['Guarda', 'Guarda', 40.5373, -7.2676, 6300, 3, .012],
  ['Covilhã', 'Castelo Branco', 40.2810, -7.5040, 6200, 3, .012],
  ['Fundão', 'Castelo Branco', 40.1390, -7.5010, 6230, 2, .01],
  ['Castelo Branco', 'Castelo Branco', 39.8222, -7.4909, 6000, 4, .014],
  ['Leiria', 'Leiria', 39.7436, -8.8071, 2400, 7, .022],
  ['Marinha Grande', 'Leiria', 39.7470, -8.9320, 2430, 2, .01],
  ['Pombal', 'Leiria', 39.9160, -8.6280, 3100, 2, .01],
  ['Alcobaça', 'Leiria', 39.5520, -8.9770, 2460, 2, .01],
  ['Caldas da Rainha', 'Leiria', 39.4030, -9.1380, 2500, 3, .012],
  ['Torres Vedras', 'Lisboa', 39.0910, -9.2580, 2560, 4, .014],
  ['Mafra', 'Lisboa', 38.9370, -9.3280, 2640, 3, .012],
  ['Loures', 'Lisboa', 38.8300, -9.1680, 2670, 6, .016],
  ['Odivelas', 'Lisboa', 38.7930, -9.1830, 2675, 6, .012],
  ['Amadora', 'Lisboa', 38.7590, -9.2390, 2700, 8, .014],
  ['Sintra', 'Lisboa', 38.7900, -9.3000, 2710, 10, .028],
  ['Cascais', 'Lisboa', 38.7220, -9.4000, 2750, 7, .013],
  ['Oeiras', 'Lisboa', 38.7120, -9.2850, 2780, 7, .012],
  ['Vila Franca de Xira', 'Lisboa', 38.9550, -9.0000, 2600, 5, .014],
  ['Ourém', 'Santarém', 39.6560, -8.5800, 2490, 2, .01],
  ['Tomar', 'Santarém', 39.6020, -8.4090, 2300, 2, .01],
  ['Torres Novas', 'Santarém', 39.4800, -8.5400, 2350, 2, .01],
  ['Santarém', 'Santarém', 39.2369, -8.6850, 2000, 4, .014],
  ['Abrantes', 'Santarém', 39.4660, -8.1970, 2200, 2, .01],
  ['Almada', 'Setúbal', 38.6650, -9.1600, 2800, 8, .013],
  ['Seixal', 'Setúbal', 38.6250, -9.1100, 2840, 6, .013],
  ['Barreiro', 'Setúbal', 38.6550, -9.0600, 2830, 4, .009],
  ['Montijo', 'Setúbal', 38.7000, -8.9600, 2870, 3, .009],
  ['Setúbal', 'Setúbal', 38.5320, -8.8800, 2900, 7, .013],
  ['Palmela', 'Setúbal', 38.5690, -8.9010, 2950, 2, .01],
  ['Sesimbra', 'Setúbal', 38.4560, -9.1010, 2970, 2, .007],
  ['Sines', 'Setúbal', 37.9560, -8.8600, 7520, 2, .007],
  ['Santiago do Cacém', 'Setúbal', 38.0150, -8.6940, 7540, 2, .01],
  ['Évora', 'Évora', 38.5714, -7.9135, 7000, 5, .018],
  ['Estremoz', 'Évora', 38.8440, -7.5860, 7100, 1, .008],
  ['Beja', 'Beja', 38.0151, -7.8632, 7800, 3, .012],
  ['Portalegre', 'Portalegre', 39.2967, -7.4285, 7300, 2, .01],
  ['Elvas', 'Portalegre', 38.8810, -7.1630, 7350, 2, .01],
  ['Faro', 'Faro', 37.0300, -7.9300, 8000, 5, .01],
  ['Loulé', 'Faro', 37.1380, -8.0200, 8100, 3, .01],
  ['Albufeira', 'Faro', 37.1000, -8.2500, 8200, 4, .009],
  ['Portimão', 'Faro', 37.1420, -8.5370, 8500, 4, .009],
  ['Lagos', 'Faro', 37.1060, -8.6800, 8600, 3, .007],
  ['Olhão', 'Faro', 37.0350, -7.8410, 8700, 2, .007],
  ['Tavira', 'Faro', 37.1300, -7.6480, 8800, 2, .007],
  ['Silves', 'Faro', 37.1890, -8.4380, 8300, 2, .01],
  ['Funchal', 'Madeira', 32.6660, -16.9200, 9000, 7, .009],
  ['Câmara de Lobos', 'Madeira', 32.6560, -16.9770, 9300, 1, .004],
  ['Ponta Delgada', 'Açores', 37.7500, -25.6700, 9500, 4, .007],
  ['Ribeira Grande', 'Açores', 37.8180, -25.5150, 9600, 1, .004],
  ['Angra do Heroísmo', 'Açores', 38.6600, -27.2210, 9700, 2, .005],
  ['Horta', 'Açores', 38.5380, -28.6300, 9900, 1, .003],
];
// Lisboa fica com as que faltam para chegar ao TOTAL
LOCAIS[0][5] = TOTAL - LOCAIS.slice(1).reduce((s, l) => s + l[5], 0);

const NOMES = ['Central', 'Avenida', 'Moderna', 'Saúde', 'Popular', 'Nova', 'do Mercado', 'da Estação', 'do Parque', 'Lusitana',
  'Confiança', 'São João', 'Santa Maria', 'do Castelo', 'da Ponte', 'Vitória', 'Primavera', 'do Rio', 'Atlântida', 'Higiénica',
  'da Praça', 'do Largo', 'Bem-Estar', 'da Sé', 'do Jardim', 'Santo António', 'Aliança', 'Universal', 'Progresso', 'Esperança',
  'da Vila', 'do Bairro', 'Oriente', 'Ocidental', 'Boa Vista', 'Monte Verde', 'das Flores', 'São Pedro', 'Nossa Senhora', 'Estrela'];
const RUAS = ['Rua Direita', 'Avenida da República', 'Rua 25 de Abril', 'Largo do Município', 'Rua de Santo António',
  'Avenida Dom Afonso Henriques', 'Rua da Liberdade', 'Praça da República', 'Rua Cândido dos Reis', 'Rua Miguel Bombarda',
  'Avenida 5 de Outubro', 'Rua do Comércio', 'Rua Almeida Garrett', 'Rua da Escola', 'Avenida dos Combatentes',
  'Rua Dr. António José de Almeida', 'Rua Luís de Camões', 'Avenida Infante Dom Henrique', 'Rua de Olivença', 'Rua Alexandre Herculano'];

// sorteio com semente fixa (mulberry32): os mesmos dados sempre que o script corre
let seed = 20261124;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pad = (n, k) => String(n).padStart(k, '0');
const slug = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* Horários de exemplo, com os padrões mais comuns nas farmácias portuguesas. Têm um sorteio próprio (semente a
   partir do id) para não mudarem os outros campos, que já existiam antes do horário. */
const sorteio = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
function horario(id) {
  const r = sorteio(7919 * Number(id) + 104729), um = a => a[Math.floor(r() * a.length)], p = r();
  const semana = (uteis, sab, dom) => Object.fromEntries(DIAS.map((d, i) => [d, i < 5 ? uteis : i === 5 ? sab : dom]));
  if (p < .45) { // com pausa para almoço
    const abre = um(['08:30', '09:00', '09:00']), pausa = um([['13:00', '14:00'], ['13:00', '14:30'], ['13:30', '15:00']]), fecha = um(['19:00', '19:30', '20:00']);
    return semana([`${abre}-${pausa[0]}`, `${pausa[1]}-${fecha}`], [`09:00-13:00`], []);
  }
  if (p < .75) { // horário contínuo
    const uteis = um(['08:30-20:00', '09:00-20:00', '08:00-21:00']);
    return semana([uteis], [um(['09:00-13:00', '09:00-19:00', '09:00-14:00'])], []);
  }
  if (p < .87) return semana(...Array(3).fill([um(['09:00-23:00', '10:00-23:00', '09:00-22:00'])])); // centro comercial
  if (p < .95) return semana(['09:00-13:00', '14:30-19:30'], ['09:00-13:00', '15:00-19:00'], ['10:00-13:00']); // aberta ao domingo de manhã
  return semana(...Array(3).fill(['00:00-24:00'])); // 24 horas
}

const farmacias = [];
for (const [localidade, distrito, lat, lng, cp, n, raio] of LOCAIS) {
  const usados = new Set();
  for (let i = 0; i < n; i++) {
    let nome; do nome = pick(NOMES); while (usados.has(nome) && usados.size < NOMES.length); usados.add(nome);
    const a = rnd() * 2 * Math.PI, r = raio * Math.sqrt(rnd()); // ponto ao acaso num círculo à volta do centro
    const id = pad(farmacias.length + 1, 4);
    farmacias.push({
      id,
      nome: `Farmácia ${nome}`,
      latitude: +(lat + r * Math.sin(a)).toFixed(5),
      longitude: +(lng + r * Math.cos(a) / Math.cos(lat * Math.PI / 180)).toFixed(5),
      morada: `${pick(RUAS)}, ${int(1, 240)}`,
      codigoPostal: `${cp === 1000 ? 1000 + int(0, 9) * 100 : cp === 4000 ? 4000 + int(0, 2) * 100 : cp}-${pad(int(0, 999), 3)}`,
      localidade,
      distrito,
      telefone: `+351 200 ${pad(int(0, 999), 3)} ${pad(Number(id), 3).slice(-3)}`,
      email: `${slug(nome)}.${slug(localidade)}@exemplo.nossafarmacia.pt`,
      horario: horario(id),
    });
  }
}

await fs.mkdir(path.dirname(OUT), { recursive: true });
// um registo por linha: leve e fácil de comparar no git
await fs.writeFile(OUT, '{"_aviso":"Dados de exemplo: nomes, moradas e contactos fictícios.","farmacias":[\n'
  + farmacias.map(f => JSON.stringify(f)).join(',\n') + '\n]}\n');
console.log(`${farmacias.length} farmácias de exemplo em ${path.relative(ROOT, OUT)}`);
