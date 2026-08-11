import { ImageResponse } from 'next/og';
import { APP_NAME } from '@/constants';

export const alt = `${APP_NAME} — gestão profissional e treino com autonomia`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden', background: '#f5f5ef', color: '#090a08', padding: 72 }}>
      <div style={{ position: 'absolute', width: 410, height: 410, borderRadius: 999, border: '82px solid #c9ff32', right: -90, top: -140, opacity: 0.78 }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 62, height: 62, borderRadius: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090a08', color: '#c9ff32', fontSize: 23, fontWeight: 900 }}>GK</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#000000', fontSize: 31, fontWeight: 900 }}>{APP_NAME}</span>
            <span style={{ marginTop: 2, fontSize: 14, letterSpacing: '0.28em', color: '#5c6255' }}>PERFORMANCE SYSTEM</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900 }}>
          <span style={{ fontSize: 91, lineHeight: 0.86, letterSpacing: '-0.065em', fontWeight: 900 }}>FORÇA NA GESTÃO.</span>
          <span style={{ marginTop: 12, fontSize: 91, lineHeight: 0.86, letterSpacing: '-0.065em', fontWeight: 900, color: '#668f00' }}>FOCO NO RESULTADO.</span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ borderRadius: 999, background: '#090a08', color: 'white', padding: '12px 20px', fontSize: 17, fontWeight: 700 }}>Personal + aluno</span>
          <span style={{ borderRadius: 999, background: '#c9ff32', padding: '12px 20px', fontSize: 17, fontWeight: 700 }}>Treino independente</span>
        </div>
      </div>
    </div>,
    size,
  );
}
