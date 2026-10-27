import { Navigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useLoginController } from '../../controllers/LoginController';
import { useSesion } from '../../controllers/SesionController';
import { rutaInicial } from '../../models/AuthModel';
import { Boton } from '../components/ui';
import './LoginPage.css';

/** Web · Iniciar sesión (general) y sus estados de error. */
export function LoginPage() {
  const { usuario } = useSesion();
  const { form, errores, aviso, enviando, cambiar, enviar } = useLoginController();

  if (usuario) return <Navigate to={rutaInicial(usuario)} replace />;

  return (
    <div className="login">
      <section className="login__imagen" aria-hidden>
        <div className="login__marca">
          <img src="/logo-ducky.png" alt="" width="30" height="28" />
          <span>Universidad Ducky</span>
        </div>
        <div className="login__lema">
          <h2>La biblioteca,<br />en una sola llave.</h2>
          <p>Administra usuarios, préstamos y el catálogo completo desde un solo lugar. Bienvenida de nuevo al sistema Biblio.</p>
          <div className="login__adorno"><span /><i /></div>
        </div>
      </section>

      <section className="login__panel">
        <a className="enlace-volver login__volver" href={import.meta.env.VITE_PORTAL_URL || '/'}>
          <ArrowLeft size={16} aria-hidden /> Volver al portal
        </a>
        <form className="login__form" onSubmit={enviar} noValidate>
          <img src="/logo-ducky.png" alt="Escudo de la Universidad Ducky" width="61" height="56" />
          <h1>Biblio</h1>
          <p className="texto-secundario">Inicia sesión con tus credenciales institucionales.</p>

          {aviso && (
            <div className={`login__aviso login__aviso--${aviso.tipo}`} role="alert">
              <AlertCircle size={18} aria-hidden />
              <div>
                <strong>{aviso.titulo}</strong>
                {aviso.texto && <p>{aviso.texto}</p>}
              </div>
            </div>
          )}

          <div className={`campo ${errores.usuario ? 'campo--error' : ''}`}>
            <label className="campo__etiqueta" htmlFor="usuario">Usuario{errores.usuario?.trim() ? ' *' : ''}</label>
            <input
              id="usuario"
              className="input"
              autoComplete="username"
              value={form.usuario}
              onChange={cambiar('usuario')}
              aria-invalid={Boolean(errores.usuario)}
              autoFocus
            />
            {errores.usuario?.trim() && <span className="campo__error">{errores.usuario}</span>}
          </div>

          <div className={`campo ${errores.contrasena ? 'campo--error' : ''}`}>
            <label className="campo__etiqueta" htmlFor="contrasena">Contraseña{errores.contrasena?.trim() ? ' *' : ''}</label>
            <input
              id="contrasena"
              type="password"
              className="input"
              autoComplete="current-password"
              value={form.contrasena}
              onChange={cambiar('contrasena')}
              aria-invalid={Boolean(errores.contrasena)}
            />
            {errores.contrasena?.trim() && <span className="campo__error">{errores.contrasena}</span>}
          </div>

          <Boton type="submit" disabled={enviando} className="login__boton">
            {enviando ? 'Entrando…' : 'Iniciar sesión'}
          </Boton>
        </form>
      </section>
    </div>
  );
}
