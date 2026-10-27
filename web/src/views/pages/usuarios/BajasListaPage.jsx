import { UserX } from 'lucide-react';
import { useBajasListaController } from '../../../controllers/UsuariosController';
import { TONOS_PERFIL, formatoMoneda } from '../../../models/dominio';
import { Pagina } from '../../layouts/AppLayout';
import { SelectorArchivo } from '../../components/SelectorArchivo';
import {
  Alerta, AlertaError, Boton, Cargando, EnlaceVolver, Insignia, Tarjeta,
} from '../../components/ui';

function TablaUsuarios({ filas, conMotivo }) {
  return (
    <Tarjeta relleno={false} className="tabla-envoltura">
      <table className="tabla">
        <thead>
          <tr>
            <th>Usuario</th><th>Matrícula / No. de nómina</th><th>Perfil</th>
            <th>Libros prestados</th><th>Multas pendientes</th><th>{conMotivo ? 'Motivo' : 'Estatus'}</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((u) => (
            <tr key={u.id_usuario}>
              <td style={{ fontWeight: 700 }}>{u.Nombre_Usuario}</td>
              <td>{u.Matricula_Nomina}</td>
              <td><Insignia tono={TONOS_PERFIL[u.Nombre_Rol]}>{u.Nombre_Rol}</Insignia></td>
              <td>{u.Libros_Prestados}</td>
              <td>{u.Multas_Pendientes > 0 ? formatoMoneda(u.Multas_Pendientes) : '—'}</td>
              <td>
                {conMotivo
                  ? <span style={{ color: 'var(--error)', fontWeight: 700 }}>{u.Motivo}</span>
                  : <Insignia tono={u.Estatus === 'Inactivo' ? 'neutro' : 'exito'}>{u.Estatus}</Insignia>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Tarjeta>
  );
}

/** BD-SP01-GU02 Baja de cuentas (revisión, versión exitosa y fallida). */
export function BajasListaPage() {
  const c = useBajasListaController();
  const n = c.candidatos?.length ?? 0;

  return (
    <Pagina miga="Usuarios · Baja" titulo="Baja de cuentas">
      <EnlaceVolver to="/usuarios">Volver a Usuarios</EnlaceVolver>
      <AlertaError error={c.error} />

      {!c.candidatos && !c.procesando && (
        <SelectorArchivo
          titulo="Carga la lista vigente de Servicios Escolares"
          descripcion="Las cuentas que ya no aparezcan en la lista (por egreso o baja de la universidad) se propondrán para darse de baja."
          onArchivo={c.cargarArchivo}
          procesando={c.procesando}
        />
      )}
      {c.procesando && !c.candidatos && <Cargando texto="Comparando la lista…" />}

      {c.candidatos && !c.resultado && (
        <>
          <Tarjeta className="fila espacio-16 mb-16">
            <div style={{ width: 36, height: 28, borderRadius: 14, background: 'var(--advertencia-fondo)', color: 'var(--advertencia)', display: 'grid', placeItems: 'center' }}>
              <UserX size={16} aria-hidden />
            </div>
            <div>
              <strong>{n === 1 ? '1 usuario ya no aparece' : `${n} usuarios ya no aparecen`} en la nueva lista</strong>
              <p className="caption">{c.nombreArchivo ? `${c.nombreArchivo} · ` : ''}por egreso o baja de la universidad</p>
            </div>
          </Tarjeta>
          {n > 0 ? (
            <>
              <TablaUsuarios filas={c.candidatos} />
              <p className="caption mt-8">Las cuentas con libros prestados o multas pendientes no se darán de baja.</p>
              <Boton className="mt-16" onClick={c.confirmarBajas} disabled={c.procesando}>
                {c.procesando ? 'Procesando…' : 'Confirmar bajas'}
              </Boton>
            </>
          ) : (
            <Alerta tipo="exito" titulo="Todas las cuentas activas aparecen en la lista." />
          )}
        </>
      )}

      {c.resultado && (
        <>
          {c.resultado.dadosDeBaja.length > 0 && (
            <>
              <Alerta tipo="exito" titulo={`Se dieron de baja ${c.resultado.dadosDeBaja.length} ${c.resultado.dadosDeBaja.length === 1 ? 'cuenta' : 'cuentas'}.`}>
                Las cuentas quedaron inactivas y ya no pueden iniciar sesión.
              </Alerta>
              <div className="mt-16"><TablaUsuarios filas={c.resultado.dadosDeBaja} /></div>
            </>
          )}
          {c.resultado.rechazados.length > 0 && (
            <>
              <div className="mt-24">
                <Alerta
                  tipo="error"
                  titulo={`${c.resultado.rechazados.length === 1 ? '1 cuenta no se dio' : `${c.resultado.rechazados.length} cuentas no se dieron`} de baja.`}
                >
                  Deben devolver sus libros y pagar sus multas antes de la baja.
                </Alerta>
              </div>
              <div className="mt-16"><TablaUsuarios filas={c.resultado.rechazados} conMotivo /></div>
            </>
          )}
        </>
      )}
    </Pagina>
  );
}
