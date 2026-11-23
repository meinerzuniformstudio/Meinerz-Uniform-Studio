import ThemeSelector from '../theme-selector';
import { service } from '@/lib/api';
import { Brand } from '../brand';
import { chatGPTSignInPath, getChatGPTUser } from '../chatgpt-auth';
import HeroComposition from './hero-composition';
import './home-hero.css';
export const dynamic = 'force-dynamic';
export default async function Login() {
  const user = await getChatGPTUser();
  let displayName = user?.displayName || '';
  if (user) { try { displayName = (await service().profile(user)).displayName; } catch { /* The entry remains available while storage recovers. */ } }
  return <main className="login-page creative-entry">
    <section className="login-art">
      <Brand />
      <span className="entry-brand-note">DESIGN / ESPORTE / PRODUÇÃO</span>
      <div className="login-statement"><p className="eyebrow">MEINERZ UNIFORM STUDIO</p><h1><span>Uniformes.</span><span>Apresentações.</span><span className="entry-headline-accent">Pedidos.</span></h1><p>Crie o uniforme, organize a lista<br/>e prepare o pedido para produção.</p></div>
      <HeroComposition/>
      <footer className="login-art-footer"><span>UNIFORMES · APRESENTAÇÕES · PEDIDOS</span><span>CRIADO POR ANDREI RAIMUNDI</span></footer>
      <a className="entry-mobile-jump" href="#studio-access">Entrar no estúdio ↓</a>
    </section>
    <section className="login-form-section" id="studio-access">
      <div className="login-form"><ThemeSelector/><span className="tiny-line" /><p className="eyebrow">ACESSO AO MEINERZ UNIFORM STUDIO</p><h2>{user ? `Olá, ${displayName.split(' ')[0]}.` : 'Entrar no Meinerz'}</h2><p className="body-copy">Acesse seus projetos, listas, orçamentos e pedidos.</p>
        {user ? <a className="gold-button login-cta" href="/pedidos">Acessar meus pedidos <span>↗</span></a> : <a className="gold-button login-cta" href={chatGPTSignInPath('/pedidos')} target="_top">Entrar com ChatGPT <span>↗</span></a>}
        <p className="signin-explanation">Use o e-mail da sua conta ChatGPT.<br />Seus projetos ficam vinculados à sua conta.</p>
        <a className="outline-button simulator-entry-cta" href="/simulador" target="_top">Abrir simulador <span>↗</span></a>
        <div className="login-features"><p><span>01</span><span><strong>Simulador</strong>Cores, grafismos e personalização.</span></p><p><span>02</span><span><strong>Apresentações 3D</strong>Visualização e aprovação do uniforme.</span></p><p><span>03</span><span><strong>Pedidos</strong>Arquivos e listas para cada indústria.</span></p></div>
      </div><p className="login-bottom">MEINERZ UNIFORM STUDIO · POR ANDREI RAIMUNDI</p>
    </section>
  </main>;
}
