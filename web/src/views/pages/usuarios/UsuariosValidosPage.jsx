import { Link, useNavigate } from 'react-router-dom';
import { UserCog } from 'lucide-react';
import { useUsuariosValidosController } from '../../../controllers/UsuariosController';
import { ESTADOS_USUARIO, TONOS_PERFIL } from '../../../models/dominio';
import { Pagina } from '../../layouts/AppLayout';
import { AlertaError, Boton, Insignia, Paginacion, Tarjeta } from '../../components/ui';

/** BD-SP01-GU02 Consulta de usuarios válidos. */
export function UsuariosValidosPage() {
  const c = useUsuariosValidosController();
  const navegar = useNavigate();
  const desde = c.total ? (c.pagina - 1) * c.porPagina + 1 : 0;
  const hasta = Math.min(c.pagina * c.porPagina, c.total);

  return (
    <Pagina miga="Usuarios · Consulta" titulo="Usuarios válidos">
      <Tarjeta>
        <form
          className="fila espacio-16"
          style={{ alignItems: 'flex-end' }}
          onSubmit={(e) => { e.preventDefault(); c.buscar(); }}
        >
          <div className="campo" style={{ width: 300 }}>
            <label className="campo__etiqueta" htmlFor="buscar-matricula">Buscar por matrícula o no. de nómina</label>
            <input
              id="buscar-matricula"
              className="input"
              placeholder="Ej. 3105842"
              value={c.texto}
              onChange={(e) => c.setTexto(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <Boton type="submit">Buscar</Boton>
          <div style={{ flex: 1 }} />
          <Boton onClick={() => navegar('/usuarios/perfiles')}>Gestión de perfiles</Boton>
          <Boton onClick={() => navegar('/usuarios/carga')}>Actualizar lista de usuarios</Boton>
        </form>
      </Tarjeta>

      <AlertaError error={c.error} />
      {c.buscado && !c.cargando && (
        <p className="mt-16" style={{ fontWeight: 700 }}>
          {c.total} {c.total === 1 ? 'resultado' : 'resultados'} para «{c.buscado}»
        </p>
      )}

      <Tarjeta relleno={false} className="tabla-envoltura mt-16">
        <table className="tabla">
          <thead>
            <tr>
              <th>Matrícula / No. de nómina</th>
              <th>Nombre</th>
              <th>Perfil</th>
              <th>Estado</th>
              <th>Modificar perfil</th>
            </tr>
          </thead>
          <tbody>
            {c.usuarios.map((u) => {
              const estado = ESTADOS_USUARIO[u.Estatus];
              return (
                <tr key={u.id_usuario}>
                  <td style={{ fontWeight: 700 }}>{u.Matricula_Nomina}</td>
                  <td><Link to={`/usuarios/${u.id_usuario}`}>{u.Nombre_Completo}</Link></td>
                  <td><Insignia tono={TONOS_PERFIL[u.Nombre_Rol]}>{u.Nombre_Rol}</Insignia></td>
                  <td><Insignia tono={estado.tono}>{estado.etiqueta}</Insignia></td>
                  <td>
                    <Boton variante="secundario" chico icono={UserCog} onClick={() => navegar(`/usuarios/${u.id_usuario}/editar`)}>
                      Modificar perfil
                    </Boton>
                  </td>
                </tr>
              );
            })}
            {!c.cargando && c.usuarios.length === 0 && (
              <tr><td colSpan={5} className="tabla__vacia">No hay ningún usuario registrado con esos datos.</td></tr>
            )}
          </tbody>
        </table>
      </Tarjeta>

      <div className="fila entre mt-16">
        <span className="caption">Mostrando {desde}–{hasta} de {c.total} usuarios</span>
        <Paginacion pagina={c.pagina} totalPaginas={c.totalPaginas} onCambio={c.irAPagina} mostrarNumeros={false} />
      </div>
    </Pagina>
  );
}
