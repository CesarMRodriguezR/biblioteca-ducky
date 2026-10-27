import { Lock } from 'lucide-react';
import { usePerfilesController } from '../../../controllers/UsuariosController';
import { describirFuncion } from '../../../models/dominio';
import { Pagina } from '../../layouts/AppLayout';
import {
  Alerta, AlertaError, Boton, Cargando, EnlaceVolver, Interruptor, Radio, Tarjeta,
} from '../../components/ui';

/** BD-SP01-GU02 Gestión de perfiles (roles y funciones). */
export function PerfilesPage() {
  const c = usePerfilesController();
  const protegido = c.perfil?.Protegido;

  return (
    <Pagina miga="Usuarios · Perfiles" titulo="Gestión de perfiles">
      <EnlaceVolver to="/usuarios">Volver a Usuarios</EnlaceVolver>
      <p className="caption mb-16">
        Elige un rol y activa o desactiva las funciones que puede usar. Los cambios se aplican a todas las cuentas con ese perfil.
      </p>
      <AlertaError error={c.error} />
      {c.cargando && <Cargando />}
      {c.aviso && <div className="mb-16"><Alerta tipo={c.aviso.tipo} titulo={c.aviso.titulo}>{c.aviso.texto}</Alerta></div>}

      {!c.cargando && c.perfil && (
        <>
          <div className="columnas" style={{ gridTemplateColumns: 'minmax(0, 0.75fr) minmax(0, 1.4fr)' }}>
            <Tarjeta>
              <h2 className="mb-16">Roles</h2>
              <div className="pila espacio-16" role="radiogroup" aria-label="Roles">
                {c.perfiles.map((p) => (
                  <button
                    key={p.id_perfil}
                    type="button"
                    role="radio"
                    aria-checked={p.id_perfil === c.perfil.id_perfil}
                    className="fila espacio-12"
                    style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', alignItems: 'flex-start' }}
                    onClick={() => c.seleccionar(p.id_perfil)}
                  >
                    <span style={{ marginTop: 2 }}><Radio marcado={p.id_perfil === c.perfil.id_perfil} /></span>
                    <span>
                      <span style={{ display: 'block', fontSize: 15 }}>{p.Nombre_Rol}</span>
                      <span className="caption">{p.Descripcion_Perfil}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Tarjeta>

            <Tarjeta>
              <h2>Funciones de {c.perfil.Nombre_Rol}</h2>
              <p className="caption mt-8">
                {protegido
                  ? 'El Administrador tiene acceso completo al sistema; sus funciones no se pueden modificar.'
                  : 'Activa las funciones que tendrá este perfil.'}
              </p>
              <div className="mt-16">
                {c.funciones.map((f) => {
                  const { etiqueta, descripcion } = describirFuncion(f);
                  return (
                    <div
                      key={f.id_funcion}
                      className="fila espacio-16"
                      style={{ padding: '14px 0', borderTop: '1px solid var(--linea-divisoria)' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15 }}>{etiqueta}</div>
                        <div className="caption">{descripcion}</div>
                      </div>
                      {protegido && <Lock size={16} aria-label="Bloqueado" />}
                      <Interruptor
                        etiqueta={etiqueta}
                        activo={protegido || c.asignadas.has(f.id_funcion)}
                        deshabilitado={protegido}
                        onCambio={(activa) => c.alternar(f.id_funcion, activa)}
                      />
                    </div>
                  );
                })}
              </div>
            </Tarjeta>
          </div>
          <div className="fila fin espacio-12 mt-24">
            <Boton variante="secundario" onClick={c.cancelar} disabled={protegido || !c.hayCambios}>Cancelar</Boton>
            <Boton onClick={c.guardarCambios} disabled={protegido || !c.hayCambios || c.enviando}>
              {c.enviando ? 'Guardando…' : 'Guardar cambios'}
            </Boton>
          </div>
        </>
      )}
    </Pagina>
  );
}
