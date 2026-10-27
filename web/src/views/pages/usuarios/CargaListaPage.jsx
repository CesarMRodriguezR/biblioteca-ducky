import { ListChecks } from 'lucide-react';
import { useCargaListaController } from '../../../controllers/UsuariosController';
import { TONOS_PERFIL, describirFuncion } from '../../../models/dominio';
import { Pagina } from '../../layouts/AppLayout';
import { SelectorArchivo } from '../../components/SelectorArchivo';
import {
  Alerta, AlertaError, Boton, EnlaceVolver, Insignia, Tarjeta,
} from '../../components/ui';

const ETIQUETAS_FUNCION = {
  gestionar_usuarios: 'Gestión de usuarios',
  gestionar_libros: 'Gestión de libros',
  buscar_libros: 'Búsqueda de libros',
};

function resumenFunciones(funciones = []) {
  const principales = funciones.filter((f) => ETIQUETAS_FUNCION[f]).map((f) => ETIQUETAS_FUNCION[f]);
  const texto = principales.join(', ');
  return texto ? texto.charAt(0) + texto.slice(1).toLowerCase() : describirFuncion({ Nombre_Funcion: funciones[0] ?? '—' }).etiqueta;
}

function TablaErrores({ errores }) {
  if (!errores.length) return null;
  return (
    <>
      <h2 className="mt-32 mb-16">Cuentas no creadas</h2>
      <p className="caption mb-16">Corrige estos registros en la lista y vuelve a cargarla; los demás ya quedaron registrados.</p>
      <Tarjeta relleno={false} className="tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr><th>Fila</th><th>Matrícula / No. de nómina</th><th>Nombre</th><th>Campo</th><th>Error</th></tr>
          </thead>
          <tbody>
            {errores.map((e) => (
              <tr key={`${e.Fila}-${e.Campo}`}>
                <td style={{ fontWeight: 700 }}>{e.Fila}</td>
                <td>{e.Matricula_Nomina}</td>
                <td>{e.Nombre_Completo}</td>
                <td>{e.Campo}</td>
                <td style={{ color: 'var(--error)', fontWeight: 700 }}>{e.Error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Tarjeta>
    </>
  );
}

/** BD-SP01-GU02 Alta de cuentas por lista (revisión, versión exitosa y fallida). */
export function CargaListaPage() {
  const c = useCargaListaController();

  return (
    <Pagina miga="Usuarios · Carga de lista" titulo="Alta de cuentas por lista">
      <EnlaceVolver to="/usuarios">Volver a Usuarios</EnlaceVolver>
      <AlertaError error={c.error} />

      {!c.revision && (
        <div className={c.error ? 'mt-16' : undefined}>
          <SelectorArchivo
            titulo="Carga la lista de Servicios Escolares"
            descripcion="Archivo .xlsx o .csv con las columnas Usuario, Matrícula / No. de nómina, Nombre y Correo institucional."
            onArchivo={c.cargarArchivo}
            procesando={c.procesando}
          />
        </div>
      )}

      {c.revision && !c.resultado && (
        <>
          <Tarjeta className="fila espacio-16">
            <div style={{ width: 36, height: 28, borderRadius: 14, background: 'var(--informacion-fondo)', color: 'var(--azul-principal)', display: 'grid', placeItems: 'center' }}>
              <ListChecks size={16} aria-hidden />
            </div>
            <div style={{ flex: 1 }}>
              <strong>Lista cargada</strong>
              <p className="caption">
                {c.archivo?.name} · {c.revision.validos.length} registros · asigna el rol de cada usuario y confirma el registro
              </p>
            </div>
            <Boton variante="texto" onClick={c.reiniciar}>Cambiar archivo</Boton>
            <Boton onClick={c.confirmarRegistro} disabled={c.procesando || !c.revision.validos.length}>
              {c.procesando ? 'Registrando…' : 'Confirmar registro'}
            </Boton>
          </Tarjeta>

          <h2 className="mt-24">Nuevos usuarios</h2>
          <p className="caption mt-8 mb-16">
            Revisa los usuarios de la lista y asigna el rol que tendrá cada uno. El rol define las funciones disponibles para la cuenta.
            {c.sinRol > 0 && ` Los ${c.sinRol} registro(s) sin rol no se crearán.`}
          </p>
          <Tarjeta relleno={false} className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr><th>Usuario</th><th>Matrícula / No. de nómina</th><th>Nombre</th><th>Correo institucional</th><th>Rol</th></tr>
              </thead>
              <tbody>
                {c.revision.validos.map((v) => (
                  <tr key={v.Fila}>
                    <td style={{ fontWeight: 700 }}>{v.Nombre_Usuario}</td>
                    <td>{v.Matricula_Nomina}</td>
                    <td>{v.Nombre_Completo}</td>
                    <td>{v.Correo}</td>
                    <td style={{ width: 180 }}>
                      <select
                        className="select"
                        aria-label={`Rol de ${v.Nombre_Usuario}`}
                        value={c.roles[v.Fila] ?? ''}
                        onChange={(e) => c.asignarRol(v.Fila, e.target.value)}
                      >
                        <option value="">Seleccionar rol</option>
                        {c.perfiles.map((p) => <option key={p.id_perfil} value={p.id_perfil}>{p.Nombre_Rol}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {!c.revision.validos.length && (
                  <tr><td colSpan={5} className="tabla__vacia">Ningún registro de la lista es válido.</td></tr>
                )}
              </tbody>
            </table>
          </Tarjeta>
          <TablaErrores errores={c.revision.errores} />
        </>
      )}

      {c.resultado && (
        <>
          {c.resultado.creados.length > 0 && (
            <Alerta tipo="exito" titulo={`Se crearon ${c.resultado.creados.length} ${c.resultado.creados.length === 1 ? 'cuenta' : 'cuentas'}. Ya están disponibles en tiempo real.`} />
          )}
          {c.resultado.creados.length === 0 && <Alerta tipo="error" titulo="No se creó ninguna cuenta." />}
          {c.resultado.creados.length > 0 && (
            <>
              <h2 className="mt-24 mb-16">Cuentas creadas</h2>
              <Tarjeta relleno={false} className="tabla-envoltura">
                <table className="tabla">
                  <thead>
                    <tr><th>Usuario</th><th>Matrícula / No. de nómina</th><th>Contraseña</th><th>Perfil</th><th>Estatus</th><th>Funciones asignadas</th></tr>
                  </thead>
                  <tbody>
                    {c.resultado.creados.map((u) => (
                      <tr key={u.id_usuario}>
                        <td style={{ fontWeight: 700 }}>{u.Nombre_Usuario}</td>
                        <td>{u.Matricula_Nomina}</td>
                        <td>{u.Contrasena_Inicial}</td>
                        <td><Insignia tono={TONOS_PERFIL[u.Nombre_Rol]}>{u.Nombre_Rol}</Insignia></td>
                        <td><Insignia tono="exito">{u.Estatus}</Insignia></td>
                        <td>{resumenFunciones(u.funciones)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Tarjeta>
              <p className="caption mt-8">La contraseña inicial es la matrícula a 10 dígitos; solo se muestra en esta pantalla.</p>
            </>
          )}
          <TablaErrores errores={c.resultado.errores} />
          <div className="fila espacio-12 mt-24">
            <Boton variante="secundario" onClick={c.revisarBajas}>Revisar bajas de la lista</Boton>
            {c.resultado.errores.length > 0 && <Boton variante="texto" onClick={c.reiniciar}>Cargar registros corregidos</Boton>}
          </div>
        </>
      )}
    </Pagina>
  );
}
