import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

import { buildBrCode, crc16, parseEmv, qrSvg, type EmvNode } from '../utils';
import styles from '../Playground.module.css';

// names follow the fields returned by POST /api/v1/decode/emv
const ROOT: Record<string, string> = {
  '00': 'payloadFormatIndicator',
  '01': 'pointOfInitiationMethod (12 = dinâmico)',
  '26': 'merchantAccountInformationPix',
  '52': 'merchantCategoryCode',
  '53': 'transactionCurrency (986 = BRL)',
  '54': 'transactionAmount',
  '58': 'countryCode',
  '59': 'merchantName',
  '60': 'merchantCity',
  '62': 'additionalDataFieldTemplate',
  '63': 'crc',
  '80': 'unreservedTemplates',
};
const SUB: Record<string, Record<string, string>> = {
  '26': {
    '00': 'gui',
    '01': 'pixKey',
    '02': 'additionalInformation',
    '25': 'url (location)',
  },
  '62': { '05': 'referenceLabel (txid / identifier)' },
  '80': { '00': 'gui', '25': 'url' },
};

const SAMPLE =
  '00020126780014br.gov.bcb.pix0136f4c6089a-bfde-4c00-a2d9-9eaa584b02190216CobrancaEstatica5204000053039865406546.285802BR5903Pix6008BRASILIA6229052584767c56c2ab4e65b6670de2a80950014br.gov.bcb.pix2573qr-h.sandbox.pix.bcb.gov.br/rest/api/rec/4b62d4a088fe4f51bcb4c64cf078869163044486';

function Rows({ nodes, parent }: { nodes: EmvNode[]; parent?: string }) {
  return (
    <>
      {nodes.map((n) => (
        <React.Fragment key={`${parent ?? ''}${n.id}-${n.start}`}>
          <tr className={parent ? styles.nested : undefined}>
            <td className={styles.mono}>
              {parent ? `${parent}.${n.id}` : n.id}
            </td>
            <td>
              {(parent ? SUB[parent]?.[n.id] : ROOT[n.id]) ?? 'não mapeado'}
            </td>
            <td className={styles.mono}>{n.length}</td>
            <td className='v'>
              {n.children ? '' : n.value}
              {n.error ? <span className={styles.ko}> · {n.error}</span> : null}
            </td>
          </tr>
          {n.children ? <Rows nodes={n.children} parent={n.id} /> : null}
        </React.Fragment>
      ))}
    </>
  );
}

function Decoder() {
  const [emv, setEmv] = useState(SAMPLE);
  const clean = emv.trim();
  const nodes = useMemo(() => parseEmv(clean), [clean]);
  const crcNode = nodes.find((n) => n.id === '63');
  const expected = clean.length > 4 ? crc16(clean.slice(0, -4)) : '';
  const crcOk =
    !!crcNode &&
    crcNode.value.toUpperCase() === expected &&
    clean.endsWith(crcNode.value);
  const isDynamic = nodes.some((n) => n.id === '01' && n.value === '12');
  return (
    <div className={clsx(styles.panel, styles.pad)}>
      <h3>Decodifique um copia e cola</h3>
      <div className={styles.field}>
        <label htmlFor='pg-emv'>
          BR Code <code>emv</code>
        </label>
        <textarea
          id='pg-emv'
          rows={4}
          value={emv}
          onChange={(e) => setEmv(e.target.value)}
        />
        <span className={styles.hint}>
          Cole um Pix copia e cola. Cada campo é ID (2) + tamanho (2) + valor.
        </span>
      </div>
      <div className={crcOk ? styles.okBox : styles.koBox}>
        {crcOk
          ? `CRC16 confere (${expected}). `
          : `CRC16 não confere: esperado ${expected || '—'}, encontrado ${crcNode?.value ?? 'nenhum'}. `}
        {isDynamic
          ? 'QR dinâmico: o valor real vem da URL de location.'
          : 'QR estático: chave e valor estão no próprio código.'}
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Campo</th>
              <th>Tam.</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <Rows nodes={nodes} />
          </tbody>
        </table>
      </div>
      <p className={styles.why}>
        Esta tabela é calculada no navegador. A API POST /api/v1/decode/emv faz
        o mesmo e, para QR dinâmico, ainda resolve a URL de location
        (cobLocation/recLocation).
      </p>
    </div>
  );
}

function Builder() {
  const [key, setKey] = useState('d94d2ebc-0b3e-4b48-8b96-2eddac9e4f0e');
  const [value, setValue] = useState(1990);
  const [name, setName] = useState('LOJA EXEMPLO');
  const [city, setCity] = useState('SAO PAULO');
  const [txid, setTxid] = useState('pedido1042');
  const code = buildBrCode({
    key,
    value: value || undefined,
    name,
    city,
    txid,
  });
  const svg = useMemo(() => qrSvg(code), [code]);
  return (
    <div className={clsx(styles.panel, styles.pad)}>
      <h3>Monte um QR estático</h3>
      <div className={styles.fields}>
        <div className={clsx(styles.field, styles.wide)}>
          <label htmlFor='pg-b-key'>
            Chave Pix <code>26.01</code>
          </label>
          <input
            id='pg-b-key'
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor='pg-b-val'>
            Valor em centavos <code>54</code>
          </label>
          <input
            id='pg-b-val'
            type='number'
            min={0}
            value={value}
            onChange={(e) =>
              setValue(Math.max(0, parseInt(e.target.value || '0', 10)))
            }
          />
          <span className={styles.hint}>0 omite o campo: o pagador digita</span>
        </div>
        <div className={styles.field}>
          <label htmlFor='pg-b-tx'>
            Identificador <code>62.05</code>
          </label>
          <input
            id='pg-b-tx'
            value={txid}
            maxLength={25}
            onChange={(e) => setTxid(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor='pg-b-name'>
            Nome <code>59</code>
          </label>
          <input
            id='pg-b-name'
            value={name}
            maxLength={25}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor='pg-b-city'>
            Cidade <code>60</code>
          </label>
          <input
            id='pg-b-city'
            value={city}
            maxLength={15}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.qrRow}>
        <div
          className={styles.qrTile}
          aria-label='QR Code gerado'
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className={styles.col}>
          <div className={styles.brcode}>{code}</div>
          <p className={styles.why}>
            Gerado aqui com CRC16-CCITT (polinômio 0x1021, início 0xFFFF). Para
            receber de verdade, prefira o QR estático da API, que já vem ligado
            à sua conta e identifica o pagamento.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EmvInspector() {
  return (
    <div className={styles.halves}>
      <Decoder />
      <Builder />
    </div>
  );
}
