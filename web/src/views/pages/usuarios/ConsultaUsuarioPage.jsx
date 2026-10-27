import { useNavigate } from 'react-router-dom';
import { UserCog } from 'lucide-react';
import { useConsultaUsuarioController } from '../../../controllers/UsuariosController';
import { ESTADOS_USUARIO, TONOS_PERFIL, formatoMoneda, iniciales } from '../../../models/dominio';
import { Pagina } from '../../layouts/AppLayout';
import {
  Alerta, Boton, Cargando, DatoEtiquetado, EnlaceVolver, Insignia, Tarjeta,
} from '../../components/ui';

/** BD-SP01-GU02 Consulta de un usuario (versiones exitosa y fallida). */
export function ConsultaUsuarioPage() {
  const c = useConsultaUsuarioController();
  const navegar = useNavigate();
  const u = c.usuario;

  return (
    <Pagina miga="Usuarios · Perfil" titulo="Consulta de usuario" ancho={980}>
      <EnlaceVolver to="/usuarios">Volver a Usuarios</EnlaceVolver>
      <Tarjeta>
        <form className="fila espacio-16" style={{ alignItems: 'flex-end' }} onSubmit={(e) => { e.preventDefault(); c.buscar(); }}>
          <div className="campo" style={{ flex: 1, maxWidth: 360 }}>
            <label className="campo__etiqueta" htmlFor="matricula">Matrícula o número de nómina</label>
            <input id="matricula" className="input" value={c.matricula} onChange={(e) => c.setMatricula(e.target.value)} inputMode="numeric" />
          </div>
          <Boton type="submit">Buscar</Boton>
        </form>
      </Tarjeta>

      {c.cargando && <Cargando />}
      {c.error && (
        <div className="mt-16">
          <Alerta tipo="error" titulo={c.error.message}>Revisa que el número esté bien escrito.</Alerta>
        </div>
      )}

      {u && !c.cargando && (
        <Tarjeta className="mt-24">
          <div className="fila espacio-16">
            <div className="avatar" style={{ width: 56, height: 56, fontSize: 18, background: 'var(--azul-principal)', color: '#fff' }}>
              {iniciales(u.Nombre_Completo)}
            </div>
            <div style={{ flex: 1 }}>
              <h2>{u.Nombre_Completo}</h2>
              <span className="caption">Perfil de usuario</span>
            </div>
            <Boton variante="secundario" icono={UserCog} onClick={() => navegar(`/usuarios/${u.id_usuario}/editar`)}>
              Modificar perfil
            </Boton>
          </div>
          <div className="grid-3 mt-24">
            <DatoEtiquetado etiqueta="Matrícula / No. de nómina" valor={u.Matricula_Nomina} />
            <DatoEtiquetado etiqueta="Usuario" valor={u.Nombre_Usuario} />
            <DatoEtiquetado etiqueta="Correo institucional" valor={u.Correo} />
            <div>
              <div className="etiqueta-dato">Perfil</div>
              <div className="mt-8"><Insignia tono={TONOS_PERFIL[u.Nombre_Rol]}>{u.Nombre_Rol}</Insignia></div>
            </div>
            <div>
              <div className="etiqueta-dato">Estatus</div>
              <div className="mt-8"><Insignia tono={ESTADOS_USUARIO[u.Estatus].tono}>{u.Estatus}</Insignia></div>
            </div>
            <DatoEtiquetado
              etiqueta="Préstamos / multas"
              valor={`${u.Libros_Prestados} libro(s) · ${u.Multas_Pendientes ? formatoMoneda(u.Multas_Pendientes) : 'sin multas'}`}
            />
          </div>
          <p className="caption mt-24">Por seguridad, la contraseña no se muestra.</p>
        </Tarjeta>
      )}
    </Pagina>
  );
}
